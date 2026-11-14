import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useAuthStore } from "./stores/authStore";
import { useFileStore } from "./stores/fileStore";
import { ApiKeySetup } from "./components/auth/ApiKeySetup";
import { TelegramLogin } from "./components/auth/TelegramLogin";
import { ChannelSetup } from "./components/auth/ChannelSetup";
import { TeleCloudLogo } from "./components/common/TeleCloudLogo";
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

  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
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
      <div className="min-h-screen w-screen bg-[#0E0E0E] flex flex-col items-center justify-center gap-4 text-neutral-400 select-none">
        <TeleCloudLogo size="lg" showText={true} />
        <div className="flex items-center gap-2 text-xs text-[#9aa0a6] mt-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7CB8F8]" />
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

  // 5. Main Google Drive Workspace
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0E0E0E] text-[#e3e3e3] font-sans antialiased">
      {/* Top Header */}
      <Header
        onRefresh={() => activeChannel.id && loadIndex(activeChannel.id)}
        onOpenSettings={() => setActiveTab("settings")}
      />

      {/* Main Workspace: Sidebar on left, rounded container on right */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenNewFolder={() => setIsNewFolderOpen(true)}
        />

        {/* Right Workspace container */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {activeTab === "settings" ? (
            <div className="flex-1 mr-3 mb-3 bg-[#131314] rounded-[24px] border border-white/[0.04] overflow-y-auto p-6">
              <SettingsPage />
            </div>
          ) : (
            <DrivePage
              tab={activeTab}
              setActiveTab={setActiveTab}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenNewFolder={() => setIsNewFolderOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals & Transfer Manager */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <NewFolderModal isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} />
      <TransferQueue />
    </div>
  );
};

export default App;
