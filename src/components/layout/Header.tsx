import React from "react";
import { Search, LayoutGrid, List, RefreshCw } from "lucide-react";
import { useFileStore } from "../../stores/fileStore";
import { useAuthStore } from "../../stores/authStore";

interface HeaderProps {
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const { searchQuery, setSearchQuery, viewMode, setViewMode, isLoading, isSaving } =
    useFileStore();
  const { activeChannel } = useAuthStore();

  return (
    <header className="h-16 px-6 bg-[#0a0b0d]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between shrink-0 gap-4 select-none">
      {/* Search Input */}
      <div className="relative w-96 max-w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-[#141517] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 rounded-full text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Sync / Saving indicator */}
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving Index...
          </span>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.06] border border-white/[0.08] transition cursor-pointer"
          title="Reload Drive"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#A8C7FA]" : ""}`} />
        </button>

        {/* View Switcher */}
        <div className="flex items-center bg-[#141517] border border-white/[0.08] rounded-full p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#2C2D30] text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              viewMode === "list"
                ? "bg-[#2C2D30] text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
