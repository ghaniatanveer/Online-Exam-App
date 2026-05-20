import { Response } from 'express';
import { Batch } from '../models/Batch.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const createBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, code, description, studentIds } = req.body;
  const batch = await Batch.create({
    name,
    code: code.toUpperCase(),
    description,
    instructor: req.user!.id,
    students: studentIds || [],
  });
  res.status(201).json({ success: true, data: batch });
});

export const getBatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.user!.role === 'instructor') filter.instructor = req.user!.id;
  if (req.user!.role === 'student') filter.students = req.user!.id;

  const batches = await Batch.find(filter)
    .populate('instructor', 'name email')
    .populate('students', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: batches });
});

export const getBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const batch = await Batch.findById(req.params.id)
    .populate('instructor', 'name email')
    .populate('students', 'name email');
  if (!batch) throw new ApiError(404, 'Batch not found');
  res.json({ success: true, data: batch });
});

export const updateBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.id, instructor: req.user!.id },
    req.body,
    { new: true }
  );
  if (!batch) throw new ApiError(404, 'Batch not found');
  res.json({ success: true, data: batch });
});
