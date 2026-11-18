// frontend/src/hooks/useFaceDetection.ts
// Camera stream hook with face detection simulation.
// Face-api.js integration is pre-wired via commented code blocks.
//
// To enable real ML face detection:
//   npm install face-api.js
//   Then uncomment the face-api.js sections below.

import { useState, useEffect, useRef, useCallback } from 'react';
import { acquireCamera, releaseCamera } from '@/lib/camera';

// ── face-api.js integration (COMMENTED — uncomment to enable) ────
// import * as faceapi from 'face-api.js';
// const MODEL_PATH = '/models'; // place face-api models in /public/models/
// let modelsLoaded = false;
// async function loadModels() {
//   if (modelsLoaded) return;
//   await Promise.all([
//     faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
//   ]);
//   modelsLoaded = true;
// }

interface UseFaceDetectionReturn {
  /** Callback ref for the preview <video>. Works whether the element mounts
   *  before or after the camera starts. */
  videoRef:        (el: HTMLVideoElement | null) => void;
  canvasRef:       React.RefObject<HTMLCanvasElement>;
  isFaceDetected:  boolean;
  isLoading:       boolean;
  cameraError:     string | null;
  startCamera:     () => Promise<boolean>;
  stopCamera:      () => void;
  isActive:        boolean;
}

const FACE_CHECK_INTERVAL = 1500; // ms between simulated face checks

const useFaceDetection = (enabled: boolean): UseFaceDetectionReturn => {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null!);
  const streamRef  = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isLoading,      setIsLoading]      = useState(false);
  const [cameraError,    setCameraError]    = useState<string | null>(null);
  const [isActive,       setIsActive]       = useState(false);

  // The camera starts on the pre-start screen, before the floating preview
  // exists. So the stream is kept in a ref and attached whenever a <video>
  // mounts; before this the preview stayed black for the whole test.
  const attachStream = useCallback((el: HTMLVideoElement | null) => {
    const stream = streamRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    el.play().catch(() => { /* autoplay is allowed for muted video; ignore aborts */ });
  }, []);

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    attachStream(el);
  }, [attachStream]);

  // ── Simulated Face Detection ──────────────────────────────────
  // Simulates looking away (face absent) occasionally.
  // Replace this entire function with face-api.js detection for real ML.
  const runSimulatedDetection = useCallback(() => {
    // With face-api.js:
    // const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
    // setIsFaceDetected(detections.length > 0);

    // Simulation: treat document hidden or window blur as "face not detected"
    const facePresent = !document.hidden && document.hasFocus();
    setIsFaceDetected(facePresent);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;
    setIsLoading(true);
    setCameraError(null);

    try {
      // ── face-api.js: Load models before starting camera ──────
      // await loadModels();

      // Reuses the stream the camera check already opened, if it is live.
      const stream = await acquireCamera();

      streamRef.current = stream;
      attachStream(videoElRef.current);

      setIsActive(true);

      // ── Start periodic face detection ─────────────────────
      faceCheckRef.current = setInterval(runSimulatedDetection, FACE_CHECK_INTERVAL);

      // ── face-api.js: Replace interval with requestAnimationFrame loop:
      // const detectLoop = async () => {
      //   if (!videoRef.current || !isActiveRef.current) return;
      //   const detections = await faceapi.detectAllFaces(
      //     videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      //   );
      //   setIsFaceDetected(detections.length > 0);
      //   intervalRef.current = setTimeout(detectLoop, 800) as any;
      // };
      // detectLoop();

      return true;

    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access for proctored mode.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera for proctored mode.');
      } else {
        setCameraError('Camera failed to start: ' + error.message);
      }
      setIsActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, runSimulatedDetection, attachStream]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      releaseCamera(streamRef.current);
      streamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }
    if (faceCheckRef.current) {
      clearInterval(faceCheckRef.current);
      faceCheckRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsFaceDetected(true);
    setCameraError(null);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Start/stop based on enabled prop ─────────────────────────
  useEffect(() => {
    if (!enabled) {
      stopCamera();
    }
  }, [enabled, stopCamera]);
  // ── Monitor for camera disconnection during test ───────
  // Phones (iPhone especially) can end the camera track when the page goes
  // to the background or a call comes in. So before calling it a disconnect,
  // wait until the page is visible again and try to reopen the camera once.
  const [streamVersion, setStreamVersion] = useState(0);

  useEffect(() => {
    const stream = streamRef.current;
    if (!isActive || !stream) return;

    let cancelled = false;
    const failDisconnected = () => {
      stopCamera();
      setCameraError('Camera disconnected. Please reconnect to continue the test.');
    };

    const handleTrackEnded = async () => {
      if (cancelled || streamRef.current !== stream) return;
      releaseCamera(stream);
      streamRef.current = null;
      setIsLoading(true);

      if (document.hidden) {
        await new Promise<void>((resolve) => {
          const onVisible = () => {
            if (document.hidden) return;
            document.removeEventListener('visibilitychange', onVisible);
            resolve();
          };
          document.addEventListener('visibilitychange', onVisible);
        });
      }
      if (cancelled) return;

      try {
        const fresh = await acquireCamera();
        if (cancelled) { releaseCamera(fresh); return; }
        streamRef.current = fresh;
        attachStream(videoElRef.current);
        setStreamVersion((v) => v + 1); // re-arm this effect on the new tracks
      } catch {
        failDisconnected();
      } finally {
        setIsLoading(false);
      }
    };

    const tracks = stream.getTracks();
    tracks.forEach((track) => track.addEventListener('ended', handleTrackEnded));

    return () => {
      cancelled = true;
      tracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded));
    };
  }, [isActive, streamVersion, stopCamera, attachStream]);
  return {
    videoRef,
    canvasRef,
    isFaceDetected,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
    isActive,
  };
};

export default useFaceDetection;
