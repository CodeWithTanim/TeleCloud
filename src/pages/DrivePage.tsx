import React, { useState, useRef } from "react";
import { ChevronRight, Star, Clock, Trash2, UploadCloud } from "lucide-react";
import { useFileStore } from "../stores/fileStore";
import { useAuthStore } from "../stores/authStore";
import { useTransferStore } from "../stores/transferStore";
import { FileGrid } from "../components/drive/FileGrid";
import { FileList } from "../components/drive/FileList";
import { FilePreviewModal } from "../components/drive/FilePreviewModal";
import { triggerFileDownload } from "../lib/telegram/downloader";
import { uploadFileToChannel } from "../lib/telegram/uploader";
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
    addFile,
  } = useFileStore();
  const { activeChannel } = useAuthStore();
  const { addTransfer, updateProgress, setStatus } = useTransferStore();

  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

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

  // Drag and Drop upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);

    if (!activeChannel.id) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    for (const file of droppedFiles) {
      const transferId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      addTransfer({
        id: transferId,
        name: file.name,
        size: file.size,
        transferred: 0,
        type: "upload",
      });

      try {
        const driveFile = await uploadFileToChannel(
          activeChannel.id,
          file,
          currentFolderId,
          (progress) => {
            updateProgress(transferId, progress.percentage, progress.bytesUploaded);
          }
        );
        await addFile(activeChannel.id, driveFile);
        setStatus(transferId, "completed");
      } catch (err: any) {
        console.error("[DragDropUpload] Upload failed for", file.name, err);
        setStatus(transferId, "error", err.message || "Upload failed");
      }
    }
  };

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
  const currentFolder = folders.find((f: DriveFolder) => f.id === currentFolderId);
  if (currentFolderId && tab === "drive") {
    let curr = currentFolder;
    const trail: { id: string; name: string }[] = [];
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f: DriveFolder) => f.id === curr?.parentId);
    }
    breadcrumbs.push(...trail);
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 overflow-y-auto p-6"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-indigo-950/85 backdrop-blur-md border-2 border-dashed border-indigo-400 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-2xl shadow-indigo-500/40 mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Drop files to upload</h3>
          <p className="text-sm text-indigo-200 mt-1">
            Uploading directly to:{" "}
            <span className="font-semibold text-white">
              {currentFolder ? currentFolder.name : "My Drive (Root)"}
            </span>
          </p>
          <p className="text-xs text-indigo-300/70 mt-2">
            Files will be stored securely in your Telegram storage channel
          </p>
        </div>
      )}

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
