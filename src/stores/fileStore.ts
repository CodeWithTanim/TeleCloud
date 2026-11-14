import { create } from "zustand";
import { DriveFile, DriveFolder, ViewMode } from "../types";
import { loadDriveIndex, saveDriveIndex } from "../lib/telegram/indexStore";

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
  createFolder: (channelId: string, name: string) => Promise<DriveFolder>;
  addFile: (channelId: string, file: DriveFile) => Promise<void>;
  renameItem: (channelId: string, id: string, newName: string, isFolder: boolean) => Promise<void>;
  toggleStar: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  moveToTrash: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  restoreFromTrash: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
  deletePermanently: (channelId: string, id: string, isFolder: boolean) => Promise<void>;
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

  createFolder: async (channelId: string, name: string) => {
    const { folders, files, currentFolderId } = get();
    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      parentId: currentFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isStarred: false,
      isDeleted: false,
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

    if (isFolder) {
      nextFolders = folders.filter((f) => f.id !== id);
    } else {
      nextFiles = files.filter((f) => f.id !== id);
    }

    set({ files: nextFiles, folders: nextFolders, isSaving: true });
    try {
      await saveDriveIndex(channelId, nextFiles, nextFolders);
    } finally {
      set({ isSaving: false });
    }
  },
}));
