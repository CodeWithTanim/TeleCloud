import React, { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { useAuthStore } from "./stores/authStore";
import { useFileStore } from "./stores/fileStore";
import { ApiKeySetup } from "./components/auth/ApiKeySetup";
import { TelegramLogin } from "./components/auth/TelegramLogin";
import { ChannelSetup } from "./components/auth/ChannelSetup";
import { BrandLogo } from "./components/common/BrandLogo";
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
      <div className="min-h-screen w-screen bg-[#0a0b0d] flex flex-col items-center justify-center gap-4 text-neutral-400 select-none">
        <BrandLogo size="lg" showText={true} />
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A8C7FA]" />
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0b0d] text-[#e3e3e3] font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0a0b0d]">
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
