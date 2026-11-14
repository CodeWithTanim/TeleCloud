import React, { useState } from "react";
import { Search, SlidersHorizontal, Settings, RefreshCw, User, Menu } from "lucide-react";
import { TeleCloudLogo } from "../common/TeleCloudLogo";
import { useFileStore } from "../../stores/fileStore";
import { useAuthStore } from "../../stores/authStore";

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleMobileSidebar?: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenSettings,
  onToggleMobileSidebar,
  onNavigateHome,
}) => {
  const { searchQuery, setSearchQuery, isSaving, isLoading } = useFileStore();
  const { user, activeChannel } = useAuthStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="h-14 sm:h-16 px-2.5 sm:px-6 bg-[#0E0E0E] flex items-center justify-between shrink-0 gap-2 sm:gap-4 select-none border-b border-transparent">
      {/* Left: Mobile Hamburger + Brand Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 md:min-w-[240px]">
        {/* Mobile Hamburger Menu button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition cursor-pointer"
            title="Open Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo (Always shows icon, text responsive, clickable to navigate Home) */}
        <button
          onClick={onNavigateHome}
          className="flex items-center cursor-pointer transition hover:opacity-90 active:scale-95 group focus:outline-none"
          title="TeleCloud - Go to Home"
          aria-label="TeleCloud Home"
        >
          <TeleCloudLogo size="sm" showText={true} className="hidden sm:flex pointer-events-none" />
          <TeleCloudLogo size="sm" showText={false} className="flex sm:hidden pointer-events-none" />
        </button>
      </div>

      {/* Middle: Google Drive Search Bar */}
      <div className="flex-1 max-w-2xl relative min-w-0">
        <div
          className={`w-full h-10 sm:h-12 rounded-full transition-all duration-200 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 ${
            isSearchFocused
              ? "bg-[#282a2c] shadow-[0_1px_3px_0_rgba(0,0,0,0.4)] ring-1 ring-white/10"
              : "bg-[#282a2c] hover:bg-[#333537]"
          }`}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#9aa0a6] shrink-0" />
          <input
            type="text"
            placeholder="Search in Drive"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#e3e3e3] placeholder-[#9aa0a6] outline-none min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#9aa0a6] hover:text-white text-xs px-1 shrink-0"
            >
              ✕
            </button>
          )}
          <button
            title="Search options"
            className="p-1 text-[#9aa0a6] hover:text-white rounded-full transition cursor-pointer shrink-0 hidden sm:block"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Sync/Saving Indicator */}
        {isSaving && (
          <span className="hidden lg:flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
          </span>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 sm:p-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition cursor-pointer"
          title="Refresh Drive"
          aria-label="Refresh Drive"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? "animate-spin text-[#7CB8F8]" : ""}`} />
        </button>

        {/* Settings Gear (Desktop only - mobile has bottom nav) */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:flex p-2 sm:p-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile Avatar */}
        <div
          onClick={onOpenSettings}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#37393b] border border-white/10 hover:border-white/25 flex items-center justify-center text-xs font-semibold text-[#c2e7ff] cursor-pointer transition overflow-hidden shrink-0"
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
