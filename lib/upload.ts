import { api, API_URL, getToken } from "@/lib/api";

// Uploads a dataset file by streaming it THROUGH our backend to storage. The
// browser only ever talks to our own origin, so there's no R2 CORS to satisfy —
// uploads work out of the box. Reports progress 0..100 via onProgress.
export async function uploadDataset(
  projectId: string,
  file: File,
  onProgress?: (pct: number) => void,
  _estimatedCount = 1,
): Promise<void> {
  const form = new FormData();
  form.append("project_id", projectId);
  form.append("file", file, file.name);

  await postWithProgress(`${API_URL}/uploads/direct`, form, onProgress);
}

// Uploads one or more images into a self-serve dataset (backend-proxied to
// storage, no CORS). Returns how many were accepted.
export async function uploadDatasetImages(
  projectId: string,
  files: File[],
  onProgress?: (pct: number) => void,
): Promise<{ uploaded: number; total_images: number }> {
  const form = new FormData();
  for (const f of files) form.append("files", f, f.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/datasets/${projectId}/images`, true);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ uploaded: files.length, total_images: 0 });
        }
      } else {
        let detail = `Upload failed (HTTP ${xhr.status})`;
        try {
          detail = JSON.parse(xhr.responseText).detail ?? detail;
        } catch {
          /* ignore */
        }
        reject(new Error(detail));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — could not reach the server."));
    xhr.send(form);
  });
}

// Registers a Google Drive share link as the project's data source. The
// backend lists/streams the files and counts them.
export async function linkGoogleDrive(
  projectId: string,
  link: string,
): Promise<void> {
  await api("/uploads/gdrive", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, link }),
  });
}

function postWithProgress(
  url: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      // Surface the backend's error detail when present.
      let detail = `Upload failed (HTTP ${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body.detail) detail = body.detail;
      } catch {
        /* ignore */
      }
      reject(new Error(detail));
    };
    xhr.onerror = () =>
      reject(new Error("Upload failed — could not reach the server."));
    xhr.send(form);
  });
}

export { API_URL, getToken };
