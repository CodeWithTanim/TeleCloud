import { Api, utils } from "telegram";
import { getClient } from "./client";
import { Vault } from "../storage/vault";
import { StorageChannelInfo } from "../../types";

export function canonicalChannelId(rawId: string | number | bigint): string {
  const str = String(rawId).trim();
  if (str.startsWith("-100")) return str;
  if (str.startsWith("-")) return str;
  return `-100${str}`;
}

/**
 * Fetches all channels / supergroups where the user is an owner or admin.
 * Gives the user full visibility to pick ANY of their channels for storage.
 */
export async function fetchUserChannels(): Promise<StorageChannelInfo[]> {
  const client = getClient();
  const channels: StorageChannelInfo[] = [];

  try {
    const dialogs = await client.getDialogs({ limit: 100 });

    for (const d of dialogs) {
      if (d.isChannel) {
        const entity = d.entity as any;
        if (!entity) continue;

        const isCreator = Boolean(entity.creator);
        const isAdmin = Boolean(entity.adminRights);

        // We only care about channels/groups the user can manage/post into
        if (isCreator || isAdmin) {
          const rawId = d.id ? String(d.id) : utils.getPeerId(entity);
          channels.push({
            id: canonicalChannelId(rawId),
            title: d.title || entity.title || "Untitled Channel",
            username: entity.username,
            isCreator,
            isAdmin,
            membersCount: entity.participantsCount,
          });
        }
      }
    }
  } catch (err) {
    console.error("[channelManager] Failed to fetch user dialogs:", err);
    throw err;
  }

  return channels;
}

/**
 * Validates that a user-provided channel ID or @username exists and can be accessed.
 */
export async function verifyChannel(channelInput: string): Promise<StorageChannelInfo> {
  const client = getClient();
  let input = channelInput.trim();

  // If numeric ID without prefix
  if (/^\d+$/.test(input)) {
    input = canonicalChannelId(input);
  }

  try {
    const entity = await client.getEntity(input) as any;
    if (!entity) {
      throw new Error("Channel entity not found.");
    }

    const isCreator = Boolean(entity.creator);
    const isAdmin = Boolean(entity.adminRights);
    const rawId = utils.getPeerId(entity);

    return {
      id: canonicalChannelId(rawId),
      title: entity.title || "Custom Channel",
      username: entity.username,
      isCreator,
      isAdmin,
      membersCount: entity.participantsCount,
    };
  } catch (err: any) {
    console.error("[channelManager] Verify channel error:", err);
    throw new Error(err.message || "Could not access or verify the specified channel.");
  }
}

/**
 * Creates a brand new private channel with a custom user-chosen title.
 * ONLY called when the user explicitly clicks 'Create Channel'.
 */
export async function createChannelExplicitly(
  title: string,
  about: string = "Personal Cloud Storage"
): Promise<StorageChannelInfo> {
  const client = getClient();
  if (!title.trim()) {
    throw new Error("Channel title cannot be empty.");
  }

  try {
    const result = await client.invoke(
      new Api.channels.CreateChannel({
        title: title.trim(),
        about: about.trim(),
        broadcast: true,
      })
    ) as any;

    const chats = result.chats || [];
    const channel = chats[0];
    if (!channel) {
      throw new Error("Failed to create channel: Telegram did not return channel data.");
    }

    const channelId = canonicalChannelId(utils.getPeerId(channel));
    return {
      id: channelId,
      title: channel.title,
      isCreator: true,
      isAdmin: true,
      membersCount: 1,
    };
  } catch (err: any) {
    console.error("[channelManager] Explicit channel creation failed:", err);
    throw err;
  }
}

/**
 * Configures and saves the active storage channel in local vault.
 */
export function setActiveStorageChannel(channel: StorageChannelInfo): void {
  Vault.saveActiveChannel(channel.id, channel.title);
}

/**
 * Retrieves the currently configured active channel.
 */
export function getActiveStorageChannel(): { id: string | null; title: string | null } {
  return Vault.getActiveChannel();
}
