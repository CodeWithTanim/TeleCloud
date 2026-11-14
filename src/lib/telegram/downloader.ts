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
