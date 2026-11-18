// frontend/src/components/CameraPermissionCheck.tsx
// Camera check with a live preview, shown before a proctored test
// so the student can confirm the camera works.

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, CheckCircle2, AlertCircle, AlertTriangle, Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import HoloButton from '@/components/ui/HoloButton';
import { acquireCamera, releaseCamera } from '@/lib/camera';

interface CameraPermissionCheckProps {
  onCameraReady: (isReady: boolean) => void;
  onError?: (error: string) => void;
}

const CameraPermissionCheck = ({ onCameraReady, onError }: CameraPermissionCheckProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'error' | 'disconnected'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamHealth, setStreamHealth] = useState<'good' | 'degraded' | 'dead'>('good');

  // Check if video stream is actually rendering frames
  const checkStreamHealth = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width === 0 || canvas.height === 0) {
      setStreamHealth('degraded');
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if all pixels are black (stream not rendering)
    let blackPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
        blackPixels++;
      }
    }
    
    const blackRatio = blackPixels / (data.length / 4);
    if (blackRatio > 0.95) {
      setStreamHealth('dead');
    } else {
      setStreamHealth('good');
    }
  };

  const requestCamera = async () => {
    setStatus('checking');
    setErrorMessage(null);

    try {
      // Request camera with specific constraints
      // Shared with the test itself, so the camera is opened only once.
      const stream = await acquireCamera();

      streamRef.current = stream;

      // Set video element source and wait for it to load
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video failed to load')), 5000);
          
          videoRef.current!.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          videoRef.current!.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Video element error'));
          };
        });

        await videoRef.current.play();
      }

      // Start health checks
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
      healthCheckRef.current = setInterval(checkStreamHealth, 1000);

      // Wait a bit then check health
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (streamHealth !== 'good') {
        throw new Error('Camera is not rendering properly. Please check your camera connection and try again.');
      }

      setStatus('ready');
      onCameraReady(true);
    } catch (err) {
      const error = err as Error;
      let message = 'Unknown camera error';

      if (error.name === 'NotAllowedError') {
        message = 'Camera access was blocked. Click "Allow" when your browser asks for the camera, or enable it from the camera icon in the address bar.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Connect a camera to this device and try again.';
      } else if (error.name === 'NotReadableError') {
        message = 'Another app is using the camera. Close it (Zoom, Teams, another tab) and try again.';
      } else if (error.message.includes('not rendering')) {
        message = 'The camera is connected but not sending a picture. Try unplugging it and plugging it back in.';
      } else {
        message = `Camera error: ${error.message}`;
      }

      setErrorMessage(message);
      setStatus('error');
      onCameraReady(false);
      onError?.(message);
    }
  };

  // Monitor for camera disconnection
  useEffect(() => {
    const handleStreamEnded = () => {
      setStatus('disconnected');
      setErrorMessage('Camera was disconnected. Please reconnect and try again.');
      onCameraReady(false);
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.addEventListener('ended', handleStreamEnded);
      });

      return () => {
        streamRef.current?.getTracks().forEach(track => {
          track.removeEventListener('ended', handleStreamEnded);
        });
      };
    }
  }, [status, onCameraReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
      // Hands the stream over: if the test has started it keeps running.
      releaseCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const handleRetry = () => {
    stopCamera();
    setTimeout(() => requestCamera(), 1000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      releaseCamera(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }
    setStatus('idle');
    setStreamHealth('good');
  };

  const isFailed = status === 'error' || status === 'disconnected';

  return (
    <div className="w-full">
      {/* Status header */}
      <div className="flex items-center gap-2 mb-3">
        {status === 'idle' && <Camera size={16} className="text-ink/45" />}
        {status === 'checking' && <Loader2 size={16} className="text-brand animate-spin" />}
        {status === 'ready' && <CheckCircle2 size={16} className="text-ok" />}
        {isFailed && <AlertTriangle size={16} className="text-bad" />}

        <span className={cn(
          'text-[14px] font-medium',
          status === 'idle' && 'text-ink/75',
          status === 'checking' && 'text-brand',
          status === 'ready' && 'text-ok',
          isFailed && 'text-bad'
        )}>
          {status === 'idle' && 'Camera check'}
          {status === 'checking' && 'Checking your camera…'}
          {status === 'ready' && 'Camera ready'}
          {status === 'error' && 'Camera not available'}
          {status === 'disconnected' && 'Camera disconnected'}
        </span>
      </div>

      {/* Camera preview box */}
      <div
        className={cn(
          'relative rounded-[14px] overflow-hidden border mb-4 transition-colors duration-200',
          status === 'ready'
            ? 'border-ok/60 bg-coal'
            : isFailed
            ? 'border-bad/45 bg-raised'
            : status === 'checking'
            ? 'border-brand/50 bg-coal'
            : 'border-dashed border-ink/25 bg-raised'
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover bg-coal',
            status !== 'ready' && 'opacity-50'
          )}
          style={{
            transform: 'scaleX(-1)',
            display: status === 'idle' ? 'none' : 'block',
          }}
        />

        {/* Loading state */}
        {status === 'checking' && (
          <div className="absolute inset-0 bg-coal/60 flex flex-col items-center justify-center gap-2.5">
            <Loader2 size={24} className="text-snow animate-spin" />
            <p className="text-[13px] text-snow/80">Starting camera…</p>
          </div>
        )}

        {/* Ready state - live indicator */}
        {status === 'ready' && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-coal/60 px-2.5 py-1 pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            <span className="font-mono text-[11px] text-snow">Live</span>
          </div>
        )}

        {/* Error/disconnected state */}
        {isFailed && (
          <div className="absolute inset-0 bg-raised flex flex-col items-center justify-center gap-2.5 p-4">
            <CameraOff size={26} className="text-bad" />
            <p className="text-center text-[13px] text-ink/65">
              {status === 'error' ? 'Camera not accessible' : 'Camera disconnected'}
            </p>
          </div>
        )}

        {/* Idle state - hint */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Camera size={26} className="text-ink/30" />
            <p className="text-center text-[13px] text-ink/55">Press &ldquo;Check camera&rdquo; to see your preview</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div role="alert" className="mb-4 px-3.5 py-3 rounded-[10px] border border-bad/25 bg-bad/[0.06] flex gap-2.5">
          <AlertCircle size={16} className="text-bad flex-shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink/80 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <HoloButton
            fullWidth
            variant="cyan"
            onClick={requestCamera}
            icon={<Camera size={15} />}
          >
            Check camera
          </HoloButton>
        )}

        {isFailed && (
          <HoloButton
            fullWidth
            variant="danger"
            onClick={handleRetry}
            icon={<RotateCw size={15} />}
          >
            Try again
          </HoloButton>
        )}

        {status === 'ready' && (
          <button
            disabled
            className="w-full h-10 px-4 rounded-full border border-ok/35 bg-ok/[0.08] text-ok font-mono text-[12px] uppercase tracking-[0.08em] inline-flex items-center justify-center gap-2 cursor-default"
          >
            <CheckCircle2 size={15} /> Camera working. You can start
          </button>
        )}
      </div>

      {/* FYI text */}
      <p className="text-[12px] text-ink/50 mt-3 text-center leading-relaxed">
        Your camera stays on during the test. A small preview sits in the corner so you can see yourself.
      </p>
    </div>
  );
};

export default CameraPermissionCheck;
