// src/pages/SolutionReviewPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getAttemptByIdApi } from '@/api/testApi';
import { ChevronLeft, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestAttempt, Question } from '@/types';
import { getAssetUrl, getOptionLetter } from '@/lib/question';

// Extend TestAttempt to match the populated questions structure
interface PopulatedAttempt extends TestAttempt {
  questions: Question[];
  answers: Array<{
    question: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

const SolutionReviewPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<PopulatedAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const fetchAttempt = async () => {
      try {
        setIsLoading(true);
        const res = await getAttemptByIdApi(attemptId);
        if (res.success && res.data) {
          setAttempt(res.data as PopulatedAttempt);
        } else {
          setError('Failed to load test attempt.');
        }
      } catch (err: unknown) {
        setError('Error loading attempt details: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center flex-col items-center h-[60vh] gap-4">
          <LoadingSpinner size="lg" label="Loading your answers…" />
        </div>
      </AppLayout>
    );
  }

  if (error || !attempt) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh]">
          <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mb-4">
            <AlertTriangle size={22} />
          </div>
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink mb-2">Couldn't load this attempt</h2>
          <p className="text-ink/60 text-[15px] mb-6 max-w-md">{error || 'Test data not found'}</p>
          <HoloButton variant="cyan" onClick={() => navigate('/analysis')}>
            Back to analysis
          </HoloButton>
        </div>
      </AppLayout>
    );
  }

  const { score, questions, answers, title } = attempt;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <button
            onClick={() => navigate('/result', { state: { result: attempt, title } })}
            className="inline-flex items-center gap-1 -ml-1 mb-3 text-[13px] text-ink/55 hover:text-ink transition-colors"
          >
            <ChevronLeft size={16} />
            Back to result
          </button>
          <p className="label-caps mb-1">Solutions</p>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">
            Review your answers
          </h1>
          <p className="text-[14px] text-ink/60 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{title}</span>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <span>
              Score{' '}
              <span className={cn(
                'font-mono font-medium tabular',
                score >= 80 ? 'text-ok' : score >= 60 ? 'text-brand' : score >= 40 ? 'text-warn' : 'text-bad'
              )}>{score}%</span>
            </span>
          </p>
        </div>

        {/* Questions Feed */}
        <div className="space-y-5">
          {questions.map((q, index) => {
            const studentAnsRow = answers.find((a) => a.question.toString() === q._id);
            const selectedAns = studentAnsRow?.selectedAnswer;
            const isCorrect = studentAnsRow?.isCorrect;
            const isSkipped = !selectedAns;

            const status = isCorrect ? 'correct' : (isSkipped ? 'skipped' : 'wrong');

            return (
              <article
                key={q._id}
                className={cn(
                  'bg-surface border border-line border-l-[3px] rounded-[14px] shadow-soft p-5 sm:p-7 animate-fade-up',
                  status === 'correct' && 'border-l-ok',
                  status === 'skipped' && 'border-l-warn',
                  status === 'wrong'   && 'border-l-bad',
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Question Header */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[14px] font-medium text-ink/55 tabular">
                      Q{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-medium border',
                      status === 'correct' && 'bg-ok/[0.08] text-ok border-ok/30',
                      status === 'skipped' && 'bg-warn/[0.08] text-warn border-warn/30',
                      status === 'wrong'   && 'bg-bad/[0.08] text-bad border-bad/30',
                    )}>
                      {status === 'correct' ? <CheckCircle2 size={12} /> : status === 'skipped' ? <MinusCircle size={12} /> : <XCircle size={12} />}
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                  </div>
                  <span className="text-[12px] text-ink/55 bg-raised border border-line px-2 py-0.5 rounded-md">
                    {q.topic}
                  </span>
                </div>

                {(q.questionText || q.questionImage) && (
                  <div className="space-y-4 mb-5">
                    {q.questionText && (
                      <p className="whitespace-pre-line text-ink text-[16px] sm:text-[17px] leading-[1.65]">
                        {q.questionText}
                      </p>
                    )}
                    {q.questionImage && (
                      <div className="inline-flex rounded-[10px] border border-line bg-snow p-2">
                        <img
                          src={getAssetUrl(q.questionImage)}
                          alt="Question"
                          className="max-w-full max-h-72 object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2.5 mb-6">
                  {q.options.map((option, i) => {
                    const optionLetter = getOptionLetter(i);
                    const isStudentChoice = optionLetter === selectedAns;
                    const isActualAnswer = optionLetter === q.correctAnswer;

                    let rowClass = '';
                    let bubbleClass = 'bg-surface border-ink/30 text-ink/60';
                    let note: string | null = null;
                    let icon = null;

                    if (isActualAnswer && isStudentChoice) {
                      rowClass = 'correct';
                      bubbleClass = 'bg-ok border-ok text-on-brand';
                      note = 'Your answer';
                      icon = <CheckCircle2 size={16} className="text-ok" />;
                    } else if (isActualAnswer && !isStudentChoice) {
                      rowClass = 'correct';
                      bubbleClass = 'bg-surface border-ok text-ok';
                      note = 'Correct answer';
                      icon = <CheckCircle2 size={16} className="text-ok" />;
                    } else if (!isActualAnswer && isStudentChoice) {
                      rowClass = 'wrong animate-fade-in';
                      bubbleClass = 'bg-bad border-bad text-on-brand';
                      note = 'Your answer';
                      icon = <XCircle size={16} className="text-bad" />;
                    }

                    return (
                      <div
                        key={i}
                        className={cn('answer-option !cursor-default !p-3 sm:!p-3.5 flex items-start gap-3', !rowClass && 'hover:!border-line', rowClass)}
                      >
                        <span className={cn(
                          'w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12px] font-medium flex-shrink-0',
                          bubbleClass
                        )}>
                          {optionLetter}
                        </span>
                        <div className="flex-1 min-w-0 space-y-2 pt-[3px]">
                          {option.text && (
                            <span className={cn(
                              'block text-[15px] leading-relaxed',
                              isActualAnswer || isStudentChoice ? 'text-ink' : 'text-ink/70'
                            )}>
                              {option.text}
                            </span>
                          )}
                          {option.image && (
                            <div className="inline-flex rounded-[8px] border border-line bg-snow p-1.5">
                              <img
                                src={getAssetUrl(option.image)}
                                alt={`Option ${optionLetter}`}
                                className="max-w-xs max-h-32 object-contain"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                        {icon && (
                          <div className="flex-shrink-0 flex items-center gap-1.5 pt-[5px]">
                            {note && (
                              <span className={cn(
                                'hidden sm:inline text-[12px] font-medium',
                                rowClass.startsWith('wrong') ? 'text-bad' : 'text-ok'
                              )}>
                                {note}
                              </span>
                            )}
                            {icon}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation, on ruled paper */}
                <div className="rounded-[10px] border border-line bg-raised overflow-hidden">
                  <div className="flex items-center gap-2 px-4 sm:px-5 pt-3">
                    <Lightbulb size={14} className="text-warn" />
                    <h4 className="label-caps">Explanation</h4>
                  </div>
                  <p className={cn(
                    'ruled px-4 sm:px-5 pt-1 pb-2 text-[15px] leading-[32px]',
                    q.explanation ? 'text-ink/80' : 'text-ink/50 italic'
                  )}>
                    {q.explanation || 'No explanation has been added for this question yet.'}
                  </p>
                </div>

              </article>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default SolutionReviewPage;
