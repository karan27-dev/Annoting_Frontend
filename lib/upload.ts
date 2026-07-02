import { api, API_URL, getToken } from "@/lib/api";

interface PresignResponse {
  upload_url: string;
  r2_key: string;
}

// Uploads a dataset file straight to R2 via a presigned PUT URL — the file never
// passes through our backend. Reports progress 0..100 via onProgress.
export async function uploadDataset(
  projectId: string,
  file: File,
  onProgress?: (pct: number) => void,
  estimatedCount = 1,
): Promise<string> {
  // Use the same content type for signing and for the PUT, or R2 rejects the signature.
  const contentType = file.type || "application/zip";

  const { upload_url, r2_key } = await api<PresignResponse>(
    "/uploads/presigned-url",
    {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        filename: file.name,
        file_size_bytes: file.size,
        content_type: contentType,
      }),
    },
  );

  // If R2 isn't configured the backend returns a dev-stub URL — skip the real PUT.
  if (upload_url.includes("dev-stub.local")) {
    onProgress?.(100);
  } else {
    await putWithProgress(upload_url, file, contentType, onProgress);
  }

  // file_count is only a dev fallback — with storage configured, the backend
  // counts the real contents of the archive itself.
  await api("/uploads/confirm", {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      r2_key,
      file_count: estimatedCount,
    }),
  });

  return r2_key;
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

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    xhr.onerror = () =>
      reject(
        new Error(
          "Upload blocked — your R2 bucket needs a CORS policy allowing PUT from this site.",
        ),
      );
    xhr.send(file);
  });
}

// (kept for parity with API_URL import in some callers)
export { API_URL, getToken };
