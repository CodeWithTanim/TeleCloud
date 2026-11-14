import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Home,
  Star,
  Trash2,
  Settings,
  Plus,
  FolderPlus,
  FileUp,
} from "lucide-react";
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
  const { loadIndex, currentFolderId, setCurrentFolderId } = useFileStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMobileFabMenu, setShowMobileFabMenu] = useState(false);

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
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace: Sidebar on left, workspace container on right */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Desktop + Mobile Slide-over Drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenNewFolder={() => setIsNewFolderOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Workspace container */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {activeTab === "settings" ? (
            <div className="flex-1 md:mr-3 md:mb-3 pb-20 md:pb-6 bg-[#131314] rounded-none md:rounded-[24px] border-0 md:border border-white/[0.04] overflow-y-auto p-4 sm:p-6">
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

      {/* Mobile Floating Action Button (FAB) */}
      {activeTab !== "settings" && activeTab !== "trash" && (
        <div className="fixed bottom-18 right-4 z-40 md:hidden">
          <button
            onClick={() => setShowMobileFabMenu((prev) => !prev)}
            className="w-13 h-13 rounded-2xl bg-[#004a77] hover:bg-[#005a92] active:scale-95 text-[#c2e7ff] shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-[#7CB8F8]/40 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Create or upload"
          >
            <Plus
              className={`w-6 h-6 transition-transform duration-200 ${
                showMobileFabMenu ? "rotate-45" : ""
              }`}
              strokeWidth={2.4}
            />
          </button>

          {showMobileFabMenu && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs"
                onClick={() => setShowMobileFabMenu(false)}
              />
              <div className="absolute right-0 bottom-16 z-40 w-52 bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl py-2 text-sm text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMobileFabMenu(false);
                    setIsNewFolderOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer"
                >
                  <FolderPlus className="w-4.5 h-4.5 text-[#7CB8F8]" />
                  <span>New folder</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setShowMobileFabMenu(false);
                    setIsUploadOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer"
                >
                  <FileUp className="w-4.5 h-4.5 text-[#7CB8F8]" />
                  <span>File upload</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#141517]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1 flex items-center justify-around md:hidden select-none safe-area-pb">
        <button
          onClick={() => {
            setActiveTab("home");
            setCurrentFolderId(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === "home" && currentFolderId === null
              ? "text-[#c2e7ff]"
              : "text-[#9aa0a6] hover:text-white"
          }`}
        >
          <div
            className={`px-4 py-0.5 rounded-full transition ${
              activeTab === "home" && currentFolderId === null
                ? "bg-[#004a77]"
                : "bg-transparent"
            }`}
          >
            <Home className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("starred");
            setCurrentFolderId(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === "starred" ? "text-[#c2e7ff]" : "text-[#9aa0a6] hover:text-white"
          }`}
        >
          <div
            className={`px-4 py-0.5 rounded-full transition ${
              activeTab === "starred" ? "bg-[#004a77]" : "bg-transparent"
            }`}
          >
            <Star className={`w-4.5 h-4.5 ${activeTab === "starred" ? "fill-[#c2e7ff]" : ""}`} />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Starred</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("trash");
            setCurrentFolderId(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === "trash" ? "text-[#c2e7ff]" : "text-[#9aa0a6] hover:text-white"
          }`}
        >
          <div
            className={`px-4 py-0.5 rounded-full transition ${
              activeTab === "trash" ? "bg-[#004a77]" : "bg-transparent"
            }`}
          >
            <Trash2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Trash</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === "settings" ? "text-[#c2e7ff]" : "text-[#9aa0a6] hover:text-white"
          }`}
        >
          <div
            className={`px-4 py-0.5 rounded-full transition ${
              activeTab === "settings" ? "bg-[#004a77]" : "bg-transparent"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Settings</span>
        </button>
      </nav>

      {/* Modals & Transfer Manager */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <NewFolderModal isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} />
      <TransferQueue />
    </div>
  );
};

export default App;
