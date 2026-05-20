import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const getUsers = asyncHandler(async (req, res) => {
    const { role, search, page = '1', limit = '20' } = req.query;
    const filter = {};
    if (role)
        filter.role = role;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const [users, total] = await Promise.all([
        User.find(filter).select('-password').skip(skip).limit(limitNum).sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);
    res.json({
        success: true,
        data: users,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
});
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user)
        throw new ApiError(404, 'User not found');
    res.json({ success: true, data: user });
});
