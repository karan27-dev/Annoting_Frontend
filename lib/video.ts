// Samples a video into JPEG frames entirely in the browser. Video is never
// annotated directly (same model as Roboflow): it's decoded with a <video>
// element, frames are grabbed off a canvas at a chosen rate, and each frame
// flows into the dataset as an ordinary image.

const MAX_FRAMES_PER_VIDEO = 300;
const SEEK_TIMEOUT_MS = 10_000;

const VIDEO_EXTS = [".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"];

export function isVideoFile(f: File): boolean {
  const name = f.name.toLowerCase();
  return (
    f.type.startsWith("video/") || VIDEO_EXTS.some((ext) => name.endsWith(ext))
  );
}

export async function extractVideoFrames(
  file: File,
  fps: number,
  onProgress?: (done: number, total: number) => void,
): Promise<File[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(
          new Error(
            `Could not read ${file.name} — the browser can't decode this video format.`,
          ),
        );
    });

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0 || !video.videoWidth) {
      throw new Error(`Could not read ${file.name} — no decodable video track.`);
    }

    const step = 1 / fps;
    const total = Math.min(
      Math.max(1, Math.floor(duration * fps)),
      MAX_FRAMES_PER_VIDEO,
    );

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");

    const stem = file.name.replace(/\.[^.]+$/, "");
    const frames: File[] = [];

    for (let i = 0; i < total; i++) {
      // Nudge off exact 0 / exact duration — both can skip the seeked event.
      const t = Math.min(Math.max(i * step, 0.01), Math.max(0, duration - 0.05));
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/jpeg", 0.9),
      );
      if (blob) {
        frames.push(
          new File(
            [blob],
            `${stem}_frame_${String(i + 1).padStart(4, "0")}.jpg`,
            { type: "image/jpeg" },
          ),
        );
      }
      onProgress?.(i + 1, total);
    }

    if (frames.length === 0) {
      throw new Error(`No frames could be extracted from ${file.name}.`);
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - t) < 0.001 && video.readyState >= 2) {
      resolve();
      return;
    }
    const timer = setTimeout(
      () => reject(new Error("Video seek timed out — file may be corrupt.")),
      SEEK_TIMEOUT_MS,
    );
    video.onseeked = () => {
      clearTimeout(timer);
      video.onseeked = null;
      resolve();
    };
    video.currentTime = t;
  });
}
