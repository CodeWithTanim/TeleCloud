export interface TelegramCredentials {
  apiId: number;
  apiHash: string;
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
  photoUrl?: string;
}

export interface StorageChannelInfo {
  id: string;
  title: string;
  username?: string;
  isCreator: boolean;
  isAdmin: boolean;
  membersCount?: number;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  isStarred?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: number;
  updatedAt: number;
  channelId: string;
  messageId: number;
  folderId: string | null; // null means root
  isStarred?: boolean;
  isDeleted?: boolean;
  chunkMsgIds?: number[]; // For files split into multiple Telegram messages
  thumbnail?: string; // Base64 data URL for instant image thumbnail preview
}

export interface TransferItem {
  id: string;
  name: string;
  size: number;
  transferred: number;
  progress: number; // 0 - 100
  type: 'upload' | 'download';
  status: 'pending' | 'active' | 'paused' | 'completed' | 'error';
  speed?: string;
  error?: string;
}

export type ViewMode = 'grid' | 'list';

export type ActiveTab =
  | 'home'
  | 'projects'
  | 'drive'
  | 'computers'
  | 'shared'
  | 'recent'
  | 'starred'
  | 'spam'
  | 'trash'
  | 'storage'
  | 'settings';
