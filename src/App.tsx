import React, { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { useAuthStore } from "./stores/authStore";
import { useFileStore } from "./stores/fileStore";
import { ApiKeySetup } from "./components/auth/ApiKeySetup";
import { TelegramLogin } from "./components/auth/TelegramLogin";
import { ChannelSetup } from "./components/auth/ChannelSetup";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DrivePage } from "./pages/DrivePage";
import { SettingsPage } from "./pages/SettingsPage";
import { FileUploadModal } from "./components/drive/FileUploadModal";
import { NewFolderModal } from "./components/drive/NewFolderModal";
import { TransferQueue } from "./components/drive/TransferQueue";
import { ActiveTab } from "./types";

export const App: React.FC = () => {
  const { isConfigured, isAuthenticated, isChannelSelected, isLoading, activeChannel, initialize } =
    useAuthStore();
  const { loadIndex } = useFileStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("drive");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);

  // Initialize auth & session on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load drive index once channel is configured
  useEffect(() => {
    if (isAuthenticated && isChannelSelected && activeChannel.id) {
      loadIndex(activeChannel.id);
    }
  }, [isAuthenticated, isChannelSelected, activeChannel.id, loadIndex]);

  // 1. Loading splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Shield className="w-8 h-8 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Starting TeleCloud...</span>
        </div>
      </div>
    );
  }

  // 2. Step 1: Configure personal Telegram API keys
  if (!isConfigured) {
    return <ApiKeySetup />;
  }

  // 3. Step 2: Login with Telegram
  if (!isAuthenticated) {
    return <TelegramLogin />;
  }

  // 4. Step 3: Manual Storage Channel Selection (User-Controlled!)
  if (!isChannelSelected) {
    return <ChannelSetup />;
  }

  // 5. Main Drive Workspace
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-950/40">
        <Header onRefresh={() => activeChannel.id && loadIndex(activeChannel.id)} />

        {activeTab === "settings" ? (
          <SettingsPage />
        ) : (
          <DrivePage tab={activeTab} />
        )}
      </main>

      {/* Modals & Transfer Manager */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <NewFolderModal isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} />
      <TransferQueue />
    </div>
  );
};

export default App;
