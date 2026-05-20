import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  code: string;
  description?: string;
  instructor: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
