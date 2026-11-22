# TeleCloud: Agent & Developer Guide

Read this document before making architectural changes or implementing features in TeleCloud.

---

## 1. Project Overview & Philosophy

**TeleCloud** is a secure, user-configured, zero-knowledge personal cloud storage application (packaged both as a modern web app and a Windows desktop app via Electron). It transforms private Telegram channels into unlimited personal cloud drives using direct MTProto WebSockets.

### Core Tenets:
1. **Zero Server / Zero Middleman**: All MTProto transfers connect directly from the user's client (browser/Electron) to official Telegram data centers via secure WebSockets (`wss://`). No intermediary proxy, tracking, or storage server is ever used.
2. **Bring Your Own Keys (BYOK)**: Users provide their own `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org). No developer secrets or shared keys are bundled in the repository.
3. **Local Encryption & Privacy**: Session keys and credentials are encrypted and stored locally via client-side storage (`vault.ts`).
4. **Cross-Device Metadata Sync**: Drive file and folder hierarchies are serialized, compressed using Gzip (`fflate`), and pinned as an index message directly inside the user's storage channel.

---

## 2. Tech Stack

- **Framework**: React 19, TypeScript, Vite 6
- **Styling**: Tailwind CSS v4, Lucide Icons
- **State Management**: Zustand
- **Telegram MTProto Client**: GramJS (`telegram` v2.26.x) with browser WebSocket polyfills and custom patches (`scripts/patch-telegram.cjs`)
- **Desktop Packaging**: Electron 45, `electron-builder` with NSIS Windows installer
- **Compression**: `fflate` for index chunking & ZIP archive generation

---

## 3. Repository Architecture

```
TeleCloud/
├── electron/
│   ├── main.cjs               # Electron window lifecycle, tray, single instance, protocol handlers
│   └── preload.cjs            # Context bridge & secure IPC
├── build/                     # App icons (icon.ico, icon.png), installer scripts (installer.nsh), terms
├── src/
│   ├── components/
│   │   ├── auth/              # ApiKeySetup, ChannelSetup, TelegramLogin (QR & phone code)
│   │   ├── common/            # Modal, MoveModal, RenameModal, ConfirmModal, Buttons, Logos
│   │   ├── drive/             # FileCard, FileGrid, FileList, FilePreviewModal, FileUploadModal,
│   │   │                      # NewFolderModal, PinFolderModal, TransferQueue
│   │   └── layout/            # Header, Sidebar
│   ├── lib/
│   │   ├── storage/vault.ts   # Local credential encryption & storage
│   │   ├── telegram/
│   │   │   ├── auth.ts        # Telegram phone SMS / QR code authentication logic
│   │   │   ├── client.ts      # MTProto client creation & connection management
│   │   │   ├── channelManager.ts # Channel discovery, creation, and selection
│   │   │   ├── uploader.ts    # Resumable chunked file uploading (supports standard 2GB & Premium 4GB)
│   │   │   ├── downloader.ts  # Chunked file streaming, in-browser preview & ZIP folder download
│   │   │   └── indexStore.ts  # Index compression, pinned channel message sync
│   │   └── utils/
│   │       └── formatters.ts  # Byte sizes, relative dates, file category mimes
│   ├── pages/
│   │   ├── DrivePage.tsx      # Main explorer, breadcrumb navigation, drag & drop, context menus
│   │   └── SettingsPage.tsx   # Telegram account switcher, channel config, storage stats
│   ├── stores/
│   │   ├── authStore.ts       # Auth credentials, active channel, session states
│   │   ├── fileStore.ts       # Virtual file & folder tree, search, filters, trash, moveItem
│   │   └── transferStore.ts   # Upload & download queues, live speeds, progress tracking
│   └── types/index.ts         # Central TypeScript interfaces & domain types
```

---

## 4. Key Workflows & Rules

### File & Folder Operations:
- **Virtual Hierarchy**: Folders and file relationships (`folderId`, `parentId`) are virtualized in `fileStore.ts`.
- **Drag & Drop Move**: Users can drag files and folders onto other folders to reparent them (`moveItem`).
- **Right-Click Move**: Files/folders can also be moved using the right-click "Move" option, which opens `MoveModal` showing the hierarchical directory tree.
- **Cycle Prevention**: A folder cannot be moved into itself or into any of its own descendants.
- **Breadcrumbs**: Full breadcrumb trail (`Home > Folder > SubFolder`) enables quick upward navigation.

### Sensitive Data & Git Hygiene:
- **Never commit `.env` or `.env.production`**: Always use `.env.example` as a template.
- **Never commit build artifacts or installers**: `dist/`, `release/`, and `node_modules/` must remain in `.gitignore`.
- **Never log Telegram session strings or API credentials**: Handle auth tokens exclusively via encrypted local storage (`vault.ts`).

---

## 5. Development & Build Commands

Always run commands inside the `TeleCloud/` directory:

```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Compile TypeScript & build web production bundle
npm run build

# Start Electron in development mode
npm run electron:dev

# Build Windows NSIS production installer (.exe)
npm run electron:build
```
