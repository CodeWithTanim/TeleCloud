import React from "react";
import { Folder, File as FileIcon } from "lucide-react";
import { DriveFile, DriveFolder } from "../../types";
import { FileCard } from "./FileCard";

interface FileGridProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onOpenFolder: (folderId: string) => void;
  onPreview: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  folders,
  files,
  onOpenFolder,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onDelete,
}) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
          <Folder className="w-8 h-8" />
        </div>
        <p className="text-base font-medium text-slate-400">This folder is empty</p>
        <p className="text-xs text-slate-500 mt-1">Upload a file or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Folders ({folders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {folders.map((folder) => (
              <FileCard
                key={folder.id}
                item={folder}
                isFolder={true}
                onOpenFolder={onOpenFolder}
                onToggleStar={onToggleStar}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Files ({files.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {files.map((file) => (
              <FileCard
                key={file.id}
                item={file}
                isFolder={false}
                onPreview={onPreview}
                onDownload={onDownload}
                onToggleStar={onToggleStar}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
