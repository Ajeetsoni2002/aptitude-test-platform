// frontend/src/hooks/useAntiCheat.ts
// Enhanced Anti-Cheat: 3-strike auto-submit, fullscreen monitoring,
// keyboard shortcut blocking (F12, DevTools, Ctrl+Tab, etc.)

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFullscreenElement, onFullscreenChange } from '@/lib/fullscreen';

export type AntiCheatMode = 'proctored' | 'normal';

export interface AntiCheatWarning {
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'KEYBOARD_SHORTCUT';
  message: string;
  timestamp: Date;
}

interface UseAntiCheatOptions {
  isTestActive: boolean;
  mode?: AntiCheatMode;
  maxTabSwitches?: number; // default: 3
  onAutoSubmit?: () => void;
  onViolation?: (type: string, message: string) => void;
}

interface UseAntiCheatReturn {
  warningCount:      number;
  tabSwitchCount:    number;
  lastWarning:       AntiCheatWarning | null;
  isWarningVisible:  boolean;
  dismissWarning:    () => void;
  violations:        AntiCheatWarning[];
}

const useAntiCheat = ({
  isTestActive,
  mode = 'proctored',
  maxTabSwitches = 3,
  onAutoSubmit,
  onViolation,
}: UseAntiCheatOptions): UseAntiCheatReturn => {
  const [warningCount,     setWarningCount]     = useState(0);
  const [tabSwitchCount,   setTabSwitchCount]   = useState(0);
  const [lastWarning,      setLastWarning]       = useState<AntiCheatWarning | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [violations,       setViolations]       = useState<AntiCheatWarning[]>([]);

  const isActiveRef      = useRef(isTestActive);
  const tabSwitchRef     = useRef(0);
  const onAutoSubmitRef  = useRef(onAutoSubmit);
  const modeRef          = useRef(mode);

  useEffect(() => { isActiveRef.current = isTestActive; },    [isTestActive]);
  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);
  useEffect(() => { modeRef.current = mode; },                [mode]);

  // ── Add a warning and optionally trigger auto-submit ──────────
  const addWarning = useCallback((type: AntiCheatWarning['type'], message: string, isTabSwitch = false) => {
    if (!isActiveRef.current) return;

    const warning: AntiCheatWarning = { type, message, timestamp: new Date() };
    setViolations(prev => [...prev, warning]);
    setLastWarning(warning);
    setWarningCount(prev => prev + 1);
    setIsWarningVisible(true);

    if (onViolation) {
      // Map to backend violation types if possible, otherwise use 'other'
      let mappedType = 'other';
      if (type === 'TAB_SWITCH') mappedType = 'tab_switch';
      if (type === 'FULLSCREEN_EXIT') mappedType = 'fullscreen_exit';
      
      onViolation(mappedType, message);
    }

    if (isTabSwitch) {
      const newCount = tabSwitchRef.current + 1;
      tabSwitchRef.current = newCount;
      setTabSwitchCount(newCount);

      // Auto-submit after maxTabSwitches — EXACT behavior as specified
      if (newCount >= maxTabSwitches && onAutoSubmitRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) {
            onAutoSubmitRef.current?.();
          }
        }, 1500); // small delay so warning is visible
      }
    }
  }, [maxTabSwitches]);

  // ── Tab Switch Detection (visibilitychange) ───────────────────
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const count = tabSwitchRef.current + 1;
        const remaining = maxTabSwitches - count;
        addWarning(
          'TAB_SWITCH',
          remaining > 0
            ? `You left the test tab. ${remaining} more ${remaining === 1 ? 'switch' : 'switches'} and the test submits itself.`
            : 'That was the last allowed tab switch. Submitting your test now.',
          true
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTestActive, addWarning, maxTabSwitches]);

  // ── Window Blur Detection (Alt+Tab, outside click) ───────────
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored') return;

    let blurTimeout: ReturnType<typeof setTimeout>;
    const handleBlur = () => {
      // Debounce to avoid duplicate with visibilitychange
      blurTimeout = setTimeout(() => {
        if (!document.hidden && isActiveRef.current) {
          addWarning('WINDOW_BLUR', 'The test window lost focus. Stay on this window until you submit.');
        }
      }, 300);
    };
    const handleFocus = () => clearTimeout(blurTimeout);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isTestActive, addWarning]);

  // ── Fullscreen Exit Detection ─────────────────────────────────
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored') return;

    // iPhone Safari never enters fullscreen, so this never fires there.
    return onFullscreenChange(() => {
      if (!getFullscreenElement() && isActiveRef.current) {
        addWarning('FULLSCREEN_EXIT', 'You left full screen, so the test is being submitted.');
        if (onAutoSubmitRef.current) {
          setTimeout(() => {
            if (isActiveRef.current) onAutoSubmitRef.current?.();
          }, 1500); // 1.5 seconds so they can see why it happened
        }
      }
    });
  }, [isTestActive, addWarning]);

  // ── Keep the phone screen awake ───────────────────────────────
  // If a phone auto-locks mid-test the page goes hidden and that counts as a
  // tab switch. The wake lock is dropped whenever the page is hidden, so it
  // is requested again each time the student comes back.
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored' || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (document.hidden || cancelled) return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
      } catch { /* low battery mode or not allowed; nothing to do */ }
    };
    const handleVisible = () => { if (!document.hidden) request(); };

    request();
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisible);
      lock?.release().catch(() => {});
    };
  }, [isTestActive]);

  // ── Browser Back Button Blocking ─────────────────────────────
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored') return;

    // Push state so we have something to pop
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // User pressed back button
      addWarning('WINDOW_BLUR', 'You pressed back, so the test is being submitted.');
      if (onAutoSubmitRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) onAutoSubmitRef.current?.();
        }, 1500);
      }
      // Re-push state to keep them on page while it submits
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isTestActive, addWarning]);

  // ── Keyboard Shortcut Blocking ────────────────────────────────
  useEffect(() => {
    if (!isTestActive) return;

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (key === 'f12') { e.preventDefault(); return; }
      if (ctrl && shift && ['i', 'j', 'c', 'k'].includes(key)) { e.preventDefault(); return; }

      // View Source: Ctrl+U
      if (ctrl && key === 'u') { e.preventDefault(); return; }

      // Save: Ctrl+S
      if (ctrl && key === 's') { e.preventDefault(); return; }

      // Copy/Paste/Cut: Ctrl+C, Ctrl+V, Ctrl+X
      if (ctrl && ['c', 'v', 'x'].includes(key)) { e.preventDefault(); return; }

      // Tab navigation in proctored mode
      if (modeRef.current === 'proctored') {
        // Alt+Tab (can't always block OS-level but can prevent browser behavior)
        if (alt && key === 'tab') { e.preventDefault(); return; }

        // Ctrl+Tab (switch browser tabs)
        if (ctrl && key === 'tab') { e.preventDefault(); return; }

        // Ctrl+W (close tab)
        if (ctrl && key === 'w') { e.preventDefault(); return; }

        // Ctrl+N / Ctrl+T (new window/tab)
        if (ctrl && (key === 'n' || key === 't')) { e.preventDefault(); return; }

        // Escape (may exit fullscreen)
        // We can't prevent Escape from exiting fullscreen, but we can detect it
      }

      // Right-click context menu block
    };

    const blockContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('keydown', blockKeys);
    document.addEventListener('contextmenu', blockContextMenu);
    return () => {
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [isTestActive]);

  // ── Beforeunload (prevent accidental exit) ────────────────────
  useEffect(() => {
    if (!isTestActive || modeRef.current !== 'proctored') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your test will be auto-submitted.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTestActive]);

  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false);
  }, []);

  return { warningCount, tabSwitchCount, lastWarning, isWarningVisible, dismissWarning, violations };
};

export default useAntiCheat;
