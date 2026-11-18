import { useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  RotateCcw,
  Home,
  Trophy,
  Target,
  TrendingUp,
  Dumbbell,
  Sprout,
} from "lucide-react";
import { demoQuestions } from "@/data/demoQuestions";
import { Wordmark } from "@/components/brand/BrandMark";
import MadeBy from '@/components/brand/MadeBy';
import ThemeToggle from "@/components/ui/ThemeToggle";
import HoloButton from "@/components/ui/HoloButton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DemoResultState {
  selectedOptions: (number | null)[];
  timeTaken: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const getFeedback = (score: number) => {
  if (score >= 9) return { icon: Trophy, text: "Excellent. You got almost everything right.", color: "text-ok" };
  if (score >= 7) return { icon: Target, text: "A strong result. Check the few you missed below.", color: "text-ok" };
  if (score >= 5) return { icon: TrendingUp, text: "A fair start. The solutions below show where the marks slipped.", color: "text-brand" };
  if (score >= 3) return { icon: Dumbbell, text: "Some way to go. Regular timed practice helps most here.", color: "text-warn" };
  return { icon: Sprout, text: "A tough paper. Read the solutions, then try it again.", color: "text-clay" };
};

const optionLabels: [string, string, string, string] = ["A", "B", "C", "D"];

// ---------------------------------------------------------------------------
// Accordion Item
// ---------------------------------------------------------------------------

interface AccordionProps {
  index: number;
  userAnswer: number | null;
}

const QuestionAccordion = ({ index, userAnswer }: AccordionProps) => {
  const [open, setOpen] = useState(false);
  const q = demoQuestions[index];
  const isCorrect = userAnswer === q.correctIndex;
  const isSkipped = userAnswer === null;

  const statusIcon = isSkipped ? (
    <MinusCircle size={16} className="text-ink/40" />
  ) : isCorrect ? (
    <CheckCircle size={16} className="text-ok" />
  ) : (
    <XCircle size={16} className="text-bad" />
  );

  const statusLabel = isSkipped ? "Skipped" : isCorrect ? "Correct" : "Wrong";
  const statusColor = isSkipped ? "text-ink/50" : isCorrect ? "text-ok" : "text-bad";

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-ink/[0.025]"
      >
        <span className="w-8 shrink-0 font-mono text-[13px] text-ink/50">
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <span className="flex-1 min-w-0 text-[14px] text-ink/85 truncate">
          {q.question.slice(0, 80)}
          {q.question.length > 80 && "…"}
        </span>
        <span className={cn("hidden sm:inline-flex w-[84px] items-center gap-1.5 text-[13px] font-medium", statusColor)}>
          {statusIcon}
          {statusLabel}
        </span>
        <span className="sm:hidden">{statusIcon}</span>
        {open ? (
          <ChevronUp size={16} className="text-ink/40 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-ink/40 shrink-0" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 pt-1 sm:pl-[64px]">
          <p className="label-caps mb-2">{q.topic}</p>
          <p className="text-ink text-[15px] leading-relaxed mb-4">{q.question}</p>
          <div className="flex flex-col gap-2 mb-4">
            {q.options.map((opt, oi) => {
              const isUserPick = userAnswer === oi;
              const isCorrectOpt = q.correctIndex === oi;
              return (
                <div
                  key={oi}
                  className={cn(
                    "answer-option !cursor-default !py-2.5 flex items-center gap-3 text-[14px]",
                    isCorrectOpt && "correct",
                    isUserPick && !isCorrectOpt && "wrong",
                    !isCorrectOpt && !isUserPick && "hover:!border-line"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12px] shrink-0",
                      isCorrectOpt
                        ? "border-ok bg-ok text-on-brand"
                        : isUserPick
                          ? "border-bad bg-bad text-on-brand"
                          : "border-ink/25 text-ink/50"
                    )}
                  >
                    {optionLabels[oi]}
                  </span>
                  <span className={isCorrectOpt || isUserPick ? "text-ink" : "text-ink/65"}>{opt}</span>
                  {isCorrectOpt && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-ok shrink-0">
                      <CheckCircle size={14} /> Answer
                    </span>
                  )}
                  {isUserPick && !isCorrectOpt && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-bad shrink-0">
                      <XCircle size={14} /> Your pick
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Explanation */}
          <div className="rounded-[10px] bg-raised border border-line p-4">
            <p className="label-caps mb-1.5">Solution</p>
            <p className="text-[14px] text-ink/80 leading-relaxed">{q.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DemoResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as DemoResultState | null;
  if (!state) return <Navigate to="/demo" replace />;

  const { selectedOptions, timeTaken } = state;
  const total = demoQuestions.length;
  const correct = selectedOptions.filter((opt, i) => opt === demoQuestions[i].correctIndex).length;
  const wrong = selectedOptions.filter((opt, i) => opt !== null && opt !== demoQuestions[i].correctIndex).length;
  const skipped = total - correct - wrong;
  const percentage = Math.round((correct / total) * 100);
  const feedback = getFeedback(correct);
  const FeedbackIcon = feedback.icon;

  const rows: { label: string; value: string; tone?: string }[] = [
    { label: "Correct", value: String(correct), tone: "text-ok" },
    { label: "Wrong", value: String(wrong), tone: "text-bad" },
    { label: "Skipped", value: String(skipped) },
    { label: "Accuracy", value: `${percentage}%` },
    { label: "Time taken", value: formatTime(timeTaken) },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Wordmark to="/" size="sm" />
          <ThemeToggle size="sm" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">
        {/* ── Marksheet ───────────────────────────────────────────── */}
        <section className="rounded-[14px] border border-line bg-surface shadow-soft section-enter">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-6 md:px-8 py-5">
            <div>
              <p className="label-caps mb-1.5">Demo test · Marksheet</p>
              <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight">
                Your demo result
              </h1>
            </div>
            <p className="font-mono text-[12px] text-ink/55">Quantitative aptitude · {total} questions</p>
          </div>

          <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
            {/* Score */}
            <div className="flex flex-col items-center justify-center gap-1 border-b md:border-b-0 md:border-r border-line px-6 py-8">
              <p className="label-caps">Score</p>
              <p className="font-display font-semibold tracking-tight leading-none text-[64px] text-ink">
                {correct}
                <span className="text-[28px] text-ink/40 font-medium">/{total}</span>
              </p>
              <div className="mt-4 w-full max-w-[160px]">
                <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <dl className="px-6 md:px-8 py-4">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-line last:border-b-0"
                >
                  <dt className="text-[14px] text-ink/65">{r.label}</dt>
                  <dd className={cn("ml-auto font-mono text-[15px] font-medium tabular-nums", r.tone ?? "text-ink")}>
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Remark */}
          <div className="flex items-start gap-3 border-t border-line px-6 md:px-8 py-4 bg-raised rounded-b-[14px]">
            <FeedbackIcon size={18} className={cn("mt-0.5 shrink-0", feedback.color)} />
            <p className="text-[14px] text-ink/80">
              <span className="font-medium text-ink">Remark: </span>
              {feedback.text}
            </p>
          </div>
        </section>

        {/* ── Question Review ─────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">Answer review</h2>
            <span className="text-[13px] text-ink/50">Open a question to see the solution</span>
          </div>
          <div className="rounded-[14px] border border-line bg-surface divide-y divide-line overflow-hidden">
            {demoQuestions.map((_, i) => (
              <QuestionAccordion key={i} index={i} userAnswer={selectedOptions[i]} />
            ))}
          </div>
        </section>

        {/* ── Sign-up block ───────────────────────────────────────── */}
        <section className="rounded-[14px] border border-line bg-surface p-6 md:p-8">
          <h3 className="font-display text-[24px] font-semibold tracking-tight mb-1.5">Keep practising with an account</h3>
          <p className="text-[14px] text-ink/60 mb-5">
            This demo is a short quant paper. With a free account you also get:
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-7">
            {[
              "Timed tests in quant, logical reasoning and verbal",
              "Full-length mock tests with proctoring",
              "Topic-by-topic analysis of your attempts",
              "A leaderboard to see where you stand",
              "A new problem of the day, every day",
              "Solutions for every question you attempt",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] text-ink/80">
                <Check size={15} strokeWidth={2.5} className="text-brand mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <HoloButton variant="cyan" size="lg" onClick={() => navigate("/register")} className="sm:flex-1">
              Create a free account <ArrowRight size={16} />
            </HoloButton>
            <HoloButton variant="ghost" size="lg" onClick={() => navigate("/login")} className="sm:flex-1">
              Sign in
            </HoloButton>
          </div>
        </section>

        {/* ── Bottom Actions ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pb-4">
          <button
            onClick={() => navigate("/demo")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-[14px] font-medium text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <RotateCcw size={15} /> Take the demo again
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-[14px] font-medium text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <Home size={15} /> Back to home
          </button>
        </div>
        <MadeBy align="center" className="mt-8 pb-2" />
      </div>
    </div>
  );
};

export default DemoResultPage;
