import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Batch } from '../models/Batch.js';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';

export async function populateDemoData(reset = true): Promise<void> {
  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Batch.deleteMany({}),
      Question.deleteMany({}),
      Exam.deleteMany({}),
    ]);
  }

  const adminPass = await bcrypt.hash('admin123', 12);
  const instructorPass = await bcrypt.hash('instructor123', 12);
  const studentPass = await bcrypt.hash('student123', 12);

  await User.create({
    name: 'System Admin',
    email: 'admin@examify.edu',
    password: adminPass,
    role: 'admin',
  });

  const instructor = await User.create({
    name: 'Dr. Sarah Khan',
    email: 'instructor@examify.edu',
    password: instructorPass,
    role: 'instructor',
  });

  const batch = await Batch.create({
    name: 'Computer Science - Fall 2026',
    code: 'CS-F26',
    description: 'Primary CS batch',
    instructor: instructor._id,
    students: [],
  });

  const student = await User.create({
    name: 'Ali Ahmed',
    email: 'student@examify.edu',
    password: studentPass,
    role: 'student',
    batch: batch._id,
  });

  batch.students.push(student._id);
  await batch.save();

  const q1 = await Question.create({
    text: 'What is 2 + 2?',
    type: 'mcq_single',
    options: [
      { text: '3', isCorrect: false },
      { text: '4', isCorrect: true },
      { text: '5', isCorrect: false },
      { text: '6', isCorrect: false },
    ],
    category: 'Arithmetic',
    subject: 'Mathematics',
    difficulty: 'easy',
    marks: 2,
    createdBy: instructor._id,
  });

  const q2 = await Question.create({
    text: 'The Earth is flat.',
    type: 'true_false',
    correctAnswer: 'false',
    options: [],
    category: 'General',
    subject: 'Science',
    difficulty: 'easy',
    marks: 1,
    createdBy: instructor._id,
  });

  const q3 = await Question.create({
    text: 'Define photosynthesis in one sentence.',
    type: 'short_answer',
    correctAnswer: 'process by which plants convert light into energy',
    options: [],
    category: 'Biology',
    subject: 'Science',
    difficulty: 'medium',
    marks: 5,
    createdBy: instructor._id,
  });

  const start = new Date();
  start.setMinutes(start.getMinutes() - 5);
  const end = new Date();
  end.setDate(end.getDate() + 7);

  await Exam.create({
    title: 'Midterm Assessment - Demo',
    description: 'Sample exam for testing the platform',
    duration: 30,
    passingMarks: 3,
    totalMarks: 8,
    startTime: start,
    endTime: end,
    questions: [q1._id, q2._id, q3._id],
    batches: [batch._id],
    createdBy: instructor._id,
    status: 'active',
    selectionMode: 'manual',
  });

  console.log('Demo data ready:');
  console.log('  Admin: admin@examify.edu / admin123');
  console.log('  Instructor: instructor@examify.edu / instructor123');
  console.log('  Student: student@examify.edu / student123');
}

export async function seedIfEmpty(): Promise<void> {
  const count = await User.countDocuments();
  if (count === 0) {
    await populateDemoData(false);
  }
}
