import { Response } from 'express';
import { User } from '../models/User.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Batch } from '../models/Batch.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAdminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalExams, totalQuestions, recentAttempts] = await Promise.all([
    User.countDocuments(),
    Exam.countDocuments(),
    Question.countDocuments(),
    ExamAttempt.find({ status: { $in: ['submitted', 'graded'] } })
      .populate('student', 'name')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 })
      .limit(10),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const passRate = await ExamAttempt.aggregate([
    { $match: { status: 'graded' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        passed: { $sum: { $cond: ['$passed', 1, 0] } },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalExams,
        totalQuestions,
        passRate: passRate[0]
          ? Math.round((passRate[0].passed / passRate[0].total) * 100)
          : 0,
      },
      usersByRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
      recentAttempts,
    },
  });
});

export const getInstructorDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const instructorId = req.user!.id;

  const [exams, questions, batches, attempts] = await Promise.all([
    Exam.countDocuments({ createdBy: instructorId }),
    Question.countDocuments({ createdBy: instructorId }),
    Batch.countDocuments({ instructor: instructorId }),
    ExamAttempt.find()
      .populate({
        path: 'exam',
        match: { createdBy: instructorId },
        select: 'title',
      })
      .populate('student', 'name')
      .then((list) => list.filter((a) => a.exam)),
  ]);

  const performanceByExam = await ExamAttempt.aggregate([
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examDoc',
      },
    },
    { $unwind: '$examDoc' },
    { $match: { 'examDoc.createdBy': instructorId } },
    {
      $group: {
        _id: '$exam',
        title: { $first: '$examDoc.title' },
        avgScore: { $avg: '$percentage' },
        attempts: { $sum: 1 },
        passCount: { $sum: { $cond: ['$passed', 1, 0] } },
      },
    },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: {
      stats: { exams, questions, batches, totalAttempts: attempts.length },
      performanceByExam,
      recentAttempts: attempts.slice(0, 10),
    },
  });
});

export const getStudentDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempts = await ExamAttempt.find({
    student: req.user!.id,
    status: { $in: ['submitted', 'graded'] },
  })
    .populate('exam', 'title totalMarks')
    .sort({ submittedAt: -1 });

  const batches = await Batch.find({ students: req.user!.id }).select('_id');
  const user = await User.findById(req.user!.id);
  const batchIds = batches.map((b) => b._id);
  if (user?.batch) batchIds.push(user.batch);

  const upcomingExams = await Exam.find({
    batches: { $in: batchIds },
    endTime: { $gte: new Date() },
    status: { $in: ['scheduled', 'active'] },
  })
    .select('title startTime endTime duration')
    .sort({ startTime: 1 })
    .limit(5);

  const trend = attempts
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({
      name: `Exam ${i + 1}`,
      score: a.percentage,
      exam: (a.exam as { title?: string })?.title,
    }));

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0;

  res.json({
    success: true,
    data: {
      stats: {
        examsTaken: attempts.length,
        avgScore,
        passed: attempts.filter((a) => a.passed).length,
      },
      upcomingExams,
      recentResults: attempts.slice(0, 5),
      performanceTrend: trend,
    },
  });
});
