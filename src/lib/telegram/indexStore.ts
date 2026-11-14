import { Api } from "telegram";
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
import { getClient } from "./client";
import { DriveFile, DriveFolder } from "../../types";

const INDEX_PREFIX = "TELECLOUD_INDEX_V1:";
const LEGACY_VAULT_PREFIX = "TELEVAULT_INDEX_V1:";
const LEGACY_TELEDRIVE_PREFIX = "teledrive_index gz:";

export interface DriveIndexData {
  version: 1;
  updatedAt: number;
  files: DriveFile[];
  folders: DriveFolder[];
}

function compressIndex(data: DriveIndexData): string {
  const jsonStr = JSON.stringify(data);
  const u8 = strToU8(jsonStr);
  const compressed = gzipSync(u8);
  let binary = "";
  const len = compressed.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return INDEX_PREFIX + btoa(binary);
}

function decompressIndex(rawText: string): DriveIndexData | null {
  let prefix = "";
  if (rawText.startsWith(INDEX_PREFIX)) {
    prefix = INDEX_PREFIX;
  } else if (rawText.startsWith(LEGACY_VAULT_PREFIX)) {
    prefix = LEGACY_VAULT_PREFIX;
  } else {
    return null;
  }

  try {
    const base64 = rawText.slice(prefix.length);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = gunzipSync(bytes);
    const jsonStr = strFromU8(decompressed);
    return JSON.parse(jsonStr) as DriveIndexData;
  } catch (err) {
    console.warn("[indexStore] Failed to decompress index text:", err);
    return null;
  }
}

/**
 * Parses indexes created by the original TeleDrive application.
 */
function parseLegacyTeleDriveIndex(
  text: string,
  channelId: string
): { files: DriveFile[]; folders: DriveFolder[] } | null {
  if (!text.includes(LEGACY_TELEDRIVE_PREFIX)) return null;
  try {
    const rawB64 = text.slice(text.indexOf(LEGACY_TELEDRIVE_PREFIX) + LEGACY_TELEDRIVE_PREFIX.length).trim();
    const binary = atob(rawB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decompressed = gunzipSync(bytes);
    const data = JSON.parse(strFromU8(decompressed));

    if (data && Array.isArray(data.files)) {
      const files: DriveFile[] = [];
      const folderMap = new Map<string, DriveFolder>();

      for (const f of data.files) {
        if (!f.messageId || f.messageId === 0) {
          // Folder in legacy teledrive
          if (f.name && f.folderPath) {
            folderMap.set(f.folderPath, {
              id: f.id || `folder_${f.name}`,
              name: f.name,
              parentId: null,
              createdAt: f.uploadedAt || Date.now(),
              updatedAt: f.uploadedAt || Date.now(),
              isStarred: Boolean(f.starred),
              isDeleted: Boolean(f.trashed),
            });
          }
        } else {
          // File in legacy teledrive
          files.push({
            id: f.id || `file_${f.messageId}`,
            name: f.name || `File_${f.messageId}`,
            size: f.size || 0,
            mimeType: f.mime || "application/octet-stream",
            uploadedAt: f.uploadedAt || Date.now(),
            updatedAt: f.uploadedAt || Date.now(),
            channelId,
            messageId: f.messageId,
            folderId: null,
            isStarred: Boolean(f.starred),
            isDeleted: Boolean(f.trashed),
          });
        }
      }

      return { files, folders: Array.from(folderMap.values()) };
    }
  } catch (err) {
    console.warn("[indexStore] Error parsing legacy teledrive index:", err);
  }
  return null;
}

/**
 * Scans the channel's message history to recover ANY documents or media
 * that exist in the Telegram channel but are not yet tracked in the index.
 */
async function scanChannelForExistingMedia(
  client: any,
  peer: any,
  channelId: string,
  existingFiles: DriveFile[]
): Promise<DriveFile[]> {
  const existingMsgIds = new Set(existingFiles.map((f) => f.messageId));
  const discoveredFiles: DriveFile[] = [];

  try {
    // Scan recent 200 messages in the channel for media documents
    const messages = await client.getMessages(peer, { limit: 200 });

    for (const msg of messages) {
      if (!msg || !msg.id || existingMsgIds.has(msg.id)) continue;

      const media = msg.media;
      if (!media) continue;

      // Ignore index messages
      const text = String(msg.message || "");
      if (
        text.startsWith("TELECLOUD_INDEX") ||
        text.startsWith("TELEVAULT_INDEX") ||
        text.startsWith("teledrive_index")
      ) {
        continue;
      }

      // 1. Telegram Document
      if (media.document) {
        const doc = media.document;
        let fileName = "";

        if (Array.isArray(doc.attributes)) {
          const fnAttr = doc.attributes.find(
            (a: any) =>
              a?.className === "DocumentAttributeFilename" ||
              a?._ === "documentAttributeFilename"
          );
          if (fnAttr && typeof fnAttr.fileName === "string") {
            fileName = fnAttr.fileName.trim();
          }
        }

        if (!fileName) {
          const caption = text.trim();
          if (caption.startsWith("📁 TeleCloud File: ")) {
            fileName = caption.slice("📁 TeleCloud File: ".length).trim();
          } else if (caption.startsWith("teledrive_file:")) {
            try {
              const meta = JSON.parse(caption.slice("teledrive_file:".length));
              if (meta?.name) fileName = meta.name;
            } catch {}
          } else if (caption) {
            fileName = caption;
          }
        }

        if (!fileName) {
          fileName = `Document_${msg.id}`;
        }

        const size = Number(doc.size) || 0;
        const mimeType = doc.mimeType || "application/octet-stream";
        const uploadedAt = (Number(msg.date) || 0) * 1000;

        discoveredFiles.push({
          id: `discovered_${msg.id}`,
          name: fileName,
          size,
          mimeType,
          uploadedAt,
          updatedAt: uploadedAt,
          channelId,
          messageId: msg.id,
          folderId: null,
          isStarred: false,
          isDeleted: false,
        });
      }
      // 2. Telegram Photo
      else if (media.photo) {
        let fileName = text.trim();
        if (fileName.startsWith("📁 TeleCloud File: ")) {
          fileName = fileName.slice("📁 TeleCloud File: ".length).trim();
        }
        if (!fileName) {
          fileName = `Photo_${msg.id}.jpg`;
        }

        const uploadedAt = (Number(msg.date) || 0) * 1000;

        discoveredFiles.push({
          id: `discovered_photo_${msg.id}`,
          name: fileName,
          size: 1024 * 500, // Fallback photo size
          mimeType: "image/jpeg",
          uploadedAt,
          updatedAt: uploadedAt,
          channelId,
          messageId: msg.id,
          folderId: null,
          isStarred: false,
          isDeleted: false,
        });
      }
    }
  } catch (err) {
    console.warn("[indexStore] Channel scan error:", err);
  }

  return discoveredFiles;
}

/**
 * Loads the Drive index from pinned messages or recent messages,
 * supports legacy indexes, and scans the channel for any unindexed files.
 */
export async function loadDriveIndex(channelId: string): Promise<DriveIndexData> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  let loadedFiles: DriveFile[] = [];
  let loadedFolders: DriveFolder[] = [];

  try {
    // 1. Check pinned messages first
    const pinnedMessages = await client.getMessages(peer, {
      filter: new Api.InputMessagesFilterPinned(),
      limit: 15,
    });

    for (const msg of pinnedMessages) {
      const text = msg.message || "";
      if (text.startsWith(INDEX_PREFIX) || text.startsWith(LEGACY_VAULT_PREFIX)) {
        const parsed = decompressIndex(text);
        if (parsed && Array.isArray(parsed.files)) {
          loadedFiles = parsed.files;
          loadedFolders = parsed.folders || [];
          break;
        }
      } else if (text.includes(LEGACY_TELEDRIVE_PREFIX)) {
        const parsed = parseLegacyTeleDriveIndex(text, channelId);
        if (parsed && parsed.files.length > 0) {
          loadedFiles = parsed.files;
          loadedFolders = parsed.folders;
          break;
        }
      }
    }

    // 2. If no pinned index, check latest 30 messages
    if (loadedFiles.length === 0) {
      const recentMessages = await client.getMessages(peer, { limit: 30 });
      for (const msg of recentMessages) {
        const text = msg.message || "";
        if (text.startsWith(INDEX_PREFIX) || text.startsWith(LEGACY_VAULT_PREFIX)) {
          const parsed = decompressIndex(text);
          if (parsed && Array.isArray(parsed.files)) {
            loadedFiles = parsed.files;
            loadedFolders = parsed.folders || [];
            break;
          }
        } else if (text.includes(LEGACY_TELEDRIVE_PREFIX)) {
          const parsed = parseLegacyTeleDriveIndex(text, channelId);
          if (parsed && parsed.files.length > 0) {
            loadedFiles = parsed.files;
            loadedFolders = parsed.folders;
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[indexStore] Error finding existing index message:", err);
  }

  // 3. CHANNEL SCAN: Check channel for any uploaded files/documents that are not yet in the index
  const discovered = await scanChannelForExistingMedia(client, peer, channelId, loadedFiles);
  if (discovered.length > 0) {
    console.info(`[indexStore] Discovered ${discovered.length} additional files from Telegram channel history!`);
    loadedFiles = [...loadedFiles, ...discovered];

    // Deduplicate by messageId
    const uniqueMap = new Map<number, DriveFile>();
    for (const f of loadedFiles) {
      if (!uniqueMap.has(f.messageId)) {
        uniqueMap.set(f.messageId, f);
      }
    }
    loadedFiles = Array.from(uniqueMap.values());

    // Persist the combined index back to Telegram asynchronously so future loads are instant
    saveDriveIndex(channelId, loadedFiles, loadedFolders).catch((e) => {
      console.warn("[indexStore] Deferred save of discovered files failed:", e);
    });
  }

  return {
    version: 1,
    updatedAt: Date.now(),
    files: loadedFiles,
    folders: loadedFolders,
  };
}

/**
 * Persists the updated Drive index as a pinned message in the channel.
 */
export async function saveDriveIndex(
  channelId: string,
  files: DriveFile[],
  folders: DriveFolder[]
): Promise<void> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  const payload: DriveIndexData = {
    version: 1,
    updatedAt: Date.now(),
    files,
    folders,
  };

  const textPayload = compressIndex(payload);

  try {
    // Send index message
    const sentMsg = await client.sendMessage(peer, {
      message: textPayload,
    });

    // Pin it so it is instantly retrievable on any device/refresh
    try {
      await client.pinMessage(peer, sentMsg.id, { notify: false });
    } catch (pinErr) {
      console.warn("[indexStore] Warning: Could not pin index message (may lack pin permissions):", pinErr);
    }
  } catch (err) {
    console.error("[indexStore] Failed to save drive index to channel:", err);
    throw err;
  }
}
