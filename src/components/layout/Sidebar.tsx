import React from "react";
import {
  HardDrive,
  Star,
  Clock,
  Trash2,
  Settings,
  Plus,
  FolderPlus,
  UploadCloud,
  LogOut,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "../common/Button";
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
    { id: "drive", label: "My Drive", icon: <HardDrive className="w-5 h-5" /> },
    { id: "starred", label: "Starred", icon: <Star className="w-5 h-5" /> },
    { id: "recent", label: "Recent", icon: <Clock className="w-5 h-5" /> },
    { id: "trash", label: "Trash", icon: <Trash2 className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">TeleCloud</span>
              <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
                Private Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-2 space-y-2">
          <Button
            variant="primary"
            className="w-full justify-start gap-2.5 py-2.5 shadow-md shadow-indigo-600/20"
            onClick={onOpenUpload}
            icon={<UploadCloud className="w-4 h-4" />}
          >
            Upload File
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start gap-2.5 py-2 text-xs"
            onClick={onOpenNewFolder}
            icon={<FolderPlus className="w-4 h-4" />}
          >
            New Folder
          </Button>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
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
      <div className="p-4 border-t border-slate-800/80 space-y-4">
        {/* Channel info banner */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Storage Channel
            </span>
            <button
              onClick={clearActiveChannel}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
            >
              Change
            </button>
          </div>
          <p className="font-semibold text-slate-200 truncate" title={activeChannel.title || ""}>
            {activeChannel.title || "Custom Channel"}
          </p>
        </div>

        {/* Storage Bar */}
        <div className="px-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Storage Used</span>
            <span className="font-semibold text-slate-200">{formatBytes(totalUsedBytes)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-1/3 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Telegram Unlimited Cloud Storage
          </span>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.firstName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.phone || user?.username || "Telegram"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
