// Module-level singleton so the live webcam/screen-share MediaStreams
// acquired during ExamReadyCheck's permission probe can be handed off to
// ExamTaking instead of being stopped and re-requested. Next.js client-side
// navigation keeps this module's scope alive across the route change (no
// full page reload), so a plain module-level variable survives the handoff.
let pendingWebcamStream: MediaStream | null = null;
let pendingScreenStream: MediaStream | null = null;

function isLive(stream: MediaStream | null): stream is MediaStream {
  return Boolean(stream) && stream!.getVideoTracks().some((track) => track.readyState === "live");
}

export function setPendingWebcamStream(stream: MediaStream | null) {
  if (pendingWebcamStream && pendingWebcamStream !== stream) {
    pendingWebcamStream.getTracks().forEach((track) => track.stop());
  }
  pendingWebcamStream = stream;
}

export function takePendingWebcamStream(): MediaStream | null {
  const stream = isLive(pendingWebcamStream) ? pendingWebcamStream : null;
  pendingWebcamStream = null;
  return stream;
}

export function setPendingScreenStream(stream: MediaStream | null) {
  if (pendingScreenStream && pendingScreenStream !== stream) {
    pendingScreenStream.getTracks().forEach((track) => track.stop());
  }
  pendingScreenStream = stream;
}

export function takePendingScreenStream(): MediaStream | null {
  const stream = isLive(pendingScreenStream) ? pendingScreenStream : null;
  pendingScreenStream = null;
  return stream;
}

export function hasPendingScreenStream(): boolean {
  return isLive(pendingScreenStream);
}

// Called when ExamReadyCheck unmounts WITHOUT the student actually starting
// the exam (navigated away, closed the tab route, etc.) — stops any live
// probe stream so the camera/screen-share indicator doesn't stay on for a
// session that was abandoned before recording ever began.
export function clearPendingProctoringStreams() {
  setPendingWebcamStream(null);
  setPendingScreenStream(null);
}
