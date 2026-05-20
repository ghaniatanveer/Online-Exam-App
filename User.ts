import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'instructor' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  batch?: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'instructor', 'student'], required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
