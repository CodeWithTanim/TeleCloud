/**
 * Secure client-side vault for storing Telegram credentials, sessions, and chosen channels.
 * Zero servers involved; everything stays in the user's browser.
 */

const STORAGE_KEYS = {
  API_ID: 'telecloud_api_id',
  API_HASH: 'telecloud_api_hash',
  SESSION: 'telecloud_session',
  PHONE: 'telecloud_phone',
  ACTIVE_CHANNEL_ID: 'telecloud_active_channel_id',
  ACTIVE_CHANNEL_TITLE: 'telecloud_active_channel_title',
  USER_DATA: 'telecloud_user_data',
};

export const Vault = {
  getApiCredentials(): { apiId: number | null; apiHash: string | null } {
    const envId = import.meta.env.VITE_TELEGRAM_API_ID;
    const envHash = import.meta.env.VITE_TELEGRAM_API_HASH;

    const storedId = localStorage.getItem(STORAGE_KEYS.API_ID);
    const storedHash = localStorage.getItem(STORAGE_KEYS.API_HASH);

    const apiId = storedId ? parseInt(storedId, 10) : (envId ? parseInt(envId, 10) : null);
    const apiHash = storedHash || envHash || null;

    return { apiId, apiHash };
  },

  saveApiCredentials(apiId: number, apiHash: string): void {
    localStorage.setItem(STORAGE_KEYS.API_ID, apiId.toString());
    localStorage.setItem(STORAGE_KEYS.API_HASH, apiHash.trim());
  },

  clearApiCredentials(): void {
    localStorage.removeItem(STORAGE_KEYS.API_ID);
    localStorage.removeItem(STORAGE_KEYS.API_HASH);
  },

  getSession(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SESSION);
  },

  saveSession(session: string): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, session);
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getPhone(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PHONE);
  },

  savePhone(phone: string): void {
    localStorage.setItem(STORAGE_KEYS.PHONE, phone);
  },

  getActiveChannel(): { id: string | null; title: string | null } {
    return {
      id: localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL_ID),
      title: localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL_TITLE),
    };
  },

  saveActiveChannel(channelId: string, title: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL_ID, channelId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL_TITLE, title);
  },

  clearActiveChannel(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHANNEL_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHANNEL_TITLE);
  },

  getUserData(): any {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveUserData(data: any): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.PHONE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHANNEL_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHANNEL_TITLE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },
};
