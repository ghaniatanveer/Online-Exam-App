import { Response } from 'express';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middleware/auth.js';

async function computeTotalMarks(questionIds: string[]): Promise<number> {
  const questions = await Question.find({ _id: { $in: questionIds } });
  return questions.reduce((sum, q) => sum + q.marks, 0);
}

export const createExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    duration,
    passingMarks,
    startTime,
    endTime,
    questionIds,
    batchIds,
    status,
    selectionMode,
    shuffleQuestions,
    shuffleOptions,
    allowReview,
  } = req.body;

  const totalMarks = await computeTotalMarks(questionIds);
  const exam = await Exam.create({
    title,
    description,
    duration,
    passingMarks,
    totalMarks,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    questions: questionIds,
    batches: batchIds,
    createdBy: req.user!.id,
    status: status || 'scheduled',
    selectionMode,
    shuffleQuestions,
    shuffleOptions,
    allowReview,
  });

  res.status(201).json({ success: true, data: exam });
});

export const getExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'instructor') {
    filter.createdBy = req.user!.id;
  } else if (req.user!.role === 'student') {
    const user = await User.findById(req.user!.id);
    const batches = await Batch.find({ students: req.user!.id }).select('_id');
    const batchIds = batches.map((b) => b._id);
    if (user?.batch) batchIds.push(user.batch);
    filter.batches = { $in: batchIds };
    filter.status = { $in: ['scheduled', 'active', 'completed'] };
  }

  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .populate('createdBy', 'name')
      .populate('batches', 'name code')
      .skip(skip)
      .limit(limitNum)
      .sort({ startTime: -1 }),
    Exam.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: exams,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findById(req.params.id)
    .populate('questions')
    .populate('batches', 'name code')
    .populate('createdBy', 'name email');

  if (!exam) throw new ApiError(404, 'Exam not found');
  res.json({ success: true, data: exam });
});

export const updateExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = { ...req.body };
  if (updates.questionIds) {
    updates.questions = updates.questionIds;
    updates.totalMarks = await computeTotalMarks(updates.questionIds);
    delete updates.questionIds;
  }
  if (updates.batchIds) {
    updates.batches = updates.batchIds;
    delete updates.batchIds;
  }
  if (updates.startTime) updates.startTime = new Date(updates.startTime);
  if (updates.endTime) updates.endTime = new Date(updates.endTime);

  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user!.id },
    updates,
    { new: true }
  );
  if (!exam) throw new ApiError(404, 'Exam not found');
  res.json({ success: true, data: exam });
});

export const deleteExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findOneAndDelete({ _id: req.params.id, createdBy: req.user!.id });
  if (!exam) throw new ApiError(404, 'Exam not found');
  res.json({ success: true, message: 'Exam deleted' });
});

export const getStudentExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const batches = await Batch.find({ students: req.user!.id }).select('_id');
  const user = await User.findById(req.user!.id);
  const batchIds = batches.map((b) => b._id);
  if (user?.batch) batchIds.push(user.batch);

  const upcoming = await Exam.find({
    batches: { $in: batchIds },
    endTime: { $gte: now },
    status: { $in: ['scheduled', 'active'] },
  })
    .select('-questions')
    .sort({ startTime: 1 });

  const past = await Exam.find({
    batches: { $in: batchIds },
    status: 'completed',
  })
    .select('-questions')
    .sort({ endTime: -1 })
    .limit(10);

  res.json({ success: true, data: { upcoming, past } });
});
