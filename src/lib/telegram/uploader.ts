import { CustomFile } from "telegram/client/uploads";
import { getClient } from "./client";
import { DriveFile } from "../../types";

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export async function uploadFileToChannel(
  channelId: string,
  file: File,
  folderId: string | null = null,
  onProgress?: (progress: UploadProgress) => void
): Promise<DriveFile> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  // Convert browser File to Buffer for GramJS CustomFile
  const arrayBuffer = await file.arrayBuffer();
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
  };

  return driveFile;
}
