import React, { useState } from "react";
import { Search, SlidersHorizontal, Settings, RefreshCw, CheckCircle2, User } from "lucide-react";
import { TeleCloudLogo } from "../common/TeleCloudLogo";
import { useFileStore } from "../../stores/fileStore";
import { useAuthStore } from "../../stores/authStore";

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onOpenSettings }) => {
  const { searchQuery, setSearchQuery, isSaving, isLoading } = useFileStore();
  const { user, activeChannel } = useAuthStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0E0E0E] flex items-center justify-between shrink-0 gap-4 select-none border-b border-transparent">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center min-w-[240px]">
        <TeleCloudLogo size="md" showText={true} />
      </div>

      {/* Middle: Google Drive Search Bar */}
      <div className="flex-1 max-w-2xl relative">
        <div
          className={`w-full h-12 rounded-full transition-all duration-200 flex items-center px-4 gap-3 ${
            isSearchFocused
              ? "bg-[#282a2c] shadow-[0_1px_3px_0_rgba(0,0,0,0.4)] ring-1 ring-white/10"
              : "bg-[#282a2c] hover:bg-[#333537]"
          }`}
        >
          <Search className="w-5 h-5 text-[#9aa0a6] shrink-0" />
          <input
            type="text"
            placeholder="Search in Drive"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#e3e3e3] placeholder-[#9aa0a6] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#9aa0a6] hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
          <button
            title="Search options"
            className="p-1 text-[#9aa0a6] hover:text-white rounded-full transition cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sync/Saving Indicator */}
        {isSaving && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
          </span>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition cursor-pointer"
          title="Refresh Drive"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin text-[#7CB8F8]" : ""}`} />
        </button>

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile Avatar */}
        <div
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full bg-[#37393b] border border-white/10 hover:border-white/25 flex items-center justify-center text-xs font-semibold text-[#c2e7ff] ml-1 cursor-pointer transition overflow-hidden"
          title={user?.firstName ? `${user.firstName} (${activeChannel.title || "Cloud"})` : "Account"}
        >
          {user?.firstName ? (
            user.firstName.charAt(0).toUpperCase()
          ) : (
            <User className="w-4 h-4 text-[#9aa0a6]" />
          )}
        </div>
      </div>
    </header>
  );
};
