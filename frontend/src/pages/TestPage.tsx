// src/pages/TestPage.tsx
// Full-featured test page: proctored mode (camera + fullscreen + 3-strike auto-submit)
// and normal mode (no proctoring).

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useFullscreen    from '@/hooks/useFullscreen';
import useAntiCheat     from '@/hooks/useAntiCheat';
import useFaceDetection from '@/hooks/useFaceDetection';
import useTimer         from '@/hooks/useTimer';
import { useThemeStore } from '@/store/themeStore';
import { submitTestApi } from '@/api/testApi';
import { logViolationApi } from '@/api/proctoringApi';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';
import { getAssetUrl, getOptionLetter } from '@/lib/question';
import HoloButton        from '@/components/ui/HoloButton';
import CameraPermissionCheck from '@/components/CameraPermissionCheck';
import ProgressRing      from '@/components/ui/ProgressRing';
import FaceTrackerOverlay from '@/components/ui/FaceTrackerOverlay';
import TestWatermark     from '@/components/ui/TestWatermark';
import { BrandMark }     from '@/components/brand/BrandMark';
import MadeBy            from '@/components/brand/MadeBy';
import {
  ChevronLeft, ChevronRight, Send, AlertTriangle,
  Maximize, Minimize, Shield, Moon, Sun, Monitor,
} from 'lucide-react';

type AnswerMap = Record<string, string>;

const MAX_TAB_SWITCHES = 3;

// ── Question palette button ──────────────────────────────────────
// Shape says where you are (square = current), fill says whether
// you've answered (filled bubble = answered, empty ring = not yet).
const NavBtn = ({ index, isCurrent, isAnswered, onClick }: {
  index: number; isCurrent: boolean; isAnswered: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ', not answered'}`}
    aria-current={isCurrent ? 'step' : undefined}
    className={cn(
      'h-9 w-9 flex items-center justify-center font-mono text-[12px] font-medium tabular transition-colors duration-150 border',
      isCurrent ? 'rounded-[8px] ring-2 ring-ink ring-offset-2 ring-offset-raised' : 'rounded-full',
      isAnswered
        ? 'bg-brand border-brand text-on-brand'
        : 'bg-surface border-ink/25 text-ink/65 hover:border-ink/50 hover:text-ink'
    )}
  >
    {index + 1}
  </button>
);

// ── Mobile block screen ──────────────────────────────────────────
const MobileBlockScreen = () => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-sm bg-surface border border-line rounded-[14px] shadow-soft p-7 text-center">
      <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mx-auto mb-5">
        <Monitor size={22} />
      </div>
      <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink mb-2">
        This test needs a computer
      </h1>
      <p className="text-[14px] text-ink/60 leading-relaxed mb-5">
        Tests can only be taken on a desktop or laptop. Proctoring and fullscreen mode
        don't work on phones and tablets.
      </p>
      <p className="text-[13px] text-ink/70 bg-raised border border-line rounded-[10px] px-4 py-3 leading-relaxed">
        Open Nexus on a computer to continue. Already on one? Make the browser window wider and reload.
      </p>
    </div>
  </div>
);

// ── Pre-start screen ─────────────────────────────────────────────
const PreScreen = ({
  title, questionCount, totalTime, isProctored, onStart, onCameraStatusChange,
}: {
  title: string; questionCount: number; totalTime: number;
  isProctored: boolean; onStart: () => void; onCameraStatusChange?: (ready: boolean) => void;
}) => {
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCameraStatusChange = (ready: boolean) => {
    setIsCameraReady(ready);
    onCameraStatusChange?.(ready);
  };

  const rules = isProctored ? [
    'The test opens in fullscreen.',
    'Your camera stays on the whole time. Keep your face in the frame.',
    'Switch tabs 3 times and the test submits itself.',
    'Developer tools and shortcuts like F12 are blocked.',
    'Your result is saved together with the proctoring log.',
  ] : [
    'The test submits itself when the time runs out.',
    'You can\'t retake this attempt.',
    'Fullscreen is optional.',
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 sm:px-8 h-16 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrandMark size={22} />
          <span className="font-display text-[18px] uppercase text-ink">Nexus</span>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1.5 h-7 px-3 rounded-full border font-mono text-[11px] uppercase tracking-[0.08em]',
          isProctored ? 'border-bad/40 text-bad' : 'border-line text-ink/65'
        )}>
          {isProctored ? <Shield size={12} /> : <Monitor size={12} />}
          {isProctored ? 'Proctored' : 'Normal mode'}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-6">
        <div className={cn(
          'w-full grid gap-5 animate-fade-up',
          isProctored ? 'max-w-[1060px] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] items-stretch' : 'max-w-[560px]'
        )}>
          {/* Test details, rules and the start button */}
          <section className="bg-surface border border-line rounded-[14px] p-6 sm:p-7 flex flex-col">
            <p className="label-caps mb-2">Ready when you are</p>
            <h1 className="font-display text-[24px] sm:text-[26px] tracking-tight text-ink leading-tight line-clamp-2" title={title}>
              {title}
            </h1>

            <dl className="grid grid-cols-3 mt-5 border border-line rounded-[10px] divide-x divide-line">
              {[
                { label: 'Questions', value: questionCount },
                { label: 'Minutes',   value: Math.round(totalTime / 60) },
                { label: 'Marks',     value: questionCount },
              ].map((s) => (
                <div key={s.label} className="px-3 py-3 text-center">
                  <dd className="font-display text-[26px] leading-none text-ink tabular">{s.value}</dd>
                  <dt className="label-caps mt-2">{s.label}</dt>
                </div>
              ))}
            </dl>

            <p className="text-[14px] font-semibold text-ink mt-6 mb-3">Before you start</p>
            <ol className="space-y-2">
              {rules.map((r, i) => (
                <li key={r} className="flex gap-3 text-[14px] text-ink/70 leading-snug">
                  <span className="font-mono text-[12px] text-ink/40 pt-0.5 tabular">{String(i + 1).padStart(2, '0')}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-6">
              <HoloButton
                variant="cyan"
                size="lg"
                fullWidth
                onClick={onStart}
                disabled={isProctored && !isCameraReady}
                icon={isProctored ? <Shield size={17} /> : <Maximize size={17} />}
              >
                {isProctored
                  ? (isCameraReady ? 'Start proctored test' : 'Check your camera first')
                  : 'Start test'}
              </HoloButton>
              {isProctored && !isCameraReady && (
                <p className="text-[13px] text-ink/55 mt-2.5 text-center">
                  The start button unlocks once the camera check passes.
                </p>
              )}
            </div>
          </section>

          {/* Camera check for proctored tests */}
          {isProctored && (
            <section className="bg-surface border border-line rounded-[14px] p-5 sm:p-6">
              <CameraPermissionCheck
                onCameraReady={handleCameraStatusChange}
                onError={(error) => console.error('[Proctoring] Camera error:', error)}
              />
            </section>
          )}
        </div>
      </main>

      <footer className="pb-5">
        <MadeBy align="center" />
      </footer>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────
const TestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    attemptId:      string;
    questions:      Question[];
    title:          string;
    totalQuestions: number;
    totalTime:      number;
    isProctored?:   boolean;
  } | null;

  useEffect(() => {
    if (!state?.attemptId) navigate('/test-setup', { replace: true });
  }, [state, navigate]);

  if (!state?.attemptId) return null;

  return (
    <TestContent
      attemptId={state.attemptId}
      questions={state.questions}
      title={state.title}
      totalTime={state.totalTime}
      isProctored={state.isProctored ?? false}
    />
  );
};

// ── TestContent ──────────────────────────────────────────────────
const TestContent = ({
  attemptId, questions, title, totalTime, isProctored,
}: {
  attemptId: string; questions: Question[]; title: string;
  totalTime: number; isProctored: boolean;
}) => {
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const { theme, toggleThemeTemporarily } = useThemeStore();
  const [started,    setStarted]    = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitCalledRef         = useRef(false);

  // ── Extract student email from localStorage ──────────────────
  const studentEmail = (() => {
    try {
      const userStr = localStorage.getItem('apt_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.email || 'Student';
      }
    } catch {
      // In case of parsing error, silently fail
    }
    return 'Student';
  })();

  // ── Face Detection (proctored only) ─────────────────────────
  const {
    videoRef, isFaceDetected, isActive: cameraActive,
    cameraError, isLoading: cameraLoading, startCamera, stopCamera,
  } = useFaceDetection(isProctored);

  // ── Anti-Cheat ───────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    if (!autoSubmitCalledRef.current) {
      autoSubmitCalledRef.current = true;
      handleSubmit(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { warningCount, tabSwitchCount, isWarningVisible, lastWarning, dismissWarning } =
    useAntiCheat({
      isTestActive:  started,
      mode:          isProctored ? 'proctored' : 'normal',
      maxTabSwitches: MAX_TAB_SWITCHES,
      onAutoSubmit:  handleAutoSubmit,
      onViolation: (type, message) => {
        if (isProctored) {
          logViolationApi(attemptId, { type, details: message }).catch(() => {});
        }
      }
    });

  // Track face missing duration to avoid spamming the API
  const faceMissingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!started || !isProctored || cameraError || !cameraActive) return;

    if (!isFaceDetected) {
      if (!faceMissingSinceRef.current) {
        faceMissingSinceRef.current = Date.now();
      } else if (Date.now() - faceMissingSinceRef.current > 3000) { // 3 seconds continuous missing
        logViolationApi(attemptId, { type: 'face_missing', details: 'Face not detected for over 3 seconds continuously.' }).catch(() => {});
        faceMissingSinceRef.current = Date.now(); // Reset to log again after another 3s if still missing
      }
    } else {
      faceMissingSinceRef.current = null;
    }
  }, [isFaceDetected, started, isProctored, cameraError, cameraActive, attemptId]);

  // ── Submit handler ───────────────────────────────────────────
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      if (isProctored) { stopCamera(); await exitFullscreen(); }
      try {
        const answersArray = questions.map((q) => ({
          questionId:     q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent:      Math.round(totalTime / questions.length),
        }));
        const res = await submitTestApi(attemptId, { answers: answersArray, totalTime });
        if (res.success && res.data) {
          navigate('/result', { state: { result: res.data, title, isAutoSubmit: auto, isProctored }, replace: true });
        }
      } catch { setSubmitting(false); }
    },
    [answers, attemptId, exitFullscreen, submitting, navigate, questions, title, totalTime, isProctored, stopCamera]
  );

  // Timer auto-submit
  const { formattedTime, timeLeft } = useTimer(totalTime, () => handleSubmit(true));

  // ── Start test ───────────────────────────────────────────────
  const handleStart = async () => {
    if (isProctored) {
      await enterFullscreen();
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        // If camera failed, exit fullscreen and abort
        await exitFullscreen();
        return; // cameraError will show up, can't continue
      }
    }
    setStarted(true);
  };

  const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    return <MobileBlockScreen />;
  }

  const q             = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress      = Math.round((answeredCount / questions.length) * 100);
  const isTimeCrit    = timeLeft <= 60;
  if (!started) {
    return (
      <div className="relative">
        <PreScreen
          title={title}
          questionCount={questions.length}
          totalTime={totalTime}
          isProctored={isProctored}
          onStart={handleStart}
        />
        {cameraError && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-surface border border-bad/40 text-bad px-5 py-3 rounded-[12px] shadow-lift animate-fade-in flex items-center gap-3 w-[90%] max-w-md">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <p className="text-[14px] font-medium leading-snug">{cameraError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      {/* ── Test Watermark ────────────────────────────────── */}
      <TestWatermark studentEmail={studentEmail} />

      {/* ── Face Tracker Overlay (proctored only) ──────────── */}
      {isProctored && (
        <FaceTrackerOverlay
          videoRef={videoRef}
          isFaceDetected={isFaceDetected}
          isActive={cameraActive}
          cameraError={cameraError}
          isLoading={cameraLoading}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={MAX_TAB_SWITCHES}
        />
      )}

      {/* ── Camera disconnection warning modal ────────────── */}
      {isProctored && cameraError && started && (
        <div className="fixed inset-0 z-[60] bg-canvas/95 flex items-center justify-center p-4 animate-fade-in">
          <div role="alertdialog" aria-labelledby="cam-lost-title" className="bg-surface border border-bad/40 rounded-[14px] shadow-float p-7 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h2 id="cam-lost-title" className="font-display text-[22px] font-semibold tracking-tight text-bad mb-2">Camera disconnected</h2>
            <p className="text-[14px] text-ink/70 mb-6 leading-relaxed">{cameraError}</p>
            <HoloButton
              variant="danger"
              fullWidth
              onClick={() => {
                handleSubmit(false);
              }}
            >
              End test and submit
            </HoloButton>
          </div>
        </div>
      )}

      {/* ── Anti-cheat warning modal ───────────────────────── */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[60] bg-canvas/95 flex items-center justify-center p-4 animate-fade-in">
          <div role="alertdialog" aria-labelledby="violation-title" className="bg-surface border border-bad/40 rounded-[14px] shadow-float p-7 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h2 id="violation-title" className="font-display text-[22px] font-semibold tracking-tight text-bad mb-2">Warning</h2>
            <p className="text-[14px] text-ink/70 mb-5 leading-relaxed">
              {/* strip the leading emoji the hook puts in its messages */}
              {lastWarning?.message.replace(/^[^\p{L}\p{N}]+/u, '')}
            </p>
            {isProctored && (
              <div className="mb-6">
                <div className="flex justify-center gap-1.5 mb-2" aria-hidden="true">
                  {Array.from({ length: MAX_TAB_SWITCHES }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-2 w-8 rounded-full border',
                        i < tabSwitchCount ? 'bg-bad border-bad' : 'bg-transparent border-ink/25'
                      )}
                    />
                  ))}
                </div>
                <p className="font-mono text-[12px] text-bad tabular">
                  Tab switches: {tabSwitchCount} of {MAX_TAB_SWITCHES}
                  {tabSwitchCount >= MAX_TAB_SWITCHES && '. Submitting your test now…'}
                </p>
              </div>
            )}
            {tabSwitchCount < MAX_TAB_SWITCHES && (
              <HoloButton variant="danger" fullWidth onClick={dismissWarning}>
                I understand, back to the test
              </HoloButton>
            )}
          </div>
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────── */}
      <header className={cn(
        'relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 h-16 border-b bg-surface flex-shrink-0',
        isTimeCrit ? 'border-bad/40' : 'border-line'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark size={24} />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-ink truncate max-w-xs">{title}</p>
            <p className="font-mono text-[12px] text-ink/50 truncate tabular">
              {q.topic} · Q{currentIdx + 1}/{questions.length}
            </p>
          </div>
          {isProctored && (
            <span className="hidden sm:inline-flex items-center gap-1 h-6 px-2 rounded-full border border-line bg-raised text-ink/65 text-[11px] font-medium flex-shrink-0">
              <Shield size={11} />
              Proctored
            </span>
          )}
        </div>

        {/* Timer */}
        <div
          className={cn(
            'flex flex-col items-center justify-center px-4 py-1 rounded-[10px] transition-colors duration-300',
            isTimeCrit && 'bg-bad/10'
          )}
          role="timer"
          aria-label={`Time left ${formattedTime}`}
        >
          <span className={cn('label-caps !text-[10px] leading-none', isTimeCrit && '!text-bad')}>
            {isTimeCrit ? 'Under a minute' : 'Time left'}
          </span>
          <span className={cn(
            'font-mono tabular text-[26px] font-medium leading-none mt-1 tracking-tight',
            isTimeCrit ? 'text-bad' : 'text-ink'
          )}>
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {warningCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-bad/30 bg-bad/10 text-bad font-mono text-[12px] tabular"
              title="Tab switches"
            >
              <AlertTriangle size={13} />
              {tabSwitchCount}/{MAX_TAB_SWITCHES}
            </span>
          )}
          <button
            onClick={toggleThemeTemporarily}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {!isProctored && (
            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          )}
          <HoloButton
            variant="cyan"
            size="sm"
            onClick={() => handleSubmit(false)}
            loading={submitting}
            icon={<Send size={13} />}
          >
            Submit
          </HoloButton>
        </div>
      </header>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="h-[3px] bg-line/60 flex-shrink-0">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* ── Main test area ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question panel */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
          <div className="max-w-[760px] mx-auto">

            {/* Q header */}
            <div className="flex items-center justify-between mb-5 animate-fade-up">
              <p className="font-mono text-[13px] text-ink/50 tabular">
                Question{' '}
                <span className="text-[18px] font-medium text-ink">{String(currentIdx + 1).padStart(2, '0')}</span>
                {' '}of {questions.length}
              </p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[12px] h-6 px-2.5 rounded-full border font-medium capitalize',
                  q.difficulty === 'easy'   && 'bg-ok/[0.08] border-ok/30 text-ok',
                  q.difficulty === 'medium' && 'bg-warn/[0.08] border-warn/30 text-warn',
                  q.difficulty === 'hard'   && 'bg-bad/[0.08] border-bad/30 text-bad',
                )}>
                  {q.difficulty}
                </span>
                {answers[q._id] && (
                  <span className="inline-flex items-center text-[12px] h-6 px-2.5 rounded-full bg-brand/10 border border-brand/30 text-brand font-medium">
                    Answered
                  </span>
                )}
              </div>
            </div>

            {/* Question text */}
            <div className="bg-surface border border-line rounded-[14px] shadow-soft p-6 sm:p-8 mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {q.questionImage ? (
                <div className="flex flex-col gap-5">
                  {q.questionText && (
                    <p className="whitespace-pre-line text-ink text-[17px] sm:text-[18px] leading-[1.65]">
                      {q.questionText}
                    </p>
                  )}
                  <div className="flex justify-center rounded-[10px] border border-line bg-snow p-3">
                    <img
                      src={getAssetUrl(q.questionImage)}
                      alt="Question"
                      className="max-w-full max-h-96 object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-ink text-[17px] sm:text-[18px] leading-[1.65]">
                  {q.questionText}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, i) => {
                const optionLetter = getOptionLetter(i);
                const selected = answers[q._id] === optionLetter;

                return (
                  <button
                    key={i}
                    aria-pressed={selected}
                    onClick={() => {
                      setAnswers((prev) => {
                        // Toggle selection: if already selected, deselect; otherwise select
                        if (prev[q._id] === optionLetter) {
                          const newAnswers = { ...prev };
                          delete newAnswers[q._id];
                          return newAnswers;
                        }
                        return { ...prev, [q._id]: optionLetter };
                      });
                    }}
                    className={cn(
                      'answer-option w-full flex items-start gap-4 text-left animate-fade-up',
                      selected && 'selected'
                    )}
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    {/* OMR-style bubble */}
                    <span className={cn(
                      'w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[13px] font-medium flex-shrink-0 transition-colors duration-150',
                      selected
                        ? 'bg-brand border-brand text-on-brand'
                        : 'bg-surface border-ink/30 text-ink/60'
                    )}>
                      {optionLetter}
                    </span>

                    {option.image ? (
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex rounded-[8px] border border-line bg-snow p-2">
                          <img
                            src={getAssetUrl(option.image)}
                            alt={`Option ${optionLetter}`}
                            className="max-w-xs max-h-40 object-contain"
                            loading="lazy"
                          />
                        </div>
                        {option.text && (
                          <p className={cn(
                            'text-[15px] mt-2 transition-colors',
                            selected ? 'text-ink' : 'text-ink/75'
                          )}>
                            {option.text}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className={cn(
                        'flex-1 text-[16px] leading-relaxed pt-[3px] transition-colors',
                        selected ? 'text-ink' : 'text-ink/80'
                      )}>
                        {option.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prev / Clear / Next */}
            <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-line">
              <HoloButton
                variant="ghost"
                size="md"
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                icon={<ChevronLeft size={16} />}
              >
                Previous
              </HoloButton>

              <div className="flex items-center gap-2">
                {/* Clear Response Button */}
                {answers[q._id] && (
                  <button
                    onClick={() => setAnswers((prev) => {
                      const newAnswers = { ...prev };
                      delete newAnswers[q._id];
                      return newAnswers;
                    })}
                    className="h-10 px-3 text-[14px] font-medium text-ink/60 hover:text-ink underline-offset-4 hover:underline transition-colors"
                  >
                    Clear response
                  </button>
                )}
                {currentIdx < questions.length - 1 ? (
                  <HoloButton
                    variant="cyan"
                    size="md"
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    icon={<ChevronRight size={16} />}
                  >
                    Next
                  </HoloButton>
                ) : (
                  <HoloButton
                    variant="cyan"
                    size="md"
                    onClick={() => handleSubmit(false)}
                    loading={submitting}
                    icon={<Send size={16} />}
                  >
                    Submit test
                  </HoloButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar: question palette ───────────────────── */}
        <aside className={cn(
          'hidden lg:flex flex-col gap-6 w-64 border-l border-line bg-raised p-5 overflow-y-auto flex-shrink-0',
          isProctored && 'pb-48'
        )}>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} size={52} strokeWidth={5} color="cyan" showLabel={false} />
            <div>
              <p className="text-[14px] text-ink">
                <span className="font-mono font-medium tabular">{answeredCount}</span>
                <span className="text-ink/50"> of {questions.length} answered</span>
              </p>
              <p className="text-[12px] text-ink/50 mt-0.5 tabular">{progress}% done · {questions.length - answeredCount} left</p>
            </div>
          </div>

          {/* Question grid */}
          <div>
            <p className="label-caps mb-3">Questions</p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <NavBtn
                  key={i}
                  index={i}
                  isCurrent={i === currentIdx}
                  isAnswered={!!answers[questions[i]._id]}
                  onClick={() => setCurrentIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <ul className="space-y-2 text-[12px] text-ink/60">
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-brand flex-shrink-0" />
              Answered ({answeredCount})
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full border border-ink/35 bg-surface flex-shrink-0" />
              Not answered ({questions.length - answeredCount})
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-[4px] border border-ink/35 ring-2 ring-ink ring-offset-1 ring-offset-raised flex-shrink-0" />
              Current question
            </li>
          </ul>

          {/* Proctoring status in sidebar */}
          {isProctored && (
            <div className="pt-5 border-t border-line">
              <p className="label-caps mb-3">Proctoring</p>
              <dl className="space-y-2 text-[12px]">
                {[
                  { label: 'Camera',       value: cameraActive ? 'On' : 'Off', dot: cameraActive ? 'bg-ok' : 'bg-ink/25' },
                  { label: 'Fullscreen',   value: isFullscreen ? 'On' : 'Off', dot: isFullscreen ? 'bg-ok' : 'bg-warn' },
                  {
                    label: 'Tab switches',
                    value: `${tabSwitchCount} of ${MAX_TAB_SWITCHES}`,
                    dot: tabSwitchCount === 0 ? 'bg-ok' : tabSwitchCount < MAX_TAB_SWITCHES ? 'bg-warn' : 'bg-bad',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-ink/60">
                      <span className={cn('w-2 h-2 rounded-full', row.dot)} />
                      {row.label}
                    </dt>
                    <dd className="font-mono text-ink/80 tabular">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TestPage;
