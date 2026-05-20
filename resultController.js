import PDFDocument from 'pdfkit';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const downloadGradeSheet = asyncHandler(async (req, res) => {
    const attempt = await ExamAttempt.findById(req.params.attemptId)
        .populate('student', 'name email')
        .populate('exam', 'title totalMarks passingMarks');
    if (!attempt)
        throw new ApiError(404, 'Attempt not found');
    const isOwner = String(attempt.student._id || attempt.student) === req.user.id;
    if (!isOwner && req.user.role === 'student')
        throw new ApiError(403, 'Access denied');
    const exam = await Exam.findById(attempt.exam);
    const questions = await Question.find({ _id: { $in: exam?.questions || [] } });
    const student = attempt.student;
    const examData = attempt.exam;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="grade-sheet-${attempt._id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('VU Online Exams - Grade Sheet', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Student: ${student.name} (${student.email})`);
    doc.text(`Exam: ${examData.title}`);
    doc.text(`Score: ${attempt.score} / ${examData.totalMarks} (${attempt.percentage}%)`);
    doc.text(`Result: ${attempt.passed ? 'PASSED' : 'FAILED'}`);
    doc.text(`Submitted: ${attempt.submittedAt?.toLocaleString() || 'N/A'}`);
    doc.moveDown();
    doc.text('Question Summary', { underline: true });
    doc.moveDown(0.5);
    for (const q of questions) {
        const ans = attempt.answers.find((a) => String(a.questionId) === String(q._id));
        const status = ans?.needsManualGrading
            ? 'Pending review'
            : ans?.isCorrect
                ? 'Correct'
                : 'Incorrect';
        doc.fontSize(10).text(`Q: ${q.text.substring(0, 80)}... — ${status} (${ans?.marksAwarded || 0}/${q.marks})`);
    }
    doc.end();
});
