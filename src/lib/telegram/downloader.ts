import { zipSync } from "fflate";
import { getClient } from "./client";
import { DriveFile, DriveFolder } from "../../types";

export interface FolderZipEntry {
  path: string;
  file: DriveFile;
}

export function collectFolderZipEntries(
  folderId: string,
  allFolders: DriveFolder[],
  allFiles: DriveFile[],
  basePath: string = ""
): FolderZipEntry[] {
  const entries: FolderZipEntry[] = [];

  // 1. Files in this folder
  const currentFiles = allFiles.filter(
    (f) => !f.isDeleted && f.folderId === folderId
  );
  for (const f of currentFiles) {
    entries.push({
      path: basePath ? `${basePath}/${f.name}` : f.name,
      file: f,
    });
  }

  // 2. Subfolders in this folder
  const subfolders = allFolders.filter(
    (sf) => !sf.isDeleted && sf.parentId === folderId
  );
  for (const sf of subfolders) {
    const nextPath = basePath ? `${basePath}/${sf.name}` : sf.name;
    entries.push(...collectFolderZipEntries(sf.id, allFolders, allFiles, nextPath));
  }

  return entries;
}

/**
 * Downloads all files inside a folder (and its nested subfolders) from Telegram,
 * zips them using fflate, and triggers direct browser download of `<folder_name>.zip`.
 */
export async function downloadFolderAsZip(
  channelId: string,
  folder: DriveFolder,
  allFolders: DriveFolder[],
  allFiles: DriveFile[],
  onProgress?: (percentage: number, statusText?: string) => void
): Promise<void> {
  const entries = collectFolderZipEntries(folder.id, allFolders, allFiles);
  const zipData: Record<string, Uint8Array> = {};

  if (entries.length === 0) {
    // Empty folder: create an empty zip with a small placeholder so it is a valid zip archive
    zipData[".empty"] = new Uint8Array();
  } else {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const startPct = Math.round((i / entries.length) * 85);
      onProgress?.(startPct, `Downloading ${entry.file.name}...`);

      const blob = await downloadFileFromChannel(
        channelId,
        entry.file.messageId,
        entry.file.name,
        (filePct) => {
          const overall = startPct + Math.round((filePct / 100) * (85 / entries.length));
          onProgress?.(Math.min(85, overall), `Downloading ${entry.file.name}...`);
        }
      );

      const arrayBuf = await blob.arrayBuffer();
      let targetPath = entry.path;
      let counter = 1;
      while (zipData[targetPath]) {
        const dotIndex = entry.path.lastIndexOf(".");
        if (dotIndex !== -1) {
          targetPath = `${entry.path.substring(0, dotIndex)} (${counter})${entry.path.substring(dotIndex)}`;
        } else {
          targetPath = `${entry.path} (${counter})`;
        }
        counter++;
      }
      zipData[targetPath] = new Uint8Array(arrayBuf);
    }
  }

  onProgress?.(90, "Compressing ZIP archive...");
  const zipped = zipSync(zipData, { level: 6 });
  const zipBlob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(zipBlob);

  const safeName = (folder.name || "archive").replace(/[/\\?%*:|"<>]/g, "_");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  onProgress?.(100, "Done");
}

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
