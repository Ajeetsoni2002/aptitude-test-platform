// frontend/src/hooks/useFullscreen.ts
// ─────────────────────────────────────────────────────────────
// Custom Hook: Fullscreen API wrapper
// Kyun: Browser fullscreen API thoda verbose hai + cross-browser issues
// (Safari ko webkit prefix chahiye, iPhone pe page fullscreen hota hi nahi).
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  isFullscreenSupported, getFullscreenElement,
  requestPageFullscreen, exitPageFullscreen, onFullscreenChange,
} from '@/lib/fullscreen';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  /** false on iPhone Safari, where only videos can go fullscreen */
  isSupported: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

const useFullscreen = (): UseFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = useState(() => !!getFullscreenElement());
  const [isSupported] = useState(isFullscreenSupported);

  // ─── Fullscreen state track karo ──────────────────────────
  // User ESC press kare (ya phone pe back) toh bhi detect hona chahiye
  useEffect(() => onFullscreenChange(() => setIsFullscreen(!!getFullscreenElement())), []);

  // ─── Enter Fullscreen ──────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    if (!isSupported) return;
    try {
      await requestPageFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [isSupported]);

  // ─── Exit Fullscreen ───────────────────────────────────────
  const exitFullscreen = useCallback(async () => {
    try {
      await exitPageFullscreen();
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  }, []);

  return { isFullscreen, isSupported, enterFullscreen, exitFullscreen };
};

export default useFullscreen;
