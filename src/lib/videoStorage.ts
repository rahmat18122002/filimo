import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

export const VIDEO_BUCKET = "videos";
/** Маркер, ки нишон медиҳад видео дар анбори барнома аст */
export const STORAGE_PREFIX = "storage:";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;

/** Оё ин линк ба анбори худи барнома ишора мекунад? */
export function isStorageVideo(url: string): boolean {
  return url.trim().startsWith(STORAGE_PREFIX);
}

/**
 * `storage:movies/xxx.mp4` → линки муваққатии MP4 (кор мекунад 6 соат).
 * Линкҳои оддии http бетағйир бармегарданд.
 */
export async function resolveVideoUrl(rawUrl: string): Promise<string> {
  const url = rawUrl.trim();
  if (!isStorageVideo(url)) return url;

  const path = url.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 6);

  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

/**
 * Боркунии файлҳои калон бо TUS (resumable) — агар интернет қатъ шавад,
 * боркунӣ аз ҳамон ҷо давом мекунад ва фоизи иҷро нишон дода мешавад.
 */
export async function uploadLargeVideo(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Танҳо админ метавонад видео бор кунад.");

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const objectName = `${Date.now()}_${safeName}`;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${PROJECT_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 6000, 12000, 24000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: VIDEO_BUCKET,
        objectName,
        contentType: file.type || "video/mp4",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });

  return `${STORAGE_PREFIX}${objectName}`;
}

export async function deleteStorageVideo(rawUrl: string): Promise<void> {
  if (!isStorageVideo(rawUrl)) return;
  await supabase.storage
    .from(VIDEO_BUCKET)
    .remove([rawUrl.trim().slice(STORAGE_PREFIX.length)]);
}
