import { create } from "zustand";
import { TelegramUser, StorageChannelInfo } from "../types";
import { Vault } from "../lib/storage/vault";
import { getOrInitClient } from "../lib/telegram/client";
import { checkCurrentSession } from "../lib/telegram/auth";

interface AuthState {
  apiId: number | null;
  apiHash: string | null;
  user: TelegramUser | null;
  activeChannel: { id: string | null; title: string | null };
  isConfigured: boolean; // Has API credentials
  isAuthenticated: boolean; // Logged into Telegram
  isChannelSelected: boolean; // Has selected a storage channel
  isLoading: boolean;
  error: string | null;

  setCredentials: (apiId: number, apiHash: string) => void;
  setUser: (user: TelegramUser | null) => void;
  setActiveChannel: (id: string, title: string) => void;
  clearActiveChannel: () => void;
  initialize: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  apiId: null,
  apiHash: null,
  user: null,
  activeChannel: { id: null, title: null },
  isConfigured: false,
  isAuthenticated: false,
  isChannelSelected: false,
  isLoading: true,
  error: null,

  setCredentials: (apiId, apiHash) => {
    Vault.saveApiCredentials(apiId, apiHash);
    set({
      apiId,
      apiHash,
      isConfigured: true,
    });
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: Boolean(user),
    });
  },

  setActiveChannel: (id, title) => {
    Vault.saveActiveChannel(id, title);
    set({
      activeChannel: { id, title },
      isChannelSelected: true,
    });
  },

  clearActiveChannel: () => {
    Vault.clearActiveChannel();
    set({
      activeChannel: { id: null, title: null },
      isChannelSelected: false,
    });
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiId, apiHash } = Vault.getApiCredentials();
      const session = Vault.getSession();
      const activeChan = Vault.getActiveChannel();

      if (!apiId || !apiHash) {
        set({
          isLoading: false,
          isConfigured: false,
          isAuthenticated: false,
          isChannelSelected: false,
        });
        return;
      }

      set({ apiId, apiHash, isConfigured: true });

      if (session) {
        try {
          await getOrInitClient(apiId, apiHash, session);
          const user = await checkCurrentSession();
          if (user) {
            set({
              user,
              isAuthenticated: true,
              activeChannel: activeChan,
              isChannelSelected: Boolean(activeChan.id),
              isLoading: false,
            });
            return;
          }
        } catch (err: any) {
          console.warn("[authStore] Session restoration failed:", err);
        }
      }

      set({
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to initialize auth state",
        isLoading: false,
      });
    }
  },

  logout: () => {
    Vault.clearAll();
    set({
      user: null,
      isAuthenticated: false,
      isChannelSelected: false,
      activeChannel: { id: null, title: null },
    });
  },
}));
