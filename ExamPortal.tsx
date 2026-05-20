import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Flag, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { saveAnswer, submitExam, reportTabSwitch } from '@/features/exams/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Exam, ExamAttempt, Question } from '@/types';

interface ExamPortalProps {
  examId: string;
  exam: Exam & { questions: Question[] };
  attempt: ExamAttempt;
}

export function ExamPortal({ examId, exam, attempt: initialAttempt }: ExamPortalProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptions?: string[]; textAnswer?: string; markedForReview?: boolean }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(initialAttempt.tabSwitchCount || 0);
  const [submitting, setSubmitting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const questions = exam.questions || [];
  const currentQ = questions[currentIndex];

  const expiresAt = new Date(initialAttempt.expiresAt).getTime();

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitExam(examId);
      toast.success('Exam submitted successfully');
      navigate(`/results/${initialAttempt._id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed');
      setSubmitting(false);
    }
  }, [examId, initialAttempt._id, navigate, submitting]);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        handleSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, handleSubmit]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        reportTabSwitch(examId).then((res) => {
          setTabWarnings(res.data.tabSwitchCount);
          toast.warning('Tab switch detected! Stay on the exam window.', { duration: 5000 });
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [examId]);

  useEffect(() => {
    const block = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', block);
    return () => window.removeEventListener('beforeunload', block);
  }, []);

  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('paste', preventCopy);
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
    };
  }, []);

  const autoSave = useCallback(
    (questionId: string, data: { selectedOptions?: string[]; textAnswer?: string; markedForReview?: boolean }) => {
      setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...data } }));
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveAnswer(examId, { questionId, ...data }).catch(() => {});
      }, 800);
    },
    [examId]
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleOption = (optionId: string) => {
    if (!currentQ) return;
    const prev = answers[currentQ._id]?.selectedOptions || [];
    let next: string[];
    if (currentQ.type === 'mcq_multiple') {
      next = prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId];
    } else {
      next = [optionId];
    }
    autoSave(currentQ._id, { selectedOptions: next });
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (!currentQ) return null;

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k].selectedOptions?.length || answers[k].textAnswer
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {tabWarnings > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Warnings: {tabWarnings}
              </Badge>
            )}
            <Badge variant={timeLeft < 300 ? 'destructive' : 'secondary'} className="gap-1 text-base px-3 py-1">
              <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
            </Badge>
            <Button variant="outline" size="sm" onClick={enterFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              Submit Exam
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_240px]">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-lg font-medium leading-relaxed">{currentQ.text}</p>
              <Badge>{currentQ.marks} marks</Badge>
            </div>

            {currentQ.type === 'short_answer' ? (
              <Textarea
                placeholder="Type your answer..."
                value={answers[currentQ._id]?.textAnswer || ''}
                onChange={(e) => autoSave(currentQ._id, { textAnswer: e.target.value })}
                className="min-h-[120px]"
              />
            ) : (
              <div className="space-y-3">
                {(currentQ.options || []).map((opt) => {
                  const selected = answers[currentQ._id]?.selectedOptions?.includes(String(opt._id));
                  return (
                    <label
                      key={String(opt._id)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <Checkbox checked={selected} onCheckedChange={() => toggleOption(String(opt._id))} />
                      <span>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  autoSave(currentQ._id, {
                    markedForReview: !answers[currentQ._id]?.markedForReview,
                  })
                }
              >
                <Flag className={cn('mr-1 h-4 w-4', answers[currentQ._id]?.markedForReview && 'fill-amber-500 text-amber-500')} />
                Mark for review
              </Button>
              <Button
                disabled={currentIndex >= questions.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-3">Navigation ({answeredCount}/{questions.length})</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const ans = answers[q._id];
                  const isAnswered = ans?.selectedOptions?.length || ans?.textAnswer;
                  const isReview = ans?.markedForReview;
                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        'h-9 w-9 rounded-md text-sm font-medium border transition-colors',
                        i === currentIndex && 'ring-2 ring-primary',
                        isReview && 'border-amber-500 bg-amber-50',
                        isAnswered && !isReview && 'bg-primary text-primary-foreground',
                        !isAnswered && !isReview && 'bg-muted'
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
