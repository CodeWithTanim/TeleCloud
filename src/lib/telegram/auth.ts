import { Api } from "telegram";
import { getClient, disconnectClient } from "./client";
import { TelegramUser } from "../../types";
import { Vault } from "../storage/vault";

export interface SendCodeResult {
  phoneCodeHash: string;
  isCodeViaApp: boolean;
  timeout?: number;
}

/**
 * Sends a login code to the user's phone via Telegram app or SMS.
 */
export async function sendLoginCode(
  apiId: number,
  apiHash: string,
  phoneNumber: string
): Promise<SendCodeResult> {
  const client = getClient();
  const res = (await client.sendCode(
    { apiId, apiHash },
    phoneNumber.trim()
  )) as any;

  return {
    phoneCodeHash: res.phoneCodeHash,
    isCodeViaApp: res.isCodeViaApp ?? true,
    timeout: res.timeout,
  };
}

/**
 * Completes login using phone number, code, and phoneCodeHash.
 */
export async function submitLoginCode(
  phoneNumber: string,
  phoneCodeHash: string,
  code: string
): Promise<TelegramUser> {
  const client = getClient();

  const user = (await client.invoke(
    new Api.auth.SignIn({
      phoneNumber: phoneNumber.trim(),
      phoneCodeHash,
      phoneCode: code.trim(),
    })
  )) as any;

  // Persist session string
  const sessionString = client.session.save() as unknown as string;
  Vault.saveSession(sessionString);
  Vault.savePhone(phoneNumber);

  const me = (user.user || (await client.getMe())) as any;
  const userData: TelegramUser = {
    id: String(me.id),
    firstName: me.firstName || "Telegram User",
    lastName: me.lastName,
    username: me.username,
    phone: me.phone || phoneNumber,
  };

  Vault.saveUserData(userData);
  return userData;
}

/**
 * Handles 2FA (Two-Factor Authentication / Cloud Password) when required.
 */
export async function submit2FAPassword(password: string): Promise<TelegramUser> {
  const client = getClient();
  const { apiId, apiHash } = Vault.getApiCredentials();
  if (!apiId || !apiHash) {
    throw new Error("Missing API credentials for 2FA verification.");
  }

  await client.signInWithPassword(
    { apiId, apiHash },
    {
      password: async () => password,
      onError: (err) => {
        console.warn("[auth] 2FA error:", err);
      },
    }
  );

  const sessionString = client.session.save() as unknown as string;
  Vault.saveSession(sessionString);

  const me = (await client.getMe()) as any;
  const userData: TelegramUser = {
    id: String(me.id),
    firstName: me.firstName || "Telegram User",
    lastName: me.lastName,
    username: me.username,
    phone: me.phone,
  };

  Vault.saveUserData(userData);
  return userData;
}

/**
 * QR Code Login flow.
 */
export async function startQrLogin(
  onQrUrl: (url: string) => void
): Promise<TelegramUser> {
  const client = getClient();

  const user = await client.signInUserWithQrCode(
    {
      apiId: Vault.getApiCredentials().apiId!,
      apiHash: Vault.getApiCredentials().apiHash!,
    },
    {
      qrCode: async (code) => {
        const url = `tg://login?token=${code.token.toString("base64url")}`;
        onQrUrl(url);
      },
      onError: (err) => {
        console.warn("[auth] QR login error:", err);
      },
    }
  ) as any;

  const sessionString = client.session.save() as unknown as string;
  Vault.saveSession(sessionString);

  const me = (user || (await client.getMe())) as any;
  const userData: TelegramUser = {
    id: String(me.id),
    firstName: me.firstName || "Telegram User",
    lastName: me.lastName,
    username: me.username,
    phone: me.phone,
  };

  Vault.saveUserData(userData);
  return userData;
}

/**
 * Check if the stored session is valid and active.
 */
export async function checkCurrentSession(): Promise<TelegramUser | null> {
  try {
    const client = getClient();
    const isAuth = await client.checkAuthorization();
    if (!isAuth) return null;

    const me = (await client.getMe()) as any;
    if (!me) return null;

    const userData: TelegramUser = {
      id: String(me.id),
      firstName: me.firstName || "Telegram User",
      lastName: me.lastName,
      username: me.username,
      phone: me.phone,
    };
    Vault.saveUserData(userData);
    return userData;
  } catch (err) {
    console.warn("[auth] Check session failed:", err);
    return null;
  }
}

/**
 * Logs out and cleans up session.
 */
export async function logout(): Promise<void> {
  await disconnectClient();
  Vault.clearSession();
  Vault.clearActiveChannel();
}
