import { Question } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const createQuestion = asyncHandler(async (req, res) => {
    const question = await Question.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: question });
});
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
    const { questions } = req.body;
    const docs = questions.map((q) => ({
        ...q,
        createdBy: req.user.id,
    }));
    const created = await Question.insertMany(docs);
    res.status(201).json({ success: true, data: created, count: created.length });
});
export const getQuestions = asyncHandler(async (req, res) => {
    const { subject, category, difficulty, type, search, page = '1', limit = '20', mine, } = req.query;
    const filter = {};
    if (subject)
        filter.subject = subject;
    if (category)
        filter.category = category;
    if (difficulty)
        filter.difficulty = difficulty;
    if (type)
        filter.type = type;
    if (mine === 'true' || req.user?.role === 'instructor') {
        if (req.user?.role === 'instructor')
            filter.createdBy = req.user.id;
    }
    if (search)
        filter.text = { $regex: search, $options: 'i' };
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const [questions, total] = await Promise.all([
        Question.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
        Question.countDocuments(filter),
    ]);
    res.json({
        success: true,
        data: questions,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
});
export const getQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question)
        throw new ApiError(404, 'Question not found');
    res.json({ success: true, data: question });
});
export const updateQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, req.body, { new: true });
    if (!question)
        throw new ApiError(404, 'Question not found or access denied');
    res.json({ success: true, data: question });
});
export const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id,
    });
    if (!question)
        throw new ApiError(404, 'Question not found or access denied');
    res.json({ success: true, message: 'Question deleted' });
});
export const getQuestionMeta = asyncHandler(async (_req, res) => {
    const [subjects, categories] = await Promise.all([
        Question.distinct('subject'),
        Question.distinct('category'),
    ]);
    res.json({ success: true, data: { subjects, categories } });
});
