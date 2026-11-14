import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Trash2,
  UploadCloud,
  Check,
  List,
  LayoutGrid,
  HardDrive,
  Home,
  FolderKanban,
  Laptop,
  Users,
  AlertCircle,
  Cloud,
  FolderPlus,
  FileUp,
  FolderUp,
} from "lucide-react";
import { useFileStore } from "../stores/fileStore";
import { useAuthStore } from "../stores/authStore";
import { useTransferStore } from "../stores/transferStore";
import { FileGrid } from "../components/drive/FileGrid";
import { FileList } from "../components/drive/FileList";
import { FilePreviewModal } from "../components/drive/FilePreviewModal";
import { DriveEmptyIllustration } from "../components/drive/DriveEmptyIllustration";
import { triggerFileDownload } from "../lib/telegram/downloader";
import { uploadFileToChannel } from "../lib/telegram/uploader";
import { getFileCategory } from "../lib/utils/formatters";
import { DriveFile, DriveFolder, ActiveTab } from "../types";

interface DrivePageProps {
  tab: ActiveTab;
  onOpenUpload?: () => void;
  onOpenNewFolder?: () => void;
}

export const DrivePage: React.FC<DrivePageProps> = ({
  tab,
  onOpenUpload,
  onOpenNewFolder,
}) => {
  const {
    files,
    folders,
    currentFolderId,
    setCurrentFolderId,
    viewMode,
    setViewMode,
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
  const [showDriveMenu, setShowDriveMenu] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showModifiedDropdown, setShowModifiedDropdown] = useState(false);
  const [modifiedFilter, setModifiedFilter] = useState<string>("all");
  const dragCounter = useRef(0);

  // Filter items based on tab & folder
  let filteredFolders: DriveFolder[] = folders;
  let filteredFiles: DriveFile[] = files;

  if (tab === "starred") {
    filteredFolders = folders.filter((f) => f.isStarred && !f.isDeleted);
    filteredFiles = files.filter((f) => f.isStarred && !f.isDeleted);
  } else if (tab === "trash") {
    filteredFolders = folders.filter((f) => f.isDeleted);
    filteredFiles = files.filter((f) => f.isDeleted);
  } else if (tab === "recent") {
    filteredFolders = [];
    filteredFiles = [...files]
      .filter((f) => !f.isDeleted)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 40);
  } else if (tab === "home") {
    filteredFolders = folders.filter((f) => !f.isDeleted).slice(0, 6);
    filteredFiles = [...files]
      .filter((f) => !f.isDeleted)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  } else if (tab === "projects" || tab === "computers" || tab === "shared" || tab === "spam") {
    filteredFolders = [];
    filteredFiles = [];
  } else if (tab === "storage") {
    filteredFolders = [];
    filteredFiles = files.filter((f) => !f.isDeleted).sort((a, b) => b.size - a.size);
  } else {
    // Normal "drive" tab: filter by active folder & non-deleted
    filteredFolders = folders.filter(
      (f) => f.parentId === currentFolderId && !f.isDeleted
    );
    filteredFiles = files.filter(
      (f) => f.folderId === currentFolderId && !f.isDeleted
    );
  }

  // Type filter chip
  if (selectedType !== "all") {
    filteredFolders = [];
    filteredFiles = filteredFiles.filter((f) => {
      const cat = getFileCategory(f.mimeType, f.name);
      return cat === selectedType;
    });
  }

  // Modified filter chip
  if (modifiedFilter !== "all") {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (modifiedFilter === "today") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= oneDay);
    } else if (modifiedFilter === "week") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= 7 * oneDay);
    } else if (modifiedFilter === "month") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= 30 * oneDay);
    }
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredFolders = filteredFolders.filter((f) => f.name.toLowerCase().includes(q));
    filteredFiles = filteredFiles.filter((f) => f.name.toLowerCase().includes(q));
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
  const currentFolder = folders.find((f) => f.id === currentFolderId);
  if (currentFolderId && tab === "drive") {
    let curr = currentFolder;
    const trail: { id: string; name: string }[] = [];
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    breadcrumbs.push(...trail);
  }

  const getTabTitle = () => {
    switch (tab) {
      case "home":
        return "Home";
      case "projects":
        return "Projects";
      case "drive":
        return currentFolder ? currentFolder.name : "My Drive";
      case "computers":
        return "Computers";
      case "shared":
        return "Shared with me";
      case "recent":
        return "Recent";
      case "starred":
        return "Starred";
      case "spam":
        return "Spam";
      case "trash":
        return "Trash";
      case "storage":
        return "Storage";
      default:
        return "Drive";
    }
  };

  // Marquee Drag Selection State
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionCurrent(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest("[data-no-drag]")
    ) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    if (!target.closest("[data-item-id]")) {
      if (!e.shiftKey && !e.ctrlKey) {
        setSelectedIds([]);
      }
    }

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    setSelectionCurrent({ x, y });

    const boxLeft = Math.min(selectionStart.x, x);
    const boxRight = Math.max(selectionStart.x, x);
    const boxTop = Math.min(selectionStart.y, y);
    const boxBottom = Math.max(selectionStart.y, y);

    if (boxRight - boxLeft < 4 && boxBottom - boxTop < 4) return;

    const itemElements = containerRef.current.querySelectorAll("[data-item-id]");
    const newlySelected: string[] = [];

    itemElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.getAttribute("data-item-id");
      if (!id) return;

      const itemLeft = htmlEl.offsetLeft;
      const itemTop = htmlEl.offsetTop;
      const itemRight = itemLeft + htmlEl.offsetWidth;
      const itemBottom = itemTop + htmlEl.offsetHeight;

      const intersects =
        itemLeft < boxRight &&
        itemRight > boxLeft &&
        itemTop < boxBottom &&
        itemBottom > boxTop;

      if (intersects) {
        newlySelected.push(id);
      }
    });

    setSelectedIds(newlySelected);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
  };

  const selectionBox =
    isSelecting && selectionStart && selectionCurrent
      ? {
          left: Math.min(selectionStart.x, selectionCurrent.x),
          top: Math.min(selectionStart.y, selectionCurrent.y),
          width: Math.abs(selectionCurrent.x - selectionStart.x),
          height: Math.abs(selectionCurrent.y - selectionStart.y),
        }
      : null;

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col h-[calc(100vh-4rem)] mr-3 mb-3 bg-[#131314] rounded-[24px] border border-white/[0.04] overflow-hidden select-none"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#004a77]/80 backdrop-blur-md border-2 border-dashed border-[#7CB8F8] rounded-[24px] m-2 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-[#004a77] border border-[#7CB8F8]/50 flex items-center justify-center text-[#c2e7ff] shadow-2xl mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">Drop files to upload</h3>
          <p className="text-sm text-[#c2e7ff] mt-1">
            Uploading to:{" "}
            <span className="font-semibold text-white">
              {currentFolder ? currentFolder.name : "My Drive"}
            </span>
          </p>
          <p className="text-xs text-[#9aa0a6] mt-2">
            Files stored in your connected Telegram cloud storage
          </p>
        </div>
      )}

      {/* Workspace Header: Title & View Switcher */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          {/* Breadcrumbs or Page Title */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tab === "drive" && breadcrumbs.length > 1 ? (
              breadcrumbs.map((b, i) => (
                <React.Fragment key={b.id || "root"}>
                  {i > 0 && <ChevronRight className="w-4 h-4 text-[#9aa0a6]" />}
                  <button
                    onClick={() => setCurrentFolderId(b.id)}
                    className={`flex items-center gap-1 text-lg sm:text-xl font-normal transition rounded-xl px-2 py-1 -ml-1 ${
                      i === breadcrumbs.length - 1
                        ? "text-white hover:bg-white/5"
                        : "text-[#9aa0a6] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{b.name}</span>
                    {i === breadcrumbs.length - 1 && (
                      <ChevronDown className="w-4 h-4 text-[#9aa0a6]" />
                    )}
                  </button>
                </React.Fragment>
              ))
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDriveMenu(!showDriveMenu)}
                  className="text-xl sm:text-[22px] font-normal text-white flex items-center gap-1.5 cursor-pointer hover:bg-white/5 px-2.5 py-1 -ml-2 rounded-xl transition"
                >
                  <span>{getTabTitle()}</span>
                  <ChevronDown className="w-4 h-4 text-[#9aa0a6]" />
                </button>

                {showDriveMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDriveMenu(false)}
                    />
                    <div className="absolute left-0 top-11 z-50 w-72 bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl py-2 text-sm text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100 select-none">
                      <button
                        onClick={() => {
                          setShowDriveMenu(false);
                          onOpenNewFolder?.();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <FolderPlus className="w-4.5 h-4.5 text-[#9aa0a6] group-hover:text-white" />
                          <span className="font-normal text-white">New folder</span>
                        </div>
                        <span className="text-xs text-[#9aa0a6] font-mono">Alt+C then F</span>
                      </button>

                      <div className="my-1.5 border-t border-white/10" />

                      <button
                        onClick={() => {
                          setShowDriveMenu(false);
                          onOpenUpload?.();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <FileUp className="w-4.5 h-4.5 text-[#9aa0a6] group-hover:text-white" />
                          <span className="font-normal text-white">File upload</span>
                        </div>
                        <span className="text-xs text-[#9aa0a6] font-mono">Alt+C then U</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDriveMenu(false);
                          onOpenUpload?.();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <FolderUp className="w-4.5 h-4.5 text-[#9aa0a6] group-hover:text-white" />
                          <span className="font-normal text-white">Folder upload</span>
                        </div>
                        <span className="text-xs text-[#9aa0a6] font-mono">Alt+C then I</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* View Toggle Capsule (✓ ☰ | ⊞) exactly matching screenshot */}
          <div className="flex items-center rounded-full bg-[#1e1f20] border border-[#444746]/60 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#004a77] text-[#c2e7ff] font-semibold"
                  : "text-[#9aa0a6] hover:text-[#e3e3e3]"
              }`}
              title="List view"
            >
              {viewMode === "list" && <Check className="w-3.5 h-3.5" />}
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#004a77] text-[#c2e7ff]"
                  : "text-[#9aa0a6] hover:text-[#e3e3e3]"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips row (Type ▾ | People ▾ | Modified ▾ | Source ▾) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowModifiedDropdown(false);
              }}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-medium ${
                selectedType !== "all"
                  ? "bg-[#004a77] text-[#c2e7ff] border-[#7CB8F8]/40"
                  : "border-[#444746] hover:bg-[#282a2c] text-[#e3e3e3]"
              }`}
            >
              <span>{selectedType === "all" ? "Type" : `Type: ${selectedType}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
            </button>

            {showTypeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowTypeDropdown(false)}
                />
                <div className="absolute left-0 top-9 z-40 w-44 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-xl py-1 text-xs text-[#e3e3e3]">
                  {[
                    { id: "all", label: "All types" },
                    { id: "pdf", label: "PDFs" },
                    { id: "image", label: "Photos & images" },
                    { id: "document", label: "Documents" },
                    { id: "spreadsheet", label: "Spreadsheets" },
                    { id: "video", label: "Videos" },
                    { id: "audio", label: "Audio" },
                    { id: "archive", label: "Archives" },
                    { id: "code", label: "Code" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedType(t.id);
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center justify-between transition ${
                        selectedType === t.id ? "text-[#7CB8F8] font-semibold" : ""
                      }`}
                    >
                      <span>{t.label}</span>
                      {selectedType === t.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* People Filter */}
          <button
            className="px-3 py-1.5 rounded-lg border border-[#444746] hover:bg-[#282a2c] text-[#e3e3e3] flex items-center gap-1.5 transition cursor-pointer font-medium"
            title="Filter by person"
          >
            <span>People</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
          </button>

          {/* Modified Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowModifiedDropdown(!showModifiedDropdown);
                setShowTypeDropdown(false);
              }}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-medium ${
                modifiedFilter !== "all"
                  ? "bg-[#004a77] text-[#c2e7ff] border-[#7CB8F8]/40"
                  : "border-[#444746] hover:bg-[#282a2c] text-[#e3e3e3]"
              }`}
            >
              <span>{modifiedFilter === "all" ? "Modified" : `Modified: ${modifiedFilter}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
            </button>

            {showModifiedDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowModifiedDropdown(false)}
                />
                <div className="absolute left-0 top-9 z-40 w-44 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-xl py-1 text-xs text-[#e3e3e3]">
                  {[
                    { id: "all", label: "All time" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "Last 7 days" },
                    { id: "month", label: "Last 30 days" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModifiedFilter(m.id);
                        setShowModifiedDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center justify-between transition ${
                        modifiedFilter === m.id ? "text-[#7CB8F8] font-semibold" : ""
                      }`}
                    >
                      <span>{m.label}</span>
                      {modifiedFilter === m.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Source Filter */}
          <button
            className="px-3 py-1.5 rounded-lg border border-[#444746] hover:bg-[#282a2c] text-[#e3e3e3] flex items-center gap-1.5 transition cursor-pointer font-medium"
            title="Filter by storage channel"
          >
            <span>Source</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-y-auto px-6 pb-6 relative select-none"
      >
        {/* Marquee Drag Selection Box (matching user screenshot) */}
        {selectionBox && (selectionBox.width > 2 || selectionBox.height > 2) && (
          <div
            className="absolute pointer-events-none z-30 border border-white/70 bg-white/10 rounded-xs shadow-[0_0_8px_rgba(255,255,255,0.08)]"
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
            }}
          />
        )}

        {isEmpty ? (
          <div className="h-full flex items-center justify-center min-h-[50vh]">
            <DriveEmptyIllustration />
          </div>
        ) : viewMode === "grid" ? (
          <FileGrid
            folders={filteredFolders}
            files={filteredFiles}
            selectedIds={selectedIds}
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
            selectedIds={selectedIds}
            onOpenFolder={(id: string) => setCurrentFolderId(id)}
            onPreview={(f: DriveFile) => setPreviewFile(f)}
            onDownload={handleDownload}
            onToggleStar={handleToggleStar}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Floating Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#1e1f20] border border-white/15 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs text-white animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="font-medium text-[#7CB8F8]">
            {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"} selected
          </span>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={() => setSelectedIds([])}
            className="text-[#9aa0a6] hover:text-white transition cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
