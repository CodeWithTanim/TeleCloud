import React, { useState } from "react";
import { ChevronRight, Star, Clock, Trash2 } from "lucide-react";
import { useFileStore } from "../stores/fileStore";
import { useAuthStore } from "../stores/authStore";
import { FileGrid } from "../components/drive/FileGrid";
import { FileList } from "../components/drive/FileList";
import { FilePreviewModal } from "../components/drive/FilePreviewModal";
import { triggerFileDownload } from "../lib/telegram/downloader";
import { DriveFile, DriveFolder, ActiveTab } from "../types";

interface DrivePageProps {
  tab: ActiveTab;
}

export const DrivePage: React.FC<DrivePageProps> = ({ tab }) => {
  const {
    files,
    folders,
    currentFolderId,
    setCurrentFolderId,
    viewMode,
    searchQuery,
    toggleStar,
    renameItem,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
  } = useFileStore();
  const { activeChannel } = useAuthStore();

  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  // Filter items based on tab & folder
  let filteredFolders: DriveFolder[] = folders;
  let filteredFiles: DriveFile[] = files;

  if (tab === "starred") {
    filteredFolders = folders.filter((f: DriveFolder) => f.isStarred && !f.isDeleted);
    filteredFiles = files.filter((f: DriveFile) => f.isStarred && !f.isDeleted);
  } else if (tab === "trash") {
    filteredFolders = folders.filter((f: DriveFolder) => f.isDeleted);
    filteredFiles = files.filter((f: DriveFile) => f.isDeleted);
  } else if (tab === "recent") {
    filteredFolders = [];
    filteredFiles = [...files]
      .filter((f: DriveFile) => !f.isDeleted)
      .sort((a: DriveFile, b: DriveFile) => b.uploadedAt - a.uploadedAt)
      .slice(0, 30);
  } else {
    // Normal "drive" tab: filter by active folder & non-deleted
    filteredFolders = folders.filter(
      (f: DriveFolder) => f.parentId === currentFolderId && !f.isDeleted
    );
    filteredFiles = files.filter(
      (f: DriveFile) => f.folderId === currentFolderId && !f.isDeleted
    );
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredFolders = filteredFolders.filter((f: DriveFolder) => f.name.toLowerCase().includes(q));
    filteredFiles = filteredFiles.filter((f: DriveFile) => f.name.toLowerCase().includes(q));
  }

  const handleDownload = (file: DriveFile) => {
    if (!activeChannel.id) return;
    triggerFileDownload(activeChannel.id, file.messageId, file.name);
  };

  const handleToggleStar = (id: string, isFolder: boolean) => {
    if (!activeChannel.id) return;
    toggleStar(activeChannel.id, id, isFolder);
  };

  const handleRename = (id: string, name: string, isFolder: boolean) => {
    if (!activeChannel.id) return;
    renameItem(activeChannel.id, id, name, isFolder);
  };

  const handleDelete = (id: string, isFolder: boolean) => {
    if (!activeChannel.id) return;
    if (tab === "trash") {
      if (confirm("Permanently delete this item?")) {
        deletePermanently(activeChannel.id, id, isFolder);
      }
    } else {
      moveToTrash(activeChannel.id, id, isFolder);
    }
  };

  // Breadcrumbs calculation
  const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: "My Drive" }];
  if (currentFolderId && tab === "drive") {
    let curr = folders.find((f: DriveFolder) => f.id === currentFolderId);
    const trail: { id: string; name: string }[] = [];
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f: DriveFolder) => f.id === curr?.parentId);
    }
    breadcrumbs.push(...trail);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Title / Breadcrumb navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {tab === "drive" ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.id || "root"}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-slate-600" />}
                <button
                  onClick={() => setCurrentFolderId(b.id)}
                  className={`px-2 py-1 rounded-lg transition font-medium ${
                    i === breadcrumbs.length - 1
                      ? "text-white bg-slate-900 border border-slate-800"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-lg font-bold text-white capitalize">
            {tab === "starred" && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            {tab === "recent" && <Clock className="w-5 h-5 text-indigo-400" />}
            {tab === "trash" && <Trash2 className="w-5 h-5 text-rose-400" />}
            <span>{tab}</span>
          </div>
        )}
      </div>

      {/* Main Views */}
      {viewMode === "grid" ? (
        <FileGrid
          folders={filteredFolders}
          files={filteredFiles}
          onOpenFolder={(id: string) => setCurrentFolderId(id)}
          onPreview={(f: DriveFile) => setPreviewFile(f)}
          onDownload={handleDownload}
          onToggleStar={handleToggleStar}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      ) : (
        <FileList
          folders={filteredFolders}
          files={filteredFiles}
          onOpenFolder={(id: string) => setCurrentFolderId(id)}
          onPreview={(f: DriveFile) => setPreviewFile(f)}
          onDownload={handleDownload}
          onToggleStar={handleToggleStar}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
