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
  onOpenFolder,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onDelete,
}) => {
  const getIcon = (item: DriveFile | DriveFolder, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />;
    const file = item as DriveFile;
    const cat = getFileCategory(file.mimeType, file.name);
    switch (cat) {
      case "image":
        return <FileImage className="w-5 h-5 text-sky-400" />;
      case "video":
        return <FileVideo className="w-5 h-5 text-rose-400" />;
      case "audio":
        return <FileAudio className="w-5 h-5 text-amber-400" />;
      case "archive":
        return <FileArchive className="w-5 h-5 text-orange-400" />;
      case "code":
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case "document":
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-800/60">
        {folders.map((f) => (
          <div
            key={f.id}
            onClick={() => onOpenFolder(f.id)}
            className="grid grid-cols-12 px-5 py-3 items-center text-sm hover:bg-slate-800/40 cursor-pointer transition group"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0 pr-4">
              {getIcon(f, true)}
              <span className="font-medium text-slate-200 group-hover:text-white truncate">
                {f.name}
              </span>
            </div>
            <div className="col-span-2 text-xs text-slate-500">—</div>
            <div className="col-span-2 text-xs text-slate-500">{formatDate(f.updatedAt)}</div>
            <div
              className="col-span-2 flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onToggleStar(f.id, true)}
                className={`p-1.5 rounded-lg transition ${
                  f.isStarred ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title={f.isStarred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${f.isStarred ? "fill-amber-400" : ""}`} />
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Rename folder:", f.name);
                  if (newName && newName.trim()) onRename(f.id, newName.trim(), true);
                }}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(f.id, true)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onPreview(file)}
            className="grid grid-cols-12 px-5 py-3 items-center text-sm hover:bg-slate-800/40 cursor-pointer transition group"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0 pr-4">
              {getIcon(file, false)}
              <span className="font-medium text-slate-200 group-hover:text-white truncate">
                {file.name}
              </span>
            </div>
            <div className="col-span-2 text-xs text-slate-400">{formatBytes(file.size)}</div>
            <div className="col-span-2 text-xs text-slate-500">{formatDate(file.uploadedAt)}</div>
            <div
              className="col-span-2 flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onDownload(file)}
                className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleStar(file.id, false)}
                className={`p-1.5 rounded-lg transition ${
                  file.isStarred ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title={file.isStarred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${file.isStarred ? "fill-amber-400" : ""}`} />
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Rename file:", file.name);
                  if (newName && newName.trim()) onRename(file.id, newName.trim(), false);
                }}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(file.id, false)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
