import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  X,
} from "lucide-react";
import { demoQuestions } from "@/data/demoQuestions";
import { Wordmark } from "@/components/brand/BrandMark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import HoloButton from "@/components/ui/HoloButton";
import { cn } from "@/lib/utils";

const TOTAL_TIME = 600;
const TOTAL_QUESTIONS = demoQuestions.length;

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

const TimerDisplay = ({ timeLeft }: { timeLeft: number }) => {
  const isWarning = timeLeft < 120;
  return (
    <div
      role="timer"
      aria-label={`Time left ${formatTime(timeLeft)}`}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 h-9 font-mono text-[15px] font-medium tabular-nums transition-colors",
        isWarning ? "border-bad/40 bg-bad/[0.07] text-bad" : "border-line bg-surface text-ink"
      )}
    >
      <Clock size={15} className={cn("shrink-0", isWarning ? "text-bad" : "text-ink/45")} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
};

interface PaletteProps {
  currentIndex: number;
  selectedOptions: (number | null)[];
  visitedFlags: boolean[];
  onJump: (index: number) => void;
}

const QuestionPalette = ({
  currentIndex,
  selectedOptions,
  visitedFlags,
  onJump,
}: PaletteProps) => (
  <div className="grid grid-cols-5 gap-2">
    {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
      const isAnswered = selectedOptions[i] !== null;
      const isCurrent = i === currentIndex;
      const isVisited = visitedFlags[i];
      let dotClass =
        "mx-auto w-10 h-10 rounded-full flex items-center justify-center font-mono text-[13px] border transition-colors cursor-pointer ";
      if (isCurrent) {
        dotClass += "border-2 border-brand bg-surface text-brand font-semibold";
      } else if (isAnswered) {
        dotClass += "border-brand bg-brand text-on-brand hover:bg-brand/90";
      } else if (isVisited) {
        dotClass += "border-ink/30 bg-ink/[0.06] text-ink/75 hover:border-ink/50";
      } else {
        dotClass += "border-line bg-surface text-ink/45 hover:border-ink/30 hover:text-ink/70";
      }
      return (
        <button
          key={i}
          className={dotClass}
          onClick={() => onJump(i)}
          aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}`}
          aria-current={isCurrent ? "step" : undefined}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

interface ModalProps {
  answeredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal = ({ answeredCount, onCancel, onConfirm }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-coal/50 px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-submit-title"
      className="relative w-full max-w-md rounded-[14px] border border-line bg-surface p-6 shadow-float"
    >
      <button
        onClick={onCancel}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-md p-1 text-ink/40 transition-colors hover:text-ink/70"
      >
        <X size={18} />
      </button>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-warn/10 text-warn">
        <AlertTriangle size={20} />
      </div>
      <h3 id="demo-submit-title" className="mb-2 font-display text-[22px] font-semibold tracking-tight text-ink">
        Submit your answers?
      </h3>
      <p className="mb-6 text-[14px] leading-relaxed text-ink/65">
        You have answered{" "}
        <span className="font-mono font-medium text-ink">{answeredCount}/{TOTAL_QUESTIONS}</span>{" "}
        questions.
        {answeredCount < TOTAL_QUESTIONS && " Unanswered questions will be marked as skipped."}{" "}
        You can&apos;t change answers after this.
      </p>
      <div className="flex gap-3">
        <HoloButton variant="ghost" size="lg" fullWidth onClick={onCancel}>
          Keep working
        </HoloButton>
        <HoloButton variant="cyan" size="lg" fullWidth onClick={onConfirm}>
          Submit test
        </HoloButton>
      </div>
    </div>
  </div>
);

const DemoTestPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>(
    () => Array(TOTAL_QUESTIONS).fill(null)
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visitedFlags, setVisitedFlags] = useState<boolean[]>(() => {
    const flags = Array(TOTAL_QUESTIONS).fill(false) as boolean[];
    flags[0] = true;
    return flags;
  });
  const [showModal, setShowModal] = useState(false);

  const selectedRef = useRef(selectedOptions);
  selectedRef.current = selectedOptions;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const isSubmittedRef = useRef(isSubmitted);
  isSubmittedRef.current = isSubmitted;

  const doSubmit = useCallback(() => {
    if (isSubmittedRef.current) return;
    setIsSubmitted(true);
    navigate("/demo/result", {
      state: {
        selectedOptions: selectedRef.current,
        timeTaken: TOTAL_TIME - timeLeftRef.current,
      },
    });
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [doSubmit]);

  const goTo = (index: number) => {
    if (index < 0 || index >= TOTAL_QUESTIONS) return;
    setCurrentIndex(index);
    setVisitedFlags((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleSelect = (optIndex: number) => {
    setSelectedOptions((prev) => {
      const next = [...prev];
      next[currentIndex] = prev[currentIndex] === optIndex ? null : optIndex;
      return next;
    });
  };

  const currentQ = demoQuestions[currentIndex];
  const answeredCount = selectedOptions.filter((o) => o !== null).length;
  const optionLabels: [string, string, string, string] = ["A", "B", "C", "D"];

  if (isSubmitted) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Wordmark size="sm" />
            <span className="hidden md:inline h-5 w-px bg-line" />
            <span className="hidden md:inline text-[13px] text-ink/55 truncate">
              Free demo · Quantitative aptitude
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <TimerDisplay timeLeft={timeLeft} />
            <ThemeToggle size="md" />
            <HoloButton
              onClick={() => setShowModal(true)}
              variant="cyan"
              size="md"
              icon={<Send size={14} />}
              className="hidden sm:inline-flex"
            >
              Submit test
            </HoloButton>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <section className="flex flex-col gap-5 min-w-0">
          {/* Question sheet */}
          <article className="rounded-[14px] border border-line bg-surface shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 md:px-8 py-3">
              <span className="font-mono text-[13px] text-ink/60">
                Question <span className="text-ink font-medium">{pad2(currentIndex + 1)}</span> of {pad2(TOTAL_QUESTIONS)}
              </span>
              <span className="label-caps">{currentQ.topic}</span>
            </div>

            <div className="px-5 md:px-8 pt-6 pb-7 md:pt-8 md:pb-9">
              <p className="text-[17px] md:text-[19px] leading-relaxed text-ink mb-7 max-w-[62ch]">
                {currentQ.question}
              </p>
              <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Options">
                {currentQ.options.map((opt, oi) => {
                  const isSelected = selectedOptions[currentIndex] === oi;
                  return (
                    <button
                      key={oi}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelect(oi)}
                      className={cn(
                        "answer-option flex items-center gap-4 w-full text-left !py-3.5",
                        isSelected && "selected"
                      )}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[13px] font-medium transition-colors",
                          isSelected ? "border-brand bg-brand text-on-brand" : "border-ink/30 text-ink/60"
                        )}
                      >
                        {optionLabels[oi]}
                      </span>
                      <span className={cn("text-[15px] md:text-base", isSelected ? "text-ink" : "text-ink/85")}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[12px] text-ink/45">Click a selected option again to clear it.</p>
            </div>
          </article>

          {/* Nav buttons */}
          <div className="flex items-center justify-between gap-3">
            <HoloButton
              variant="ghost"
              size="lg"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              icon={<ChevronLeft size={16} />}
            >
              Previous
            </HoloButton>
            <HoloButton
              variant="cyan"
              size="lg"
              onClick={() => setShowModal(true)}
              icon={<Send size={14} />}
              className="sm:hidden"
            >
              Submit
            </HoloButton>
            {currentIndex < TOTAL_QUESTIONS - 1 ? (
              <HoloButton variant="violet" size="lg" onClick={() => goTo(currentIndex + 1)}>
                Next <ChevronRight size={16} />
              </HoloButton>
            ) : (
              <HoloButton variant="cyan" size="lg" onClick={() => setShowModal(true)} icon={<Send size={14} />}>
                Submit test
              </HoloButton>
            )}
          </div>
        </section>

        {/* Palette */}
        <aside className="rounded-[14px] border border-line bg-surface p-5 lg:sticky lg:top-20">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-ink">Questions</h2>
            <span className="font-mono text-[12px] text-ink/55">
              {answeredCount}/{TOTAL_QUESTIONS} answered
            </span>
          </div>
          <QuestionPalette
            currentIndex={currentIndex}
            selectedOptions={selectedOptions}
            visitedFlags={visitedFlags}
            onJump={goTo}
          />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 mt-5 pt-4 border-t border-line text-[12px] text-ink/60">
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-brand bg-surface" /> Current</li>
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand" /> Answered</li>
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-ink/30 bg-ink/[0.06]" /> Seen</li>
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-line bg-surface" /> Not seen</li>
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-ink/50">
            {TOTAL_TIME / 60} minutes for {TOTAL_QUESTIONS} questions. The test submits itself when time runs out.
          </p>
        </aside>
      </main>

      {showModal && (
        <ConfirmModal
          answeredCount={answeredCount}
          onCancel={() => setShowModal(false)}
          onConfirm={() => { setShowModal(false); doSubmit(); }}
        />
      )}
    </div>
  );
};

export default DemoTestPage;
