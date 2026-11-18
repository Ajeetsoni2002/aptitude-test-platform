// frontend/src/components/ui/FaceTrackerOverlay.tsx
// Floating camera preview + full-screen red warning
// when face is not detected in proctored mode.

import { Camera, AlertTriangle, Eye, EyeOff, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceTrackerOverlayProps {
  videoRef:       React.RefObject<HTMLVideoElement>;
  isFaceDetected: boolean;
  isActive:       boolean;
  cameraError:    string | null;
  isLoading:      boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
}

const FaceTrackerOverlay = ({
  videoRef,
  isFaceDetected,
  isActive,
  cameraError,
  isLoading,
  tabSwitchCount,
  maxTabSwitches,
}: FaceTrackerOverlayProps) => {
  const warningIntensity = !isFaceDetected && isActive;

  return (
    <>
      {/* ── Full-screen Face Warning Overlay ─────────────────── */}
      {warningIntensity && (
        <div
          className="fixed inset-0 z-[80] pointer-events-none"
          style={{
            animation: 'face-warning-pulse 1s ease-in-out infinite',
          }}
        >
          {/* Red frame around the whole screen */}
          <div className="absolute inset-0 border-[6px] border-bad bg-bad/[0.06]" />

          {/* Warning message, near the top so it never covers a rule-warning dialog */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none w-[90%] max-w-md">
            <div role="alert" className="flex items-center gap-4 bg-surface border border-bad/50 rounded-[14px] shadow-float px-5 py-4">
              <div className="w-11 h-11 rounded-full bg-bad/10 text-bad flex items-center justify-center flex-shrink-0">
                <EyeOff size={20} />
              </div>
              <div className="text-left">
                <p className="font-mono text-[15px] font-bold uppercase tracking-[0.04em] text-bad leading-tight">
                  Face not detected
                </p>
                <p className="text-[14px] text-ink/70 mt-0.5">
                  Look at the camera to continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Camera Preview (bottom-right) ──────────── */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">

        {/* Tab switch counter */}
        {tabSwitchCount > 0 && (
          <div className={cn(
            'flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-mono font-medium tabular border shadow-soft',
            tabSwitchCount >= maxTabSwitches - 1
              ? 'bg-bad text-on-brand border-bad'
              : 'bg-surface text-warn border-warn/50'
          )}>
            <AlertTriangle size={12} />
            {tabSwitchCount}/{maxTabSwitches} tab switches
          </div>
        )}

        {/* Camera box */}
        <div
          className={cn(
            'relative rounded-[12px] overflow-hidden border-2 bg-coal shadow-lift transition-colors duration-300',
            isActive && isFaceDetected
              ? 'border-ok'
              : isActive && !isFaceDetected
              ? 'border-bad'
              : 'border-line'
          )}
          style={{ width: 160, height: 120 }}
        >
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-coal"
            style={{
              transform: 'scaleX(-1)',
              filter: isActive && !isFaceDetected ? 'hue-rotate(300deg) saturate(2)' : 'none',
            }}
          />

          {/* Overlay when loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-coal/85 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-snow/70 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Overlay when camera error */}
          {cameraError && !isLoading && (
            <div className="absolute inset-0 bg-coal/85 flex flex-col items-center justify-center gap-1 p-2">
              <WifiOff size={20} className="text-bad" />
              <p className="text-[10px] text-snow/80 text-center leading-tight">Camera unavailable</p>
            </div>
          )}

          {/* Overlay when inactive */}
          {!isActive && !isLoading && !cameraError && (
            <div className="absolute inset-0 bg-coal/85 flex items-center justify-center">
              <Camera size={24} className="text-snow/40" />
            </div>
          )}

          {/* Face detection indicator (top-left) */}
          {isActive && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-coal/60">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isFaceDetected ? 'bg-ok' : 'bg-bad'
              )} />
              <span className="text-[9px] font-mono text-snow/85">
                {isFaceDetected ? 'Face OK' : 'No face'}
              </span>
            </div>
          )}

          {/* Corner frame marks */}
          {isActive && isFaceDetected && (
            <>
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ok" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-ok" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-ok" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ok" />
            </>
          )}

          {/* Proctored label */}
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-coal/60">
            <span className="text-[9px] font-mono text-snow/70">
              Proctored
            </span>
          </div>
        </div>

        {/* Status label */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-line">
          {isActive ? (
            isFaceDetected
              ? <Eye size={11} className="text-ok" />
              : <EyeOff size={11} className="text-bad" />
          ) : (
            <Camera size={11} className="text-ink/40" />
          )}
          <span className={cn(
            'text-[11px] font-medium',
            isActive && isFaceDetected ? 'text-ok'
            : isActive ? 'text-bad'
            : 'text-ink/50'
          )}>
            {isLoading ? 'Starting camera…'
              : cameraError ? 'Camera error'
              : isActive && isFaceDetected ? 'Face detected'
              : isActive ? 'Face missing'
              : 'Camera off'}
          </span>
        </div>
      </div>
    </>
  );
};

export default FaceTrackerOverlay;
