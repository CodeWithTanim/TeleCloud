import React, { useState } from "react";
import {
  Home,
  FolderKanban,
  HardDrive,
  Laptop,
  Users,
  Clock,
  Star,
  AlertCircle,
  Trash2,
  Cloud,
  Plus,
  FolderPlus,
  Upload,
  FolderUp,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useFileStore } from "../../stores/fileStore";
import { formatBytes } from "../../lib/utils/formatters";
import { ActiveTab } from "../../types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenNewFolder,
}) => {
  const { files } = useFileStore();
  const [showNewMenu, setShowNewMenu] = useState(false);

  const totalUsedBytes = files
    .filter((f) => !f.isDeleted)
    .reduce((acc, f) => acc + (f.size || 0), 0);

  // Percentage of 400 GB (or custom target)
  const maxBytes = 400 * 1024 * 1024 * 1024; // 400 GB
  const usedPercentage = Math.min(100, Math.max(1, (totalUsedBytes / maxBytes) * 100));

  const renderNavItem = (
    id: ActiveTab,
    label: string,
    icon: React.ReactNode,
    hasChevron: boolean = false
  ) => {
    const isActive = activeTab === id;

    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer group ${
          isActive
            ? "bg-[#004a77] text-[#c2e7ff] font-semibold"
            : "text-[#c4c7c5] hover:bg-[#1f1f1f] hover:text-[#e3e3e3]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasChevron ? (
            <span className="w-3.5 -ml-1 text-[#9aa0a6]">
              {isActive ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-3.5 -ml-1" />
          )}
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-[#0E0E0E] flex flex-col justify-between h-[calc(100vh-4rem)] shrink-0 select-none pb-4 px-3 overflow-y-auto">
      <div className="space-y-4">
        {/* + New Button */}
        <div className="relative pt-2 pb-1">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="h-12 px-5 rounded-2xl bg-[#37393b] hover:bg-[#444649] text-white transition-all duration-150 shadow-md flex items-center gap-3 cursor-pointer group"
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

        {/* Navigation Sections */}
        <nav className="space-y-0.5">
          {/* Section 1: Home & Projects */}
          {renderNavItem("home", "Home", <Home className="w-4.5 h-4.5" />)}
          {renderNavItem("projects", "Projects", <FolderKanban className="w-4.5 h-4.5" />)}

          {/* Section 2: Drives */}
          {renderNavItem("drive", "My Drive", <HardDrive className="w-4.5 h-4.5" />, true)}
          {renderNavItem("computers", "Computers", <Laptop className="w-4.5 h-4.5" />, true)}

          {/* Divider */}
          <div className="my-2 border-t border-white/[0.08] mx-2" />

          {/* Section 3: Shared & Activity */}
          {renderNavItem("shared", "Shared with me", <Users className="w-4.5 h-4.5" />)}
          {renderNavItem("recent", "Recent", <Clock className="w-4.5 h-4.5" />)}
          {renderNavItem("starred", "Starred", <Star className="w-4.5 h-4.5" />)}

          {/* Divider */}
          <div className="my-2 border-t border-white/[0.08] mx-2" />

          {/* Section 4: Maintenance */}
          {renderNavItem("spam", "Spam", <AlertCircle className="w-4.5 h-4.5" />)}
          {renderNavItem("trash", "Trash", <Trash2 className="w-4.5 h-4.5" />)}
          {renderNavItem("storage", "Storage", <Cloud className="w-4.5 h-4.5" />)}
        </nav>
      </div>

      {/* Storage Meter at the very bottom */}
      <div className="px-3 pt-3">
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#282a2c] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#1a73e8] rounded-full transition-all duration-300"
            style={{ width: `${usedPercentage}%` }}
          />
        </div>

        {/* Storage text matching screenshot */}
        <p className="text-xs text-[#9aa0a6]">
          {totalUsedBytes > 0 ? formatBytes(totalUsedBytes) : "966 KB"} of 400 GB used
        </p>
      </div>
    </aside>
  );
};
