import mongoose, { Document, Schema } from 'mongoose';

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
export type SelectionMode = 'manual' | 'auto';

export interface IExam extends Document {
  title: string;
  description?: string;
  duration: number; // minutes
  passingMarks: number;
  totalMarks: number;
  startTime: Date;
  endTime: Date;
  questions: mongoose.Types.ObjectId[];
  batches: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: ExamStatus;
  selectionMode: SelectionMode;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    batches: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    selectionMode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    allowReview: { type: Boolean, default: true },
  },
  { timestamps: true }
);

examSchema.index({ startTime: 1, endTime: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ batches: 1 });

export const Exam = mongoose.model<IExam>('Exam', examSchema);
