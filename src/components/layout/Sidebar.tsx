import React, { useState } from "react";
import {
  Home,
  Star,
  Trash2,
  Plus,
  FolderPlus,
  Upload,
  FolderUp,
  Folder,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useFileStore } from "../../stores/fileStore";
import { formatBytes } from "../../lib/utils/formatters";
import { ActiveTab } from "../../types";
import { PinFolderModal } from "../drive/PinFolderModal";
import { TeleCloudLogo } from "../common/TeleCloudLogo";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenNewFolder,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { files, folders, currentFolderId, setCurrentFolderId, togglePinFolder } = useFileStore();
  const { activeChannel } = useAuthStore();
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const pinnedFolders = folders.filter((f) => !f.isDeleted && f.isPinned);

  const totalUsedBytes = files
    .filter((f) => !f.isDeleted)
    .reduce((acc, f) => acc + (f.size || 0), 0);

  const renderNavItem = (
    id: ActiveTab,
    label: string,
    icon: React.ReactNode,
    onClickExtra?: () => void
  ) => {
    const isActive =
      id === "home"
        ? activeTab === "home" && currentFolderId === null
        : activeTab === id;

    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          onClickExtra?.();
          onCloseMobile?.();
        }}
        className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-2 rounded-full text-sm font-medium transition cursor-pointer group ${
          isActive
            ? "bg-[#004a77] text-[#c2e7ff] font-semibold"
            : "text-[#c4c7c5] hover:bg-[#1f1f1f] hover:text-[#e3e3e3]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
      </button>
    );
  };

  const sidebarContent = (
    <>
      <div className="space-y-4">
        {/* + New Button */}
        <div className="relative pt-2 pb-1">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full sm:w-auto h-12 px-5 rounded-2xl bg-[#37393b] hover:bg-[#444649] text-white transition-all duration-150 shadow-md flex items-center justify-center sm:justify-start gap-3 cursor-pointer group"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
            <span className="text-sm font-medium text-white tracking-wide">New</span>
          </button>

          {/* "+ New" Dropdown Menu */}
          {showNewMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNewMenu(false)}
              />
              <div className="absolute left-0 top-18 z-50 w-60 bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl py-2 text-sm text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onOpenNewFolder();
                    onCloseMobile?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer"
                >
                  <FolderPlus className="w-4.5 h-4.5 text-[#9aa0a6]" />
                  <span>New folder</span>
                </button>

                <div className="my-1.5 border-t border-white/10" />

                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onOpenUpload();
                    onCloseMobile?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer"
                >
                  <Upload className="w-4.5 h-4.5 text-[#9aa0a6]" />
                  <span>File upload</span>
                </button>

                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onOpenUpload();
                    onCloseMobile?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer"
                >
                  <FolderUp className="w-4.5 h-4.5 text-[#9aa0a6]" />
                  <span>Folder upload</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Sections: Home, Starred, Pinned Folders & Trash */}
        <nav className="space-y-1">
          {renderNavItem("home", "Home", <Home className="w-4.5 h-4.5" />, () => setCurrentFolderId(null))}
          {renderNavItem("starred", "Starred", <Star className="w-4.5 h-4.5" />, () => setCurrentFolderId(null))}

          {/* Pinned Folders Section */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between px-3 py-1 mb-0.5">
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa0a6] uppercase select-none">
                Pinned
              </span>
              <button
                onClick={() => setShowPinModal(true)}
                className="p-1 rounded-md text-[#9aa0a6] hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Pin a folder to sidebar"
                aria-label="Pin a folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {pinnedFolders.length === 0 ? (
              <button
                onClick={() => setShowPinModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs text-[#75777a] hover:text-[#c4c7c5] hover:bg-[#1a1b1c] transition cursor-pointer group"
              >
                <Pin className="w-3.5 h-3.5 group-hover:text-[#7CB8F8] transition" />
                <span>Pin folders here</span>
              </button>
            ) : (
              <div className="space-y-0.5">
                {pinnedFolders.map((folder) => {
                  const isFolderActive =
                    activeTab === "home" && currentFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      className={`group/pin relative flex items-center justify-between rounded-full text-sm font-medium transition cursor-pointer ${
                        isFolderActive
                          ? "bg-[#004a77] text-[#c2e7ff] font-semibold"
                          : "text-[#c4c7c5] hover:bg-[#1f1f1f] hover:text-[#e3e3e3]"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveTab("home");
                          setCurrentFolderId(folder.id);
                          onCloseMobile?.();
                        }}
                        className="flex-1 flex items-center gap-3 px-4 py-2 min-w-0 text-left cursor-pointer"
                        title={folder.name}
                      >
                        <Folder
                          className={`w-4.5 h-4.5 shrink-0 ${
                            isFolderActive
                              ? "text-[#c2e7ff] fill-[#c2e7ff]/30"
                              : "text-amber-400/80 fill-amber-400/20"
                          }`}
                        />
                        <span className="truncate">{folder.name}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeChannel.id) {
                            togglePinFolder(activeChannel.id, folder.id);
                          }
                        }}
                        className="mr-2 p-1.5 rounded-full text-[#9aa0a6] hover:text-rose-400 hover:bg-rose-500/10 opacity-100 sm:opacity-0 sm:group-hover/pin:opacity-100 transition cursor-pointer shrink-0"
                        title="Unpin folder from sidebar"
                        aria-label="Unpin folder"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {renderNavItem("trash", "Trash", <Trash2 className="w-4.5 h-4.5" />)}
        </nav>
      </div>

      {/* Storage Meter at the very bottom (Unlimited Telegram Cloud) */}
      <div className="px-3 pt-3">
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#282a2c] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full bg-gradient-to-r from-[#2AABEE] to-[#229ED9] rounded-full transition-all duration-300 ${
              totalUsedBytes > 0 ? "w-2.5" : "w-0"
            }`}
          />
        </div>

        {/* Dynamic storage text reflecting actual files in Telegram */}
        <p className="text-xs text-[#9aa0a6] select-none">
          <span className="text-[#e3e3e3] font-normal">{formatBytes(totalUsedBytes)}</span> of Unlimited used
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[#0E0E0E] flex-col justify-between h-[calc(100vh-4rem)] shrink-0 select-none pb-4 px-3 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer (slides in from left) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#141517] border-r border-white/10 flex flex-col justify-between h-full p-4 overflow-y-auto shadow-2xl transition-transform duration-300 ease-out md:hidden select-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Drawer Top Header with Logo and Close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.08]">
            <button
              onClick={() => {
                setActiveTab("home");
                setCurrentFolderId(null);
                useFileStore.getState().setSearchQuery("");
                onCloseMobile?.();
              }}
              className="flex items-center cursor-pointer hover:opacity-90 active:scale-95 transition focus:outline-none"
              title="Go to Home"
            >
              <TeleCloudLogo size="sm" showText={true} className="pointer-events-none" />
            </button>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-full text-[#9aa0a6] hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {sidebarContent}
        </div>
      </aside>

      {/* Pin Folder Modal */}
      <PinFolderModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </>
  );
};
