import { Api } from "telegram";
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
import { getClient } from "./client";
import { DriveFile, DriveFolder } from "../../types";

const INDEX_PREFIX = "TELECLOUD_INDEX_V1:";

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
  if (!rawText.startsWith(INDEX_PREFIX)) return null;
  try {
    const base64 = rawText.slice(INDEX_PREFIX.length);
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
 * Loads the Drive index from pinned messages in the specified channel.
 */
export async function loadDriveIndex(channelId: string): Promise<DriveIndexData> {
  const client = getClient();
  const peer = await client.getEntity(channelId);

  try {
    // 1. Check pinned messages first
    const pinnedMessages = await client.getMessages(peer, {
      filter: new Api.InputMessagesFilterPinned(),
      limit: 10,
    });

    for (const msg of pinnedMessages) {
      if (msg.message && msg.message.startsWith(INDEX_PREFIX)) {
        const parsed = decompressIndex(msg.message);
        if (parsed) {
          return parsed;
        }
      }
    }

    // 2. If no pinned index, check latest 20 messages for recent index
    const recentMessages = await client.getMessages(peer, { limit: 20 });
    for (const msg of recentMessages) {
      if (msg.message && msg.message.startsWith(INDEX_PREFIX)) {
        const parsed = decompressIndex(msg.message);
        if (parsed) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("[indexStore] Error finding existing index message:", err);
  }

  // Fallback: return blank index for empty/new channel
  return {
    version: 1,
    updatedAt: Date.now(),
    files: [],
    folders: [],
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
