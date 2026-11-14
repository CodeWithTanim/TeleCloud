import React from "react";
import { Search, LayoutGrid, List, RefreshCw, ChevronRight, Folder } from "lucide-react";
import { useFileStore } from "../../stores/fileStore";
import { useAuthStore } from "../../stores/authStore";

interface HeaderProps {
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const { searchQuery, setSearchQuery, viewMode, setViewMode, isLoading, isSaving, currentFolderId, folders, setCurrentFolderId } =
    useFileStore();
  const { activeChannel } = useAuthStore();

  // Compute folder breadcrumb trail
  const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: "My Drive" }];
  if (currentFolderId) {
    let curr = folders.find((f) => f.id === currentFolderId);
    const trail: { id: string; name: string }[] = [];
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    breadcrumbs.push(...trail);
  }

  return (
    <header className="h-16 px-6 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0 gap-4">
      {/* Search Input */}
      <div className="relative w-96 max-w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Breadcrumbs & Controls */}
      <div className="flex items-center gap-3">
        {/* Sync / Saving indicator */}
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving Index...
          </span>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition border border-slate-800"
          title="Reload Drive"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
        </button>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition ${
              viewMode === "grid"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition ${
              viewMode === "list"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
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
