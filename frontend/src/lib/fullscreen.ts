// Fullscreen helpers that also cover Safari.
//
// Older iPad Safari only has the webkit-prefixed API, and iPhone Safari has
// no page fullscreen at all (only <video> can go fullscreen there). Callers
// use isFullscreenSupported() to fall back gracefully instead of failing.

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const doc = () => document as WebkitDocument;

export const FULLSCREEN_CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

export const isFullscreenSupported = (): boolean =>
  !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);

export const getFullscreenElement = (): Element | null =>
  doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null;

export const requestPageFullscreen = async (): Promise<void> => {
  const el = document.documentElement as WebkitElement;
  if (el.requestFullscreen) await el.requestFullscreen();
  else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  else throw new Error('Fullscreen is not supported on this device');
};

export const exitPageFullscreen = async (): Promise<void> => {
  if (!getFullscreenElement()) return;
  if (document.exitFullscreen) await document.exitFullscreen();
  else await doc().webkitExitFullscreen?.();
};

export const onFullscreenChange = (handler: () => void): (() => void) => {
  FULLSCREEN_CHANGE_EVENTS.forEach((e) => document.addEventListener(e, handler));
  return () => FULLSCREEN_CHANGE_EVENTS.forEach((e) => document.removeEventListener(e, handler));
};
