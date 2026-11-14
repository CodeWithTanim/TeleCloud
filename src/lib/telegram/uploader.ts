import { CustomFile } from "telegram/client/uploads";
import { getClient } from "./client";
import { DriveFile } from "../../types";

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

async function generateThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 200;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        } else {
          resolve(undefined);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      img.src = url;
    } catch {
      resolve(undefined);
    }
  });
}

export async function uploadFileToChannel(
  channelId: string,
  file: File,
  folderId: string | null = null,
  onProgress?: (progress: UploadProgress) => void
): Promise<DriveFile> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  // Generate thumbnail in background while preparing file buffer
  const [arrayBuffer, thumbnail] = await Promise.all([
    file.arrayBuffer(),
    generateThumbnail(file),
  ]);

  const buffer = Buffer.from(arrayBuffer);
  const customFile = new CustomFile(file.name, file.size, "", buffer);

  const sentMessage = (await client.sendFile(peer, {
    file: customFile,
    forceDocument: true,
    caption: `📁 TeleCloud File: ${file.name}`,
    progressCallback: (percentage: number) => {
      const pct = Math.round(percentage * 100);
      onProgress?.({
        bytesUploaded: Math.round(file.size * percentage),
        totalBytes: file.size,
        percentage: Math.min(100, Math.max(0, pct)),
      });
    },
  })) as any;

  const now = Date.now();
  const driveFile: DriveFile = {
    id: `file_${sentMessage.id}_${now}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    uploadedAt: now,
    updatedAt: now,
    channelId,
    messageId: sentMessage.id,
    folderId,
    isStarred: false,
    isDeleted: false,
    thumbnail,
  };

  return driveFile;
}
