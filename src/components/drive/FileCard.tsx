import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File as FileIcon,
  Star,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  RotateCcw,
  Pin,
  PinOff,
  FolderInput,
} from "lucide-react";
import { DriveFile, DriveFolder } from "../../types";
import { formatBytes, formatDate, getFileCategory } from "../../lib/utils/formatters";
import { getOrFetchThumbnail } from "../../lib/telegram/downloader";

interface FileCardProps {
  item: DriveFile | DriveFolder;
  isFolder: boolean;
  isSelected?: boolean;
  onOpenFolder?: (folderId: string) => void;
  onPreview?: (file: DriveFile) => void;
  onDownload?: (file: DriveFile) => void;
  onDownloadFolder?: (folder: DriveFolder) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
  onRestore?: (id: string, isFolder: boolean) => void;
  onTogglePin?: (folderId: string) => void;
  onMove?: (id: string, name: string, isFolder: boolean, currentParentId: string | null) => void;
  onDropItemOnFolder?: (targetFolderId: string, droppedItemId: string, isDroppedFolder: boolean) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  item,
  isFolder,
  isSelected = false,
  onOpenFolder,
  onPreview,
  onDownload,
  onDownloadFolder,
  onToggleStar,
  onRename,
  onDelete,
  onRestore,
  onTogglePin,
  onMove,
  onDropItemOnFolder,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragTarget, setIsDragTarget] = useState(false);

  const file = isFolder ? null : (item as DriveFile);
  const folder = isFolder ? (item as DriveFolder) : null;
  const category = file ? getFileCategory(file.mimeType, file.name) : "folder";

  const [thumbUrl, setThumbUrl] = useState<string | null>(
    category === "image" ? file?.thumbnail || null : null
  );
  const [isLoadingThumb, setIsLoadingThumb] = useState(false);

  useEffect(() => {
    if (category !== "image") return;

    if (file?.thumbnail) {
      setThumbUrl(file.thumbnail);
      return;
    }

    if (!isFolder && file && !thumbUrl) {
      setIsLoadingThumb(true);
      getOrFetchThumbnail(file.channelId, file.messageId, file.mimeType)
        .then((url) => {
          if (url) setThumbUrl(url);
        })
        .finally(() => {
          setIsLoadingThumb(false);
        });
    }
  }, [file?.thumbnail, file?.channelId, file?.messageId, file?.mimeType, isFolder, category, thumbUrl]);

  const getIcon = () => {
    if (isFolder) return <Folder className="w-7 h-7 text-indigo-400 fill-indigo-400/20" />;
    switch (category) {
      case "image":
        return <FileImage className="w-8 h-8 text-sky-400" />;
      case "pdf":
        return <FileText className="w-8 h-8 text-rose-400" />;
      case "video":
        return <FileVideo className="w-8 h-8 text-rose-400" />;
      case "audio":
        return <FileAudio className="w-8 h-8 text-amber-400" />;
      case "archive":
        return <FileArchive className="w-8 h-8 text-orange-400" />;
      case "code":
        return <FileCode className="w-8 h-8 text-emerald-400" />;
      case "document":
      case "spreadsheet":
        return <FileText className="w-8 h-8 text-blue-400" />;
      default:
        return <FileIcon className="w-8 h-8 text-slate-400" />;
    }
  };

  const handleCardClick = () => {
    if (isFolder && folder && onOpenFolder) {
      onOpenFolder(folder.id);
    } else if (file && onPreview) {
      onPreview(file);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (item.isDeleted) return;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: item.id,
        name: item.name,
        isFolder,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder || item.isDeleted) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!isDragTarget) setIsDragTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isFolder || item.isDeleted) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragTarget(false);

    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;
    try {
      const data = JSON.parse(rawData);
      if (data && data.id && onDropItemOnFolder) {
        onDropItemOnFolder(item.id, data.id, Boolean(data.isFolder));
      }
    } catch (err) {
      console.warn("[FileCard] Drop parse error:", err);
    }
  };

  return (
    <div
      data-item-id={item.id}
      draggable={!item.isDeleted}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(true);
      }}
      className={`group relative rounded-2xl p-3 transition duration-200 cursor-pointer flex flex-col justify-between ${
        showMenu ? "z-50 overflow-visible" : isFolder ? "overflow-visible" : "overflow-hidden"
      } ${
        isDragTarget
          ? "bg-[#004a77]/60 border-2 border-[#7CB8F8] ring-4 ring-[#7CB8F8]/40 scale-[1.02] shadow-2xl"
          : isSelected
          ? "bg-[#004a77]/35 border border-[#7CB8F8]/60 ring-2 ring-[#7CB8F8]/40 shadow-lg shadow-black/40"
          : "bg-[#1e1f20] hover:bg-[#282a2c] border border-white/[0.04] hover:border-white/[0.12] hover:shadow-lg"
      }`}
    >
      {/* Top action buttons (Pin, Star & Menu) */}
      <div
        className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {isFolder && folder?.isPinned && !item.isDeleted && (
          <div
            className="p-1.5 rounded-lg text-[#7CB8F8] bg-black/60 backdrop-blur-md"
            title="Pinned to sidebar"
          >
            <Pin className="w-3.5 h-3.5 fill-[#7CB8F8]/40" />
          </div>
        )}

        <button
          onClick={() => onToggleStar(item.id, isFolder)}
          className={`p-1.5 rounded-lg transition backdrop-blur-md ${
            item.isStarred
              ? "text-[#f4b400] bg-black/60"
              : "text-[#9aa0a6] hover:text-white bg-black/40 opacity-0 group-hover:opacity-100"
          }`}
          title={item.isStarred ? "Unstar" : "Star"}
        >
          <Star className={`w-3.5 h-3.5 ${item.isStarred ? "fill-[#f4b400]" : ""}`} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-[#9aa0a6] hover:text-white bg-black/50 backdrop-blur-md hover:bg-neutral-800 rounded-lg transition opacity-80 group-hover:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-44 bg-[#1e1f20] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                {/* Download option (Folder = Zip download, File = direct download) */}
                {isFolder && folder && onDownloadFolder && !item.isDeleted && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDownloadFolder(folder);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                  >
                    <Download className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white" />
                    <span>Download</span>
                  </button>
                )}
                {!isFolder && file && onDownload && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDownload(file);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                  >
                    <Download className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white" />
                    <span>Download</span>
                  </button>
                )}

                {/* Rename option */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRename(item.id, item.name, isFolder);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white" />
                  <span>Rename</span>
                </button>

                {/* Move option */}
                {onMove && !item.isDeleted && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      const currentParentId = isFolder ? folder?.parentId || null : file?.folderId || null;
                      onMove(item.id, item.name, isFolder, currentParentId);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white" />
                    <span>Move</span>
                  </button>
                )}

                {/* Pin to sidebar option for folders */}
                {isFolder && onTogglePin && !item.isDeleted && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin(item.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                  >
                    {(item as DriveFolder).isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-sky-400" />
                        <span>Unpin from sidebar</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white" />
                        <span>Pin to sidebar</span>
                      </>
                    )}
                  </button>
                )}

                {/* Star / Unstar option */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleStar(item.id, isFolder);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition cursor-pointer group"
                >
                  <Star className={`w-3.5 h-3.5 ${item.isStarred ? "text-[#f4b400] fill-[#f4b400]" : "text-[#9aa0a6] group-hover:text-white"}`} />
                  <span>{item.isStarred ? "Remove from Starred" : "Add to Starred"}</span>
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-white/10" />

                {/* Move to trash / Delete forever */}
                {item.isDeleted ? (
                  <>
                    {onRestore && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onRestore(item.id, isFolder);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#7CB8F8]/10 text-[#7CB8F8] text-left transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(item.id, isFolder);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/10 text-rose-400 text-left transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete forever</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(item.id, isFolder);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/10 text-rose-400 text-left transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to trash</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      {isFolder ? (
        // Folder Layout
        <div className="flex items-center gap-3 py-1">
          <div className="p-2.5 rounded-xl bg-[#18191B] border border-white/[0.06] group-hover:border-white/[0.12] transition shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1 pr-12">
            <h4
              className="text-sm font-semibold text-white truncate mb-0.5"
              title={folder?.name}
            >
              {folder?.name}
            </h4>
            <span className="text-[11px] text-neutral-500">Folder</span>
          </div>
        </div>
      ) : (
        // File Layout
        <>
          {category === "image" ? (
            <div className="w-full h-36 rounded-xl bg-[#0a0b0d] border border-white/[0.06] mb-2.5 overflow-hidden relative flex items-center justify-center">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={file?.name}
                  onError={() => setThumbUrl(null)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-500 gap-1.5 animate-pulse">
                  <FileImage className="w-8 h-8 text-sky-400/50" />
                  <span className="text-[10px] text-neutral-500">
                    {isLoadingThumb ? "Loading preview..." : "Image"}
                  </span>
                </div>
              )}
            </div>
          ) : category === "pdf" ? (
            // Dedicated Google Drive PDF document card preview
            <div className="w-full h-36 rounded-xl bg-[#0e0e0e] border border-rose-500/20 hover:border-rose-500/40 mb-2.5 p-2.5 flex items-center justify-center relative overflow-hidden transition group">
              <div className="w-24 h-28 bg-[#1e1f20] border border-white/10 rounded-lg shadow-xl p-2.5 flex flex-col justify-between group-hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" /> PDF
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </div>
                <div className="space-y-1.5 px-0.5">
                  <div className="w-full h-1 bg-neutral-600/70 rounded-full" />
                  <div className="w-4/5 h-1 bg-neutral-600/50 rounded-full" />
                  <div className="w-5/6 h-1 bg-neutral-600/60 rounded-full" />
                  <div className="w-2/3 h-1 bg-neutral-600/40 rounded-full" />
                </div>
                <div className="text-[9px] text-rose-300/90 text-center font-medium bg-rose-500/10 rounded py-0.5">
                  Click to open
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl bg-[#0a0b0d] border border-white/[0.06] mb-2.5 flex items-center justify-center">
              {getIcon()}
            </div>
          )}

          <div className="pt-0.5">
            <h4
              className="text-sm font-medium text-white truncate mb-1"
              title={file?.name}
            >
              {file?.name}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>{formatBytes(file?.size || 0)}</span>
              <span>{formatDate(file?.uploadedAt || Date.now())}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
