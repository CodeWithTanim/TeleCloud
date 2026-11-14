import React from "react";
import {
  Folder,
  File as FileIcon,
  Star,
  Download,
  Trash2,
  Edit2,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileText,
} from "lucide-react";
import { DriveFile, DriveFolder } from "../../types";
import { formatBytes, formatDate, getFileCategory } from "../../lib/utils/formatters";

interface FileListProps {
  folders: DriveFolder[];
  files: DriveFile[];
  selectedIds?: string[];
  onOpenFolder: (folderId: string) => void;
  onPreview: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
}

export const FileList: React.FC<FileListProps> = ({
  folders,
  files,
  selectedIds = [],
  onOpenFolder,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onDelete,
}) => {
  const getIcon = (item: DriveFile | DriveFolder, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-5 h-5 text-[#9aa0a6] fill-[#9aa0a6]/20" />;
    const file = item as DriveFile;
    const cat = getFileCategory(file.mimeType, file.name);
    switch (cat) {
      case "image":
        return <FileImage className="w-5 h-5 text-[#ea4335]" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-[#ea4335]" />;
      case "video":
        return <FileVideo className="w-5 h-5 text-[#ea4335]" />;
      case "audio":
        return <FileAudio className="w-5 h-5 text-[#f4b400]" />;
      case "archive":
        return <FileArchive className="w-5 h-5 text-[#f4b400]" />;
      case "code":
        return <FileCode className="w-5 h-5 text-[#0f9d58]" />;
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-[#0f9d58]" />;
      case "document":
        return <FileText className="w-5 h-5 text-[#4285f4]" />;
      default:
        return <FileIcon className="w-5 h-5 text-[#9aa0a6]" />;
    }
  };

  return (
    <div className="w-full text-sm select-none">
      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.08] text-xs font-medium text-[#9aa0a6]">
        <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
          <span>Name</span>
        </div>
        <div className="hidden sm:block sm:col-span-2">Owner</div>
        <div className="col-span-3 sm:col-span-3">Last modified</div>
        <div className="col-span-3 sm:col-span-2 text-right pr-2">File size</div>
      </div>

      {/* Folders */}
      {folders.map((f) => {
        const isSelected = selectedIds.includes(f.id);
        return (
          <div
            key={f.id}
            data-item-id={f.id}
            onClick={() => onOpenFolder(f.id)}
            className={`grid grid-cols-12 px-4 py-3 items-center border-b border-white/[0.04] cursor-pointer transition group ${
              isSelected
                ? "bg-[#004a77]/35 ring-1 ring-[#7CB8F8]/60"
                : "hover:bg-[#1e1f20]"
            }`}
          >
            <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-4">
              {getIcon(f, true)}
              <span className="font-medium text-[#e3e3e3] group-hover:text-white truncate">
                {f.name}
              </span>
            </div>
            <div className="hidden sm:block sm:col-span-2 text-xs text-[#9aa0a6]">me</div>
            <div className="col-span-3 sm:col-span-3 text-xs text-[#9aa0a6]">
              {formatDate(f.updatedAt)}
            </div>
            <div
              className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-[#9aa0a6] mr-2">—</span>
              <button
                onClick={() => onToggleStar(f.id, true)}
                className={`p-1.5 rounded-full transition ${
                  f.isStarred
                    ? "text-[#f4b400]"
                    : "text-[#9aa0a6] hover:text-white opacity-0 group-hover:opacity-100"
                }`}
                title={f.isStarred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${f.isStarred ? "fill-[#f4b400]" : ""}`} />
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Rename folder:", f.name);
                  if (newName && newName.trim()) onRename(f.id, newName.trim(), true);
                }}
                className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100"
                title="Rename"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(f.id, true)}
                className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Files */}
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);
        return (
          <div
            key={file.id}
            data-item-id={file.id}
            onClick={() => onPreview(file)}
            className={`grid grid-cols-12 px-4 py-3 items-center border-b border-white/[0.04] cursor-pointer transition group ${
              isSelected
                ? "bg-[#004a77]/35 ring-1 ring-[#7CB8F8]/60"
                : "hover:bg-[#1e1f20]"
            }`}
          >
            <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-4">
              {getIcon(file, false)}
              <span className="font-normal text-[#e3e3e3] group-hover:text-white truncate">
                {file.name}
              </span>
            </div>
            <div className="hidden sm:block sm:col-span-2 text-xs text-[#9aa0a6]">me</div>
            <div className="col-span-3 sm:col-span-3 text-xs text-[#9aa0a6]">
              {formatDate(file.uploadedAt)}
            </div>
            <div
              className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-[#9aa0a6] mr-2">{formatBytes(file.size)}</span>
              <button
                onClick={() => onToggleStar(file.id, false)}
                className={`p-1.5 rounded-full transition ${
                  file.isStarred
                    ? "text-[#f4b400]"
                    : "text-[#9aa0a6] hover:text-white opacity-0 group-hover:opacity-100"
                }`}
                title={file.isStarred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${file.isStarred ? "fill-[#f4b400]" : ""}`} />
              </button>
              <button
                onClick={() => onDownload(file)}
                className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Rename file:", file.name);
                  if (newName && newName.trim()) onRename(file.id, newName.trim(), false);
                }}
                className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100"
                title="Rename"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(file.id, false)}
                className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
