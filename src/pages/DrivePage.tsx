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
  Folder,
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
  const [pendingModified, setPendingModified] = useState<string>("all");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<number | null>(null);
  const [customEndDate, setCustomEndDate] = useState<number | null>(null);
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
    if (selectedType === "folders") {
      filteredFiles = [];
    } else {
      filteredFolders = [];
      filteredFiles = filteredFiles.filter((f) => {
        const cat = getFileCategory(f.mimeType, f.name);
        const lowerName = f.name.toLowerCase();
        switch (selectedType) {
          case "documents":
            return cat === "document";
          case "spreadsheets":
            return cat === "spreadsheet";
          case "presentations":
            return cat === "presentation";
          case "pics":
          case "photos":
            return cat === "image";
          case "vids":
          case "videos":
            return cat === "video";
          case "markdown":
            return cat === "markdown" || lowerName.endsWith(".md");
          case "html":
            return cat === "html" || lowerName.endsWith(".html") || lowerName.endsWith(".htm");
          case "gemini_gems":
          case "gemini_conv":
            return lowerName.includes("gemini");
          case "forms":
            return lowerName.includes("form");
          case "pdfs":
            return cat === "pdf";
          case "archives":
            return cat === "archive";
          case "audio":
            return cat === "audio";
          case "drawings":
            return cat === "drawing";
          case "sites":
            return lowerName.includes("site");
          case "shortcuts":
            return false;
          default:
            return cat === selectedType;
        }
      });
    }
  }

  // Modified filter chip
  const currentYear = new Date().getFullYear();
  const startOfThisYear = new Date(currentYear, 0, 1).getTime();
  const startOfLastYear = new Date(currentYear - 1, 0, 1).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (modifiedFilter !== "all") {
    if (modifiedFilter === "today") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= oneDay);
    } else if (modifiedFilter === "7days" || modifiedFilter === "week") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= 7 * oneDay);
    } else if (modifiedFilter === "30days" || modifiedFilter === "month") {
      filteredFiles = filteredFiles.filter((f) => now - f.uploadedAt <= 30 * oneDay);
    } else if (modifiedFilter === "this_year") {
      filteredFiles = filteredFiles.filter((f) => f.uploadedAt >= startOfThisYear);
    } else if (modifiedFilter === "last_year") {
      filteredFiles = filteredFiles.filter(
        (f) => f.uploadedAt >= startOfLastYear && f.uploadedAt < startOfThisYear
      );
    } else if (modifiedFilter === "custom" && customStartDate && customEndDate) {
      filteredFiles = filteredFiles.filter(
        (f) => f.uploadedAt >= customStartDate && f.uploadedAt <= customEndDate
      );
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

  const TYPE_OPTIONS = [
    {
      id: "folders",
      label: "Folders",
      icon: <Folder className="w-4.5 h-4.5 text-[#9aa0a6] fill-[#9aa0a6]" />,
    },
    {
      id: "documents",
      label: "Documents",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#2684fc] flex items-center justify-center p-0.5 shadow-xs">
          <div className="w-full flex flex-col gap-0.5 justify-center">
            <div className="w-full h-0.5 bg-white rounded-full" />
            <div className="w-2.5 h-0.5 bg-white rounded-full" />
            <div className="w-2 h-0.5 bg-white rounded-full" />
          </div>
        </div>
      ),
    },
    {
      id: "spreadsheets",
      label: "Spreadsheets",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#00ac47] flex items-center justify-center p-0.5 shadow-xs">
          <div className="w-2.5 h-2.5 border border-white flex items-center justify-center">
            <div className="w-full h-px bg-white" />
          </div>
        </div>
      ),
    },
    {
      id: "presentations",
      label: "Presentations",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ffba00] flex items-center justify-center p-0.5 shadow-xs">
          <div className="w-2.5 h-2 border border-white rounded-[1px]" />
        </div>
      ),
    },
    {
      id: "pics",
      label: "Pics",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-white">
            <path d="M1 13h14l-4.5-6-3.5 4.5-2.5-3z" />
          </svg>
        </div>
      ),
    },
    {
      id: "vids",
      label: "Vids",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#5e35b1] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 fill-white">
            <path d="M4 3l9 5-9 5z" />
          </svg>
        </div>
      ),
    },
    {
      id: "markdown",
      label: "Markdown",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#1976d2] flex items-center justify-center shadow-xs text-white font-bold text-[8px] font-mono leading-none">
          M↓
        </div>
      ),
    },
    {
      id: "html",
      label: "HTML",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#e64a19] flex items-center justify-center shadow-xs text-white font-bold text-[8px] font-mono leading-none">
          &lt;&gt;
        </div>
      ),
    },
    {
      id: "gemini_gems",
      label: "Gemini Gems",
      icon: (
        <div className="w-4.5 h-4.5 flex items-center justify-center text-[#1a73e8]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[#1a73e8] stroke-2">
            <path d="M6 3h12l4 7-10 11L2 10z" />
          </svg>
        </div>
      ),
    },
    {
      id: "gemini_conv",
      label: "Gemini Conversations",
      icon: (
        <div className="w-4.5 h-4.5 flex items-center justify-center text-[#1a73e8]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1a73e8]">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5z" />
          </svg>
        </div>
      ),
    },
    {
      id: "forms",
      label: "Forms",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#7248b9] flex items-center justify-center p-0.5 shadow-xs">
          <div className="flex flex-col gap-0.5 w-2.5">
            <div className="w-full h-0.5 bg-white rounded-full" />
            <div className="w-full h-0.5 bg-white rounded-full" />
          </div>
        </div>
      ),
    },
    {
      id: "photos",
      label: "Photos & images",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      ),
    },
    {
      id: "pdfs",
      label: "PDFs",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center shadow-xs text-white font-black text-[7px] tracking-tighter">
          PDF
        </div>
      ),
    },
    {
      id: "videos",
      label: "Videos",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
        </div>
      ),
    },
    {
      id: "archives",
      label: "Archives (zip)",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#607d8b] flex items-center justify-center p-0.5 shadow-xs">
          <div className="w-1.5 h-3 border-x border-dashed border-white/80" />
        </div>
      ),
    },
    {
      id: "audio",
      label: "Audio",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 3a9 9 0 00-9 9v7c0 1.1.9 2 2 2h2v-8H5v-1a7 7 0 0114 0v1h-2v8h2c1.1 0 2-.9 2-2v-7a9 9 0 00-9-9z" />
          </svg>
        </div>
      ),
    },
    {
      id: "drawings",
      label: "Drawings",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#ea4335] flex items-center justify-center p-0.5 shadow-xs">
          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-white">
            <circle cx="5" cy="5" r="3" />
            <rect x="7" y="7" width="6" height="6" rx="0.5" />
          </svg>
        </div>
      ),
    },
    {
      id: "sites",
      label: "Sites",
      icon: (
        <div className="w-4.5 h-4.5 rounded-[4px] bg-[#5c6bc0] flex items-center justify-center p-0.5 shadow-xs">
          <div className="w-2.5 h-2 border border-white flex flex-col justify-between">
            <div className="w-full h-0.5 bg-white" />
          </div>
        </div>
      ),
    },
    {
      id: "shortcuts",
      label: "Shortcuts",
      icon: (
        <div className="w-4.5 h-4.5 flex items-center justify-center text-[#9aa0a6]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
            <path d="M9 14l-4-4 4-4" />
            <path d="M5 10h11a4 4 0 110 8h-1" />
          </svg>
        </div>
      ),
    },
  ];

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
              <span>
                {selectedType === "all"
                  ? "Type"
                  : `Type: ${TYPE_OPTIONS.find((t) => t.id === selectedType)?.label || selectedType}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
            </button>

            {showTypeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowTypeDropdown(false)}
                />
                <div className="absolute left-0 top-9 z-40 w-60 max-h-[70vh] overflow-y-auto bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl py-2 text-sm text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100 select-none">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedType(selectedType === t.id ? "all" : t.id);
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 flex items-center justify-between transition cursor-pointer ${
                        selectedType === t.id ? "bg-[#004a77]/35 text-white font-medium" : "text-[#e3e3e3]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="shrink-0">{t.icon}</span>
                        <span className="truncate">{t.label}</span>
                      </div>
                      {selectedType === t.id && (
                        <Check className="w-3.5 h-3.5 text-[#7CB8F8] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Modified Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowModifiedDropdown(!showModifiedDropdown);
                setPendingModified(modifiedFilter);
                setShowTypeDropdown(false);
              }}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-medium ${
                modifiedFilter !== "all"
                  ? "bg-[#004a77] text-[#c2e7ff] border-[#7CB8F8]/40"
                  : "border-[#444746] hover:bg-[#282a2c] text-[#e3e3e3]"
              }`}
            >
              <span>
                {modifiedFilter === "today"
                  ? "Modified: Today"
                  : modifiedFilter === "7days" || modifiedFilter === "week"
                  ? "Modified: Last 7 days"
                  : modifiedFilter === "30days" || modifiedFilter === "month"
                  ? "Modified: Last 30 days"
                  : modifiedFilter === "this_year"
                  ? `Modified: This year (${currentYear})`
                  : modifiedFilter === "last_year"
                  ? `Modified: Last year (${currentYear - 1})`
                  : modifiedFilter === "custom"
                  ? "Modified: Custom range"
                  : "Modified"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
            </button>

            {showModifiedDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowModifiedDropdown(false)}
                />
                <div className="absolute left-0 top-9 z-40 w-64 bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl py-2 text-sm text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100 select-none">
                  {[
                    { id: "today", label: "Today" },
                    { id: "7days", label: "Last 7 days" },
                    { id: "30days", label: "Last 30 days" },
                    { id: "this_year", label: `This year (${currentYear})` },
                    { id: "last_year", label: `Last year (${currentYear - 1})` },
                  ].map((m) => {
                    const isSelected = pendingModified === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPendingModified(m.id)}
                        className={`w-full text-left px-4 py-2 hover:bg-white/10 flex items-center justify-between transition cursor-pointer ${
                          isSelected ? "bg-[#004a77]/35 text-white font-medium" : "text-[#e3e3e3]"
                        }`}
                      >
                        <span>{m.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7CB8F8]" />}
                      </button>
                    );
                  })}

                  {/* Custom date range */}
                  <button
                    onClick={() => {
                      setPendingModified("custom");
                      setShowCustomRange(!showCustomRange);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-white/10 flex items-center justify-between transition cursor-pointer ${
                      pendingModified === "custom"
                        ? "bg-[#004a77]/35 text-white font-medium"
                        : "text-[#e3e3e3]"
                    }`}
                  >
                    <span>Custom date range</span>
                    <ChevronRight className="w-4 h-4 text-[#9aa0a6]" />
                  </button>

                  {/* Custom Range Inputs */}
                  {showCustomRange && (
                    <div className="p-3 mx-2 my-1.5 bg-[#141517] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#9aa0a6] w-10">From:</span>
                        <input
                          type="date"
                          onChange={(e) =>
                            setCustomStartDate(
                              e.target.value ? new Date(e.target.value).getTime() : null
                            )
                          }
                          className="bg-[#1e1f20] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#9aa0a6] w-10">To:</span>
                        <input
                          type="date"
                          onChange={(e) =>
                            setCustomEndDate(
                              e.target.value ? new Date(e.target.value).getTime() + 86400000 : null
                            )
                          }
                          className="bg-[#1e1f20] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer (Clear all | Cancel | Apply) matching screenshot */}
                  <div className="mt-2 pt-2.5 border-t border-white/10 px-4 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setModifiedFilter("all");
                        setPendingModified("all");
                        setShowCustomRange(false);
                        setShowModifiedDropdown(false);
                      }}
                      className="text-[#9aa0a6] hover:text-white transition cursor-pointer"
                    >
                      Clear all
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowModifiedDropdown(false)}
                        className="text-[#7CB8F8] hover:underline font-medium transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setModifiedFilter(pendingModified);
                          setShowModifiedDropdown(false);
                        }}
                        className="text-white hover:text-[#7CB8F8] font-medium transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
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
