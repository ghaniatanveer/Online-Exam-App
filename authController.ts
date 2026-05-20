import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { User } from '../models/User.js';
import { Batch } from '../models/Batch.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, batchId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  // Only admin can create admin/instructor via API without restriction
  let userRole = role || 'student';
  if (req.user) {
    if (req.user.role === 'admin') {
      userRole = role || 'student';
    } else if (req.user.role === 'instructor' && role === 'student') {
      userRole = 'student';
    } else if (!req.user) {
      userRole = 'student'; // public registration defaults to student
    } else {
      throw new ApiError(403, 'Cannot create this role');
    }
  } else {
    userRole = 'student';
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: userRole,
    batch: batchId || undefined,
  });

  if (batchId && userRole === 'student') {
    await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: user._id } });
  }

  const token = signToken({ id: String(user._id), email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ id: String(user._id), email: user.email, role: user.role });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch,
        avatar: user.avatar,
      },
      token,
    },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).populate('batch', 'name code');
  if (!user) throw new ApiError(404, 'User not found');

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      batch: user.batch,
      avatar: user.avatar,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { ...(name && { name }), ...(avatar !== undefined && { avatar }) },
    { new: true }
  ).select('-password');

  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new ApiError(400, 'Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ success: true, message: 'Password updated' });
});
