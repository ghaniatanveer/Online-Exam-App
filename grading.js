export function gradeAnswer(question, answer) {
    const maxMarks = question.marks;
    if (question.type === 'short_answer') {
        const needsManual = true;
        if (!answer.textAnswer?.trim()) {
            return { isCorrect: false, marksAwarded: 0, needsManualGrading: needsManual };
        }
        // Auto-grade if exact match (case-insensitive)
        const expected = (question.correctAnswer || '').trim().toLowerCase();
        const given = answer.textAnswer.trim().toLowerCase();
        if (expected && given === expected) {
            return { isCorrect: true, marksAwarded: maxMarks, needsManualGrading: false };
        }
        return { isCorrect: false, marksAwarded: 0, needsManualGrading: needsManual };
    }
    if (question.type === 'true_false') {
        const correct = (question.correctAnswer || '').toLowerCase();
        const given = (answer.textAnswer || '').toLowerCase();
        const isCorrect = correct === given;
        return {
            isCorrect,
            marksAwarded: isCorrect ? maxMarks : 0,
            needsManualGrading: false,
        };
    }
    // MCQ grading
    const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => String(o._id));
    const selected = answer.selectedOptions || [];
    const sortedCorrect = [...correctOptionIds].sort();
    const sortedSelected = [...selected].sort();
    const isCorrect = sortedCorrect.length === sortedSelected.length &&
        sortedCorrect.every((id, i) => id === sortedSelected[i]);
    return {
        isCorrect,
        marksAwarded: isCorrect ? maxMarks : 0,
        needsManualGrading: false,
    };
}
