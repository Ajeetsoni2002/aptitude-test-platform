// Shared camera stream for proctored tests.
//
// The camera check on the pre-start screen and the floating preview during
// the test use the SAME stream. Opening the webcam a second time (often at a
// different resolution) makes many Windows cameras end or blank the first
// stream, which showed up as a black preview during the test.
//
// acquireCamera() returns the live stream (opening it once), and
// releaseCamera() stops it only when the last user lets go.

let stream: MediaStream | null = null;
let users = 0;
let pending: Promise<MediaStream> | null = null;

const isLive = (s: MediaStream) => s.getVideoTracks().some((t) => t.readyState === 'live');

export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
  audio: false,
};

export async function acquireCamera(): Promise<MediaStream> {
  if (stream && isLive(stream)) {
    users += 1;
    return stream;
  }
  // The old stream died (unplugged, revoked); start fresh.
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    users = 0;
  }
  if (!pending) {
    pending = navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS).finally(() => { pending = null; });
  }
  const s = await pending;
  stream = s;
  users += 1;
  return s;
}

export function releaseCamera(s: MediaStream | null | undefined) {
  if (!s) return;
  if (s !== stream) {
    // Not the shared stream (already replaced): just stop it.
    s.getTracks().forEach((t) => t.stop());
    return;
  }
  users = Math.max(0, users - 1);
  if (users === 0) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}
