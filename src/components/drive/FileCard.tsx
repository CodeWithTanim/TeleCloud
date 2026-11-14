import React, { useState } from "react";
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
  ExternalLink,
} from "lucide-react";
import { DriveFile, DriveFolder } from "../../types";
import { formatBytes, formatDate, getFileCategory } from "../../lib/utils/formatters";

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

  const getIcon = () => {
    if (isFolder) return <Folder className="w-8 h-8 text-indigo-400 fill-indigo-400/20" />;
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
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/20"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition">
          {getIcon()}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleStar(item.id, isFolder)}
            className={`p-1.5 rounded-lg transition ${
              item.isStarred
                ? "text-amber-400 hover:text-amber-300"
                : "text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100"
            }`}
            title={item.isStarred ? "Unstar" : "Star"}
          >
            <Star className={`w-4 h-4 ${item.isStarred ? "fill-amber-400" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
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
      </div>

      <div>
        <h4
          className="text-sm font-medium text-slate-200 group-hover:text-white truncate mb-1"
          title={item.name}
        >
          {item.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{isFolder ? "Folder" : formatBytes(file?.size || 0)}</span>
          <span>{formatDate(isFolder ? folder!.updatedAt : file!.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
};
