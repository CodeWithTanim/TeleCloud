import React from "react";
import {
  HardDrive,
  Star,
  Clock,
  Trash2,
  Settings,
  FolderPlus,
  UploadCloud,
  LogOut,
  Layers,
} from "lucide-react";
import { BrandLogo } from "../common/BrandLogo";
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
  const { user, activeChannel, logout, clearActiveChannel } = useAuthStore();
  const { files } = useFileStore();

  const totalUsedBytes = files
    .filter((f) => !f.isDeleted)
    .reduce((acc, f) => acc + (f.size || 0), 0);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "drive", label: "My Drive", icon: <HardDrive className="w-4.5 h-4.5" /> },
    { id: "starred", label: "Starred", icon: <Star className="w-4.5 h-4.5" /> },
    { id: "recent", label: "Recent", icon: <Clock className="w-4.5 h-4.5" /> },
    { id: "trash", label: "Trash", icon: <Trash2 className="w-4.5 h-4.5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4.5 h-4.5" /> },
  ];

  return (
    <aside className="w-64 bg-[#0e1013] border-r border-white/[0.06] flex flex-col justify-between h-screen shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <BrandLogo size="sm" showText={true} />
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-2 space-y-2">
          <button
            onClick={onOpenUpload}
            className="w-full h-10 rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={onOpenNewFolder}
            className="w-full h-9 rounded-full bg-[#1c1e22] hover:bg-[#25282d] text-neutral-300 hover:text-white border border-white/[0.06] font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-[#202329] text-white font-semibold shadow-xs"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage Meter & Account Section */}
      <div className="p-4 border-t border-white/[0.06] space-y-4 bg-[#0a0b0d]/50">
        {/* Channel info banner */}
        <div className="p-3 rounded-2xl bg-[#141517] border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <Layers className="w-3.5 h-3.5 text-[#A8C7FA]" /> Storage Channel
            </span>
            <button
              onClick={clearActiveChannel}
              className="text-[10px] text-[#A8C7FA] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>
          <p className="font-semibold text-white truncate text-xs" title={activeChannel.title || ""}>
            {activeChannel.title || "Custom Channel"}
          </p>
        </div>

        {/* Storage Bar */}
        <div className="px-1">
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>Storage Used</span>
            <span className="font-semibold text-white">{formatBytes(totalUsedBytes)}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1E1F22] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1d9bf0] to-[#22c55e] w-1/4 rounded-full" />
          </div>
          <span className="text-[10px] text-neutral-500 mt-1 block">
            Telegram Unlimited Cloud Storage
          </span>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1E1F22] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-[#A8C7FA] shrink-0">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.firstName}</p>
              <p className="text-[10px] text-neutral-500 truncate">{user?.phone || user?.username || "Telegram"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-white/[0.04] rounded-lg transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
