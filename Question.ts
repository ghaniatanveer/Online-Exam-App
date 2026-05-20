import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'true_false' | 'short_answer';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  text: string;
  type: QuestionType;
  options: IOption[];
  correctAnswer?: string; // for short_answer / true_false
  category: string;
  subject: string;
  difficulty: Difficulty;
  marks: number;
  createdBy: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq_single', 'mcq_multiple', 'true_false', 'short_answer'],
      required: true,
    },
    options: [optionSchema],
    correctAnswer: { type: String },
    category: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: Number, default: 1, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, category: 1, difficulty: 1 });
questionSchema.index({ createdBy: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
