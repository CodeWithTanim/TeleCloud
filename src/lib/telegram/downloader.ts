import { getClient } from "./client";

export async function downloadFileFromChannel(
  channelId: string,
  messageId: number,
  fileName: string,
  onProgress?: (percentage: number) => void
): Promise<Blob> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  const messages = await client.getMessages(peer, { ids: [messageId] });
  const msg = messages[0];
  if (!msg || !msg.media) {
    throw new Error("File message or media not found on Telegram channel.");
  }

  const buffer = (await client.downloadMedia(msg, {
    progressCallback: (downloaded: any, total: any) => {
      if (total && total > 0) {
        const pct = Math.round((Number(downloaded) / Number(total)) * 100);
        onProgress?.(pct);
      }
    },
  })) as Buffer;

  const blob = new Blob([new Uint8Array(buffer)]);
  return blob;
}

/**
 * Triggers direct browser download of a file.
 */
export async function triggerFileDownload(
  channelId: string,
  messageId: number,
  fileName: string,
  onProgress?: (percentage: number) => void
): Promise<void> {
  const blob = await downloadFileFromChannel(channelId, messageId, fileName, onProgress);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const thumbnailCache = new Map<string, string>();

/**
 * Downloads or retrieves cached thumbnail for a file message.
 */
export async function getOrFetchThumbnail(
  channelId: string,
  messageId: number,
  mimeType?: string
): Promise<string | null> {
  const cacheKey = `${channelId}_${messageId}`;
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  try {
    const client = getClient();
    const peer = await client.getEntity(channelId);
    const messages = await client.getMessages(peer, { ids: [messageId] });
    const msg = messages[0];
    if (!msg || !msg.media) return null;

    // First try downloading small thumbnail from Telegram
    let buffer = (await client.downloadMedia(msg, { thumb: 1 })) as Buffer | undefined;
    if (!buffer || buffer.length === 0) {
      buffer = (await client.downloadMedia(msg, { thumb: 0 })) as Buffer | undefined;
    }

    // If no thumb found and it's an image, download the media directly
    if ((!buffer || buffer.length === 0) && mimeType?.startsWith("image/")) {
      buffer = (await client.downloadMedia(msg)) as Buffer | undefined;
    }

    if (buffer && buffer.length > 0) {
      const blob = new Blob([new Uint8Array(buffer)]);
      const url = URL.createObjectURL(blob);
      thumbnailCache.set(cacheKey, url);
      return url;
    }
  } catch (err) {
    console.warn(`[thumbnail] Failed to fetch thumbnail for ${messageId}:`, err);
  }

  return null;
}
