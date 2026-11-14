import { create } from "zustand";
import { DriveFile, DriveFolder, ViewMode } from "../types";
import {
  loadDriveIndex,
  saveDriveIndex,
  deleteTelegramMessages,
  updateTelegramFileMessageCaption,
} from "../lib/telegram/indexStore";

interface FileState {
  files: DriveFile[];
  folders: DriveFolder[];
  currentFolderId: string | null;
  searchQuery: string;
  viewMode: ViewMode;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  setCurrentFolderId: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;

  loadIndex: (channelId: string) => Promise<void>;
  createFolder: (channelId: string, name: string, isPinned?: boolean) => Promise<DriveFolder>;
  togglePinFolder: (channelId: string, folderId: string) => Promise<void>;
  addFile: (channelId: string, file: DriveFile) => Promise<void>;
  renameItem: (channelId: string, id: string, newName: string, isFolder: boolean) => Promise<void>;
  toggleStar: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  moveToTrash: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  restoreFromTrash: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  deletePermanently: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  deleteMultiplePermanently: (channelId: string, ids: string[]) => Promise<void>;
  emptyTrash: (channelId: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  folders: [],
  currentFolderId: null,
  searchQuery: "",
  viewMode: "grid",
  isLoading: false,
  isSaving: false,
  error: null,

  setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),

  loadIndex: async (channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loadDriveIndex(channelId);
      set({
        files: data.files || [],
        folders: data.folders || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to load drive files from channel.",
        isLoading: false,
      });
    }
  },

  createFolder: async (channelId: string, name: string, isPinned = false) => {
    const { folders, files, currentFolderId } = get();
    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      parentId: currentFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isStarred: false,
      isDeleted: false,
      isPinned: Boolean(isPinned),
    };

    const nextFolders = [...folders, newFolder];
    set({ folders: nextFolders, isSaving: true });

    try {
      await saveDriveIndex(channelId, files, nextFolders);
    } catch (err: any) {
      console.warn("[fileStore] Folder save error:", err);
    } finally {
      set({ isSaving: false });
    }

    return newFolder;
  },

  togglePinFolder: async (channelId: string, folderId: string) => {
    const { folders, files } = get();
    const nextFolders = folders.map((f) =>
      f.id === folderId ? { ...f, isPinned: !f.isPinned, updatedAt: Date.now() } : f
    );
    set({ folders: nextFolders });

    if (channelId) {
      set({ isSaving: true });
      try {
        await saveDriveIndex(channelId, files, nextFolders);
      } catch (err: any) {
        console.warn("[fileStore] togglePinFolder save error:", err);
      } finally {
        set({ isSaving: false });
      }
    }
  },

  addFile: async (channelId: string, file: DriveFile) => {
    const { files, folders } = get();
    const nextFiles = [file, ...files];
    set({ files: nextFiles, isSaving: true });

    try {
      await saveDriveIndex(channelId, nextFiles, folders);
    } catch (err: any) {
      console.warn("[fileStore] Add file save error:", err);
    } finally {
      set({ isSaving: false });
    }
  },

  renameItem: async (channelId: string, id: string, newName: string, isFolder: boolean) => {
    const { files, folders } = get();
    let nextFiles = [...files];
    let nextFolders = [...folders];

    const targetFile = !isFolder ? files.find((f) => f.id === id) : null;

    if (isFolder) {
      nextFolders = nextFolders.map((f) =>
        f.id === id ? { ...f, name: newName.trim(), updatedAt: Date.now() } : f
      );
    } else {
      nextFiles = nextFiles.map((f) =>
        f.id === id ? { ...f, name: newName.trim(), updatedAt: Date.now() } : f
      );
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      await saveDriveIndex(channelId, nextFiles, nextFolders);

      // If it's a file, update the Telegram message caption immediately on the channel!
      if (targetFile && targetFile.messageId) {
        await updateTelegramFileMessageCaption(
          channelId,
          targetFile.messageId,
          newName.trim(),
          targetFile.chunkMsgIds
        );
      }
    } finally {
      set({ isSaving: false });
    }
  },

  toggleStar: async (channelId: string, id: string, isFolder: boolean) => {
    const { files, folders } = get();
    let nextFiles = [...files];
    let nextFolders = [...folders];

    if (isFolder) {
      nextFolders = nextFolders.map((f) =>
        f.id === id ? { ...f, isStarred: !f.isStarred } : f
      );
    } else {
      nextFiles = nextFiles.map((f) =>
        f.id === id ? { ...f, isStarred: !f.isStarred } : f
      );
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },

  moveToTrash: async (channelId: string, id: string, isFolder: boolean) => {
    const { files, folders } = get();
    let nextFiles = [...files];
    let nextFolders = [...folders];

    if (isFolder) {
      nextFolders = nextFolders.map((f) =>
        f.id === id ? { ...f, isDeleted: true } : f
      );
    } else {
      nextFiles = nextFiles.map((f) =>
        f.id === id ? { ...f, isDeleted: true } : f
      );
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },

  restoreFromTrash: async (channelId: string, id: string, isFolder: boolean) => {
    const { files, folders } = get();
    let nextFiles = [...files];
    let nextFolders = [...folders];

    if (isFolder) {
      nextFolders = nextFolders.map((f) =>
        f.id === id ? { ...f, isDeleted: false } : f
      );
    } else {
      nextFiles = nextFiles.map((f) =>
        f.id === id ? { ...f, isDeleted: false } : f
      );
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },

  deletePermanently: async (channelId: string, id: string, isFolder: boolean) => {
    const { files, folders } = get();
    let nextFiles = files;
    let nextFolders = folders;
    const messagesToDelete: number[] = [];

    if (isFolder) {
      // Find all nested descendant folder IDs
      const descendantFolderIds = new Set<string>([id]);
      let added = true;
      while (added) {
        added = false;
        for (const f of folders) {
          if (f.parentId && descendantFolderIds.has(f.parentId) && !descendantFolderIds.has(f.id)) {
            descendantFolderIds.add(f.id);
            added = true;
          }
        }
      }

      // Collect all Telegram message IDs for files in this folder & its subfolders
      for (const f of files) {
        if (f.folderId && descendantFolderIds.has(f.folderId)) {
          if (f.messageId) messagesToDelete.push(f.messageId);
          if (f.chunkMsgIds) messagesToDelete.push(...f.chunkMsgIds);
        }
      }

      nextFolders = folders.filter((f) => !descendantFolderIds.has(f.id));
      nextFiles = files.filter((f) => !f.folderId || !descendantFolderIds.has(f.folderId));
    } else {
      const targetFile = files.find((f) => f.id === id);
      if (targetFile) {
        if (targetFile.messageId) messagesToDelete.push(targetFile.messageId);
        if (targetFile.chunkMsgIds) messagesToDelete.push(...targetFile.chunkMsgIds);
      }
      nextFiles = files.filter((f) => f.id !== id);
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      // 1. Delete the file message(s) from Telegram storage channel
      if (messagesToDelete.length > 0) {
        await deleteTelegramMessages(channelId, messagesToDelete);
      }
      // 2. Persist updated index
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },

  deleteMultiplePermanently: async (channelId: string, ids: string[]) => {
    const { files, folders } = get();
    const idSet = new Set(ids);
    const messagesToDelete: number[] = [];

    // Find all selected folders and their descendant subfolders
    const descendantFolderIds = new Set<string>();
    for (const id of ids) {
      if (folders.some((f) => f.id === id)) {
        descendantFolderIds.add(id);
      }
    }

    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && descendantFolderIds.has(f.parentId) && !descendantFolderIds.has(f.id)) {
          descendantFolderIds.add(f.id);
          added = true;
        }
      }
    }

    // Collect message IDs for all selected files or files inside selected folders
    for (const f of files) {
      if (idSet.has(f.id) || (f.folderId && descendantFolderIds.has(f.folderId))) {
        if (f.messageId) messagesToDelete.push(f.messageId);
        if (f.chunkMsgIds) messagesToDelete.push(...f.chunkMsgIds);
      }
    }

    const nextFolders = folders.filter(
      (f) => !idSet.has(f.id) && !descendantFolderIds.has(f.id)
    );
    const nextFiles = files.filter(
      (f) => !idSet.has(f.id) && (!f.folderId || !descendantFolderIds.has(f.folderId))
    );

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      if (messagesToDelete.length > 0) {
        await deleteTelegramMessages(channelId, messagesToDelete);
      }
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },

  emptyTrash: async (channelId: string) => {
    const { files, folders } = get();
    const trashedFiles = files.filter((f) => f.isDeleted);
    const messagesToDelete: number[] = [];

    for (const f of trashedFiles) {
      if (f.messageId) messagesToDelete.push(f.messageId);
      if (f.chunkMsgIds) messagesToDelete.push(...f.chunkMsgIds);
    }

    const nextFiles = files.filter((f) => !f.isDeleted);
    const nextFolders = folders.filter((f) => !f.isDeleted);

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      if (messagesToDelete.length > 0) {
        await deleteTelegramMessages(channelId, messagesToDelete);
      }
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },
}));
