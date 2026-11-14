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

    if (!isFolder && file && category === "image" && !thumbUrl) {
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
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3 transition duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/20 overflow-hidden"
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
              ? "text-amber-400 hover:text-amber-300 bg-slate-950/70"
              : "text-slate-400 hover:text-white bg-slate-950/50 opacity-0 group-hover:opacity-100"
          }`}
          title={item.isStarred ? "Unstar" : "Star"}
        >
          <Star className={`w-3.5 h-3.5 ${item.isStarred ? "fill-amber-400" : ""}`} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950/60 backdrop-blur-md hover:bg-slate-800 rounded-lg transition opacity-80 group-hover:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-40 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100">
                {file && onDownload && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDownload(file);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left transition"
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
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(item.id, isFolder);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-950/40 text-rose-400 text-left transition"
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
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1 pr-12">
            <h4
              className="text-sm font-semibold text-slate-200 group-hover:text-white truncate mb-0.5"
              title={folder?.name}
            >
              {folder?.name}
            </h4>
            <span className="text-[11px] text-slate-500">Folder</span>
          </div>
        </div>
      ) : (
        // File Layout
        <>
          {category === "image" ? (
            <div className="w-full h-36 rounded-xl bg-slate-950 border border-slate-800/80 mb-2.5 overflow-hidden relative flex items-center justify-center">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={file?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5 animate-pulse">
                  <FileImage className="w-8 h-8 text-sky-400/50" />
                  <span className="text-[10px] text-slate-500">
                    {isLoadingThumb ? "Loading preview..." : "Image"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2.5 flex items-center justify-center">
              {getIcon()}
            </div>
          )}

          <div className="pt-0.5">
            <h4
              className="text-sm font-medium text-slate-200 group-hover:text-white truncate mb-1"
              title={file?.name}
            >
              {file?.name}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{formatBytes(file?.size || 0)}</span>
              <span>{formatDate(file?.uploadedAt || Date.now())}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
