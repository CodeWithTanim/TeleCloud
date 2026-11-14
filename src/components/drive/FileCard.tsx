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
} from "lucide-react";
import { DriveFile, DriveFolder } from "../../types";
import { formatBytes, formatDate, getFileCategory } from "../../lib/utils/formatters";
import { getOrFetchThumbnail } from "../../lib/telegram/downloader";

interface FileCardProps {
  item: DriveFile | DriveFolder;
  isFolder: boolean;
  onOpenFolder?: (folderId: string) => void;
  onPreview?: (file: DriveFile) => void;
  onDownload?: (file: DriveFile) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  item,
  isFolder,
  onOpenFolder,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const file = isFolder ? null : (item as DriveFile);
  const folder = isFolder ? (item as DriveFolder) : null;
  const category = file ? getFileCategory(file.mimeType, file.name) : "folder";

  const [thumbUrl, setThumbUrl] = useState<string | null>(file?.thumbnail || null);
  const [isLoadingThumb, setIsLoadingThumb] = useState(false);

  useEffect(() => {
    if (file?.thumbnail) {
      setThumbUrl(file.thumbnail);
      return;
    }

    if (!isFolder && file && (category === "image" || category === "pdf") && !thumbUrl) {
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

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#1e1f20] hover:bg-[#282a2c] border border-white/[0.04] hover:border-white/[0.12] rounded-2xl p-3 transition duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg overflow-hidden"
    >
      {/* Top action buttons (Star & Menu) */}
      <div
        className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
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
              <div className="absolute right-0 top-8 z-40 w-44 bg-[#1e1f20] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                {file && onDownload && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDownload(file);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    const newName = prompt("Rename item:", item.name);
                    if (newName && newName.trim()) {
                      onRename(item.id, newName.trim(), isFolder);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(item.id, isFolder);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-500/10 text-rose-400 text-left transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
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
          {category === "image" || (category === "pdf" && thumbUrl) ? (
            <div className="w-full h-36 rounded-xl bg-[#0a0b0d] border border-white/[0.06] mb-2.5 overflow-hidden relative flex items-center justify-center">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={file?.name}
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
            // Dedicated PDF preview card
            <div className="w-full h-36 rounded-xl bg-gradient-to-b from-rose-950/20 via-[#16171a] to-[#121315] border border-rose-500/25 mb-2.5 p-3 flex flex-col justify-between relative overflow-hidden group-hover:border-rose-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px] tracking-wider uppercase">
                  PDF
                </span>
                <span className="text-[10px] text-neutral-400">Document</span>
              </div>
              <div className="flex items-center justify-center py-1">
                <div className="w-14 h-16 bg-[#1f2025] border border-white/[0.08] rounded-lg shadow-md p-2 flex flex-col justify-between group-hover:scale-105 transition-transform">
                  <div className="w-5 h-1 bg-rose-400/90 rounded-full" />
                  <div className="space-y-1">
                    <div className="w-full h-0.5 bg-neutral-600 rounded-full" />
                    <div className="w-4/5 h-0.5 bg-neutral-600 rounded-full" />
                    <div className="w-3/5 h-0.5 bg-neutral-600 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-rose-300/80 text-center font-medium">
                Click to open & read PDF
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
