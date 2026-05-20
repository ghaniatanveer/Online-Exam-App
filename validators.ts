import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['admin', 'instructor', 'student']).optional(),
  batchId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['mcq_single', 'mcq_multiple', 'true_false', 'short_answer']),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  category: z.string().min(1),
  subject: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  marks: z.number().min(1).default(1),
  tags: z.array(z.string()).optional(),
});

export const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100),
});

export const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(1),
  passingMarks: z.number().min(0),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  questionIds: z.array(z.string()).min(1),
  batchIds: z.array(z.string()).min(1),
  status: z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled']).optional(),
  selectionMode: z.enum(['manual', 'auto']).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  allowReview: z.boolean().optional(),
});

export const batchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

export const saveAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptions: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
  markedForReview: z.boolean().optional(),
});

export const manualGradeSchema = z.object({
  questionId: z.string(),
  marksAwarded: z.number().min(0),
  isCorrect: z.boolean().optional(),
});
