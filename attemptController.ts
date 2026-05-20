import crypto from 'crypto';
import { Response } from 'express';
import { Exam } from '../models/Exam.js';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Question } from '../models/Question.js';
import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { gradeAnswer } from '../utils/grading.js';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function studentCanAccessExam(examId: string, studentId: string): Promise<boolean> {
  const exam = await Exam.findById(examId);
  if (!exam) return false;
  const batches = await Batch.find({ students: studentId }).select('_id');
  const user = await User.findById(studentId);
  const batchIds = batches.map((b) => String(b._id));
  if (user?.batch) batchIds.push(String(user.batch));
  return exam.batches.some((b) => batchIds.includes(String(b)));
}

export const startAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findById(req.params.examId).populate('questions');
  if (!exam) throw new ApiError(404, 'Exam not found');

  const canAccess = await studentCanAccessExam(String(exam._id), req.user!.id);
  if (!canAccess) throw new ApiError(403, 'You are not assigned to this exam');

  const now = new Date();
  if (now < exam.startTime) throw new ApiError(400, 'Exam has not started yet');
  if (now > exam.endTime) throw new ApiError(400, 'Exam window has ended');

  let attempt = await ExamAttempt.findOne({ exam: exam._id, student: req.user!.id });

  if (attempt) {
    if (attempt.status === 'submitted' || attempt.status === 'graded') {
      throw new ApiError(400, 'Exam already submitted');
    }
    if (now > attempt.expiresAt) {
      attempt.status = 'expired';
      await attempt.save();
      throw new ApiError(400, 'Exam time expired');
    }
    res.json({
      success: true,
      data: {
        attempt,
        exam: sanitizeExamForStudent(exam),
        sessionToken: attempt.sessionToken,
      },
    });
    return;
  }

  const expiresAt = new Date(Math.min(
    now.getTime() + exam.duration * 60 * 1000,
    exam.endTime.getTime()
  ));

  const sessionToken = crypto.randomBytes(32).toString('hex');

  attempt = await ExamAttempt.create({
    exam: exam._id,
    student: req.user!.id,
    expiresAt,
    sessionToken,
    answers: [],
    status: 'in_progress',
  });

  res.status(201).json({
    success: true,
    data: {
      attempt,
      exam: sanitizeExamForStudent(exam),
      sessionToken,
    },
  });
});

function sanitizeExamForStudent(exam: InstanceType<typeof Exam>) {
  let questions = [...(exam.questions as unknown as InstanceType<typeof Question>[])];
  if (exam.shuffleQuestions) questions = shuffleArray(questions);

  const sanitized = questions.map((q) => {
    let options = q.options.map((o) => ({
      _id: (o as typeof o & { _id: { toString: () => string } })._id,
      text: o.text,
    }));
    if (exam.shuffleOptions) options = shuffleArray(options);

    const base: Record<string, unknown> = {
      _id: q._id,
      text: q.text,
      type: q.type,
      marks: q.marks,
      options: q.type.startsWith('mcq') ? options : undefined,
    };
    if (q.type === 'true_false') {
      base.options = [{ _id: 'true', text: 'True' }, { _id: 'false', text: 'False' }];
    }
    return base;
  });

  return {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    duration: exam.duration,
    allowReview: exam.allowReview,
    questions: sanitized,
    expiresAt: undefined,
  };
}

export const saveAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questionId, selectedOptions, textAnswer, markedForReview } = req.body;
  const attempt = await ExamAttempt.findOne({
    exam: req.params.examId,
    student: req.user!.id,
    status: 'in_progress',
  });

  if (!attempt) throw new ApiError(404, 'No active attempt');
  if (new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    throw new ApiError(400, 'Exam time expired');
  }

  const idx = attempt.answers.findIndex((a) => String(a.questionId) === questionId);
  const answerData = {
    questionId,
    selectedOptions,
    textAnswer,
    markedForReview: markedForReview ?? false,
  };

  if (idx >= 0) {
    attempt.answers[idx] = { ...attempt.answers[idx], ...answerData };
  } else {
    attempt.answers.push(answerData);
  }

  await attempt.save();
  res.json({ success: true, data: attempt.answers });
});

export const reportTabSwitch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempt = await ExamAttempt.findOneAndUpdate(
    { exam: req.params.examId, student: req.user!.id, status: 'in_progress' },
    { $inc: { tabSwitchCount: 1 } },
    { new: true }
  );
  if (!attempt) throw new ApiError(404, 'No active attempt');
  res.json({ success: true, data: { tabSwitchCount: attempt.tabSwitchCount } });
});

export const submitAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempt = await ExamAttempt.findOne({
    exam: req.params.examId,
    student: req.user!.id,
    status: 'in_progress',
  });

  if (!attempt) throw new ApiError(404, 'No active attempt');

  const exam = await Exam.findById(req.params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const questions = await Question.find({ _id: { $in: exam.questions } });
  let score = 0;
  let needsManual = false;

  for (const question of questions) {
    const answerIdx = attempt.answers.findIndex(
      (a) => String(a.questionId) === String(question._id)
    );
    let answer = answerIdx >= 0 ? attempt.answers[answerIdx] : {
      questionId: question._id,
      selectedOptions: [],
      textAnswer: '',
    };

    const graded = gradeAnswer(question, answer);
    answer = {
      ...answer,
      isCorrect: graded.isCorrect,
      marksAwarded: graded.marksAwarded,
      needsManualGrading: graded.needsManualGrading,
    };

    if (graded.needsManualGrading) needsManual = true;
    score += graded.marksAwarded;

    if (answerIdx >= 0) attempt.answers[answerIdx] = answer;
    else attempt.answers.push(answer);
  }

  const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;
  const passed = score >= exam.passingMarks;

  attempt.score = score;
  attempt.percentage = Math.round(percentage * 100) / 100;
  attempt.passed = passed;
  attempt.submittedAt = new Date();
  attempt.status = needsManual ? 'submitted' : 'graded';

  await attempt.save();

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      score,
      totalMarks: exam.totalMarks,
      percentage: attempt.percentage,
      passed,
      status: attempt.status,
    },
  });
});

export const getAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempt = await ExamAttempt.findById(req.params.attemptId)
    .populate('exam', 'title totalMarks passingMarks')
    .populate('student', 'name email');

  if (!attempt) throw new ApiError(404, 'Attempt not found');

  const isOwner = String(attempt.student._id) === req.user!.id;
  const isInstructor = req.user!.role === 'instructor' || req.user!.role === 'admin';
  if (!isOwner && !isInstructor) throw new ApiError(403, 'Access denied');

  const questions = await Question.find({
    _id: { $in: (attempt.exam as { questions?: unknown }).questions || [] },
  });

  // Re-fetch exam with questions for result view
  const exam = await Exam.findById(attempt.exam).populate('questions');
  const populatedQuestions = (exam?.questions || []) as unknown as InstanceType<typeof Question>[];
  const questionMap = new Map(populatedQuestions.map((q) => [String(q._id), q]));

  const detailedAnswers = attempt.answers.map((a) => ({
    ...a,
    question: questionMap.get(String(a.questionId)),
  }));

  res.json({
    success: true,
    data: { ...attempt.toObject(), detailedAnswers, exam },
  });
});

export const getMyAttempts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempts = await ExamAttempt.find({ student: req.user!.id })
    .populate('exam', 'title totalMarks passingMarks startTime')
    .sort({ submittedAt: -1 });

  res.json({ success: true, data: attempts });
});

export const manualGrade = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questionId, marksAwarded, isCorrect } = req.body;
  const attempt = await ExamAttempt.findById(req.params.attemptId).populate('exam');
  if (!attempt) throw new ApiError(404, 'Attempt not found');

  const idx = attempt.answers.findIndex((a) => String(a.questionId) === questionId);
  if (idx < 0) throw new ApiError(404, 'Answer not found');

  const prevMarks = attempt.answers[idx].marksAwarded || 0;
  attempt.answers[idx].marksAwarded = marksAwarded;
  attempt.answers[idx].isCorrect = isCorrect ?? marksAwarded > 0;
  attempt.answers[idx].needsManualGrading = false;

  attempt.score = attempt.score - prevMarks + marksAwarded;
  const exam = attempt.exam as unknown as InstanceType<typeof Exam>;
  attempt.percentage =
    exam.totalMarks > 0 ? Math.round((attempt.score / exam.totalMarks) * 10000) / 100 : 0;
  attempt.passed = attempt.score >= exam.passingMarks;

  const stillPending = attempt.answers.some((a) => a.needsManualGrading);
  if (!stillPending) attempt.status = 'graded';

  await attempt.save();
  res.json({ success: true, data: attempt });
});

export const getExamAttempts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user!.id });
  if (!exam && req.user!.role !== 'admin') throw new ApiError(404, 'Exam not found');

  const attempts = await ExamAttempt.find({ exam: req.params.examId })
    .populate('student', 'name email')
    .sort({ submittedAt: -1 });

  res.json({ success: true, data: attempts });
});
