import React from "react";
import { DriveFile, DriveFolder } from "../../types";
import { FileCard } from "./FileCard";

interface FileGridProps {
  folders: DriveFolder[];
  files: DriveFile[];
  selectedIds?: string[];
  onOpenFolder: (folderId: string) => void;
  onPreview: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
  onRestore?: (id: string, isFolder: boolean) => void;
  onTogglePin?: (folderId: string) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  folders,
  files,
  selectedIds = [],
  onOpenFolder,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onDelete,
  onRestore,
  onTogglePin,
}) => {
  return (
    <div className="space-y-6 pt-1">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#9aa0a6] mb-3 select-none">
            Folders
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <FileCard
                key={folder.id}
                item={folder}
                isFolder={true}
                isSelected={selectedIds.includes(folder.id)}
                onOpenFolder={onOpenFolder}
                onToggleStar={onToggleStar}
                onRename={onRename}
                onDelete={onDelete}
                onRestore={onRestore}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#9aa0a6] mb-3 select-none">
            Files
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                item={file}
                isFolder={false}
                isSelected={selectedIds.includes(file.id)}
                onPreview={onPreview}
                onDownload={onDownload}
                onToggleStar={onToggleStar}
                onRename={onRename}
                onDelete={onDelete}
                onRestore={onRestore}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
