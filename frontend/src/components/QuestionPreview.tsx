import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, CheckCircle, Check, Image as ImageIcon, X } from 'lucide-react';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';
import { getAssetUrl, getOptionLetter, questionHasImage, questionHasOptionImages } from '@/lib/question';

interface QuestionPreviewProps {
  questions: Question[];
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
}

export default function QuestionPreview({
  questions,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Question preview',
  subtitle = 'Review the questions exactly as students will see them.',
  confirmLabel = 'Confirm and save',
}: QuestionPreviewProps) {
  const [expandedQIds, setExpandedQIds] = useState<Set<string>>(
    new Set(questions.slice(0, 3).map((q) => q._id))
  );

  const toggleExpanded = (questionId: string) => {
    setExpandedQIds((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const imageQuestions = questions.filter((question) => questionHasImage(question)).length;
  const optionImageQuestions = questions.filter((question) => questionHasOptionImages(question)).length;

  // Rendered into <body> so a transformed page wrapper can't trap the
  // fixed overlay inside the content column or under the app header.
  return createPortal(
    <div className="fixed inset-0 z-[95] bg-canvas overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4 sticky top-0 z-10 bg-canvas border-b border-line py-5 mb-6">
          <div>
            <h2 className="font-display text-[24px] sm:text-[28px] font-semibold tracking-tight text-ink">{title}</h2>
            <p className="text-ink/60 text-[14px] mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="w-9 h-9 flex-shrink-0 rounded-lg border border-line bg-surface flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-[14px] overflow-hidden shadow-soft mb-6">
          {[
            { label: 'Total questions', value: questions.length },
            { label: 'Text only', value: questions.filter((question) => !questionHasImage(question)).length },
            { label: 'With question image', value: imageQuestions },
            { label: 'With option images', value: optionImageQuestions },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface px-5 py-4">
              <dd className="font-display text-[28px] font-medium leading-none text-ink tabular">{stat.value}</dd>
              <dt className="text-[12px] text-ink/55 mt-2">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <div className="space-y-3 mb-6">
          {questions.map((question, index) => {
            const isExpanded = expandedQIds.has(question._id);
            const hasAnyImages = questionHasImage(question) || questionHasOptionImages(question);

            return (
              <div
                key={question._id}
                className="bg-surface border border-line rounded-[14px] shadow-soft overflow-hidden transition-colors hover:border-ink/20"
              >
                <button
                  onClick={() => toggleExpanded(question._id)}
                  aria-expanded={isExpanded}
                  className={cn(
                    'w-full flex items-start justify-between gap-4 p-4 sm:p-5 transition-colors',
                    isExpanded && 'bg-raised'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 text-left min-w-0">
                    <span className="font-mono text-[13px] font-medium text-ink/50 pt-0.5 w-7 flex-shrink-0 tabular">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink text-[15px] leading-relaxed line-clamp-2">
                        {question.questionText || 'Image-based question'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'text-[12px] h-6 inline-flex items-center px-2.5 rounded-full font-medium capitalize border',
                            question.difficulty === 'easy'
                              ? 'bg-ok/[0.08] text-ok border-ok/30'
                              : question.difficulty === 'medium'
                                ? 'bg-warn/[0.08] text-warn border-warn/30'
                                : 'bg-bad/[0.08] text-bad border-bad/30'
                          )}
                        >
                          {question.difficulty}
                        </span>
                        {hasAnyImages && (
                          <span className="text-[12px] h-6 px-2.5 rounded-full bg-raised text-ink/65 border border-line inline-flex items-center gap-1">
                            <ImageIcon size={12} />
                            Images
                          </span>
                        )}
                        <span className="text-[12px] h-6 px-2.5 rounded-full bg-raised text-ink/65 border border-line inline-flex items-center">
                          {question.topic}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1 text-ink/45">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-line p-4 sm:p-5 space-y-5">
                    {question.questionText && (
                      <div>
                        <p className="label-caps mb-2">Question text</p>
                        <p className="whitespace-pre-line text-ink text-[16px] leading-[1.65]">
                          {question.questionText}
                        </p>
                      </div>
                    )}

                    {question.questionImage && (
                      <div>
                        <p className="label-caps mb-2">Question image</p>
                        {/* White well so line drawings with transparent backgrounds stay readable in dark mode */}
                        <div className="inline-flex rounded-[10px] border border-line bg-snow p-2">
                          <img
                            src={getAssetUrl(question.questionImage)}
                            alt="Question"
                            className="max-w-full max-h-72 object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="label-caps mb-2">Options</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const optionLetter = getOptionLetter(optionIndex);
                          const isCorrect = question.correctAnswer === optionLetter;

                          return (
                            <div
                              key={`${question._id}-${optionLetter}`}
                              className={cn(
                                'answer-option !cursor-default !p-3 flex items-start gap-3',
                                isCorrect ? 'correct' : 'hover:!border-line'
                              )}
                            >
                              <span className={cn(
                                'w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12px] font-medium flex-shrink-0',
                                isCorrect ? 'bg-ok border-ok text-on-brand' : 'border-ink/30 text-ink/60'
                              )}>
                                {optionLetter}
                              </span>
                              <div className="flex-1 min-w-0 space-y-2 pt-[3px]">
                                {option.text && (
                                  <p className="text-ink/85 text-[15px] leading-relaxed">
                                    {option.text}
                                  </p>
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
                              {isCorrect && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-ok pt-[5px]">
                                  <Check size={13} strokeWidth={3} /> Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {question.explanation && (
                      <div>
                        <p className="label-caps mb-2">Explanation</p>
                        <p className="ruled text-ink/80 text-[15px] leading-[32px] px-4 pt-1 pb-1 bg-raised border border-line rounded-[10px]">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-between sticky bottom-0 bg-canvas border-t border-line py-4">
          <button
            onClick={onClose}
            className="btn-ghost-neon flex-1 h-11 px-4 rounded-[10px] text-[15px]"
          >
            Back
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'btn-holo-cyan flex-1 h-11 px-4 rounded-[10px] text-[15px] flex items-center justify-center gap-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <CheckCircle size={16} />
              {isLoading ? 'Saving…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
