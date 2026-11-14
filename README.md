# TeleCloud 🛡️☁️

**TeleCloud** is a secure, user-configured, zero-knowledge personal cloud storage web application powered directly by Telegram's MTProto. It transforms any private Telegram channel of your choice into an unlimited personal cloud drive.

---

## 🔒 Security & Privacy First

Unlike third-party alternatives that embed untrusted developer credentials, tracking telemetry, or hardcoded API keys:
1. **Your Own Developer Credentials**: You configure your own `API_ID` and `API_HASH` directly from [my.telegram.org](https://my.telegram.org). No unknown middleman or developer keys are ever bundled.
2. **Zero Server / Zero Middleman**: 100% runs in your browser. All transfers connect directly from your browser to official Telegram data centers via secure WebSockets (`wss://`). No middleman server ever sees your tokens, session strings, or files.
3. **Local Encryption**: All session keys and configuration are stored locally in your browser storage.

---

## 🚀 Key Features

- **Manual Channel Configuration (You're In Control)**:
  - TeleCloud never creates a channel behind your back.
  - Choose from a list of your existing Telegram channels.
  - Or manually specify any channel ID (e.g. `-100...`) or `@username`.
  - Or explicitly click to create a fresh channel with a custom name of your choice.
- **Drive Experience**:
  - Folder hierarchy, nested directories, breadcrumb navigation.
  - Grid view & List view.
  - Drag-and-drop file upload.
  - Star / Favorite files and folders.
  - Trash & restore capability.
  - In-browser file preview for images, video, audio, text, and code.
- **Large File Transfers**:
  - Direct chunked uploading and downloading.
  - Up to 2GB per file for standard Telegram accounts (4GB for Telegram Premium).
  - Floating real-time transfer manager with speed and percentage progress.
- **Cross-Device Cloud Index**:
  - Drive metadata is compressed with Gzip (`fflate`) and pinned directly in your designated channel.
  - Seamlessly reloads your full folder structure on any browser or device.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand
- **Telegram MTProto Client**: GramJS (`telegram`) with browser WebSocket polyfills
- **Compression**: `fflate` for lightweight index chunking

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## ⚙️ Configuration

You can either:
- Enter your `API_ID` and `API_HASH` directly in the UI when launching the app for the first time.
- Or copy `.env.example` to `.env` and fill in:
  ```env
  VITE_TELEGRAM_API_ID=your_api_id
  VITE_TELEGRAM_API_HASH=your_api_hash
  ```
