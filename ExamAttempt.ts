import mongoose, { Document, Schema } from 'mongoose';

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptions?: string[]; // option _ids
  textAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  needsManualGrading?: boolean;
  markedForReview?: boolean;
}

export interface IExamAttempt extends Document {
  exam: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: IAnswer[];
  status: AttemptStatus;
  startedAt: Date;
  submittedAt?: Date;
  expiresAt: Date;
  score: number;
  percentage: number;
  passed: boolean;
  tabSwitchCount: number;
  sessionToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptions: [{ type: String }],
    textAnswer: { type: String },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 },
    needsManualGrading: { type: Boolean, default: false },
    markedForReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded', 'expired'],
      default: 'in_progress',
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    tabSwitchCount: { type: Number, default: 0 },
    sessionToken: { type: String, required: true },
  },
  { timestamps: true }
);

// One active attempt per student per exam
examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });
examAttemptSchema.index({ student: 1, status: 1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', examAttemptSchema);
