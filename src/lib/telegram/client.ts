import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

let clientInstance: TelegramClient | null = null;
let currentApiId: number | null = null;
let currentApiHash: string | null = null;

export async function getOrInitClient(
  apiId: number,
  apiHash: string,
  sessionString: string = ""
): Promise<TelegramClient> {
  if (
    clientInstance &&
    currentApiId === apiId &&
    currentApiHash === apiHash
  ) {
    if (!clientInstance.connected) {
      await clientInstance.connect();
    }
    return clientInstance;
  }

  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    clientInstance = null;
  }

  const session = new StringSession(sessionString);
  clientInstance = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: true,
    deviceModel: "TeleCloud Web",
    systemVersion: "1.0.0",
    appVersion: "1.0.0",
    langCode: "en",
    systemLangCode: "en",
  });

  clientInstance.setLogLevel("warn" as any);
  await clientInstance.connect();

  currentApiId = apiId;
  currentApiHash = apiHash;

  return clientInstance;
}

export function getClient(): TelegramClient {
  if (!clientInstance) {
    throw new Error("Telegram client is not initialized.");
  }
  return clientInstance;
}

export async function disconnectClient(): Promise<void> {
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch {
      // Ignore
    }
    clientInstance = null;
    currentApiId = null;
    currentApiHash = null;
  }
}
