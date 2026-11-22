import React, { useState } from "react";
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
  RotateCcw,
  Pin,
  PinOff,
  MoreVertical,
  FolderInput,
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
  onDownloadFolder?: (folder: DriveFolder) => void;
  onToggleStar: (id: string, isFolder: boolean) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onDelete: (id: string, isFolder: boolean) => void;
  onRestore?: (id: string, isFolder: boolean) => void;
  onTogglePin?: (folderId: string) => void;
  onMove?: (id: string, name: string, isFolder: boolean, currentParentId: string | null) => void;
  onDropItemOnFolder?: (targetFolderId: string, droppedItemId: string, isDroppedFolder: boolean) => void;
}

export const FileList: React.FC<FileListProps> = ({
  folders,
  files,
  selectedIds = [],
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const getIcon = (item: DriveFile | DriveFolder, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-5 h-5 text-[#9aa0a6] fill-[#9aa0a6]/20 shrink-0" />;
    const file = item as DriveFile;
    const cat = getFileCategory(file.mimeType, file.name);
    switch (cat) {
      case "image":
        return <FileImage className="w-5 h-5 text-[#ea4335] shrink-0" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-[#ea4335] shrink-0" />;
      case "video":
        return <FileVideo className="w-5 h-5 text-[#ea4335] shrink-0" />;
      case "audio":
        return <FileAudio className="w-5 h-5 text-[#f4b400] shrink-0" />;
      case "archive":
        return <FileArchive className="w-5 h-5 text-[#f4b400] shrink-0" />;
      case "code":
        return <FileCode className="w-5 h-5 text-[#0f9d58] shrink-0" />;
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-[#0f9d58] shrink-0" />;
      case "document":
        return <FileText className="w-5 h-5 text-[#4285f4] shrink-0" />;
      default:
        return <FileIcon className="w-5 h-5 text-[#9aa0a6] shrink-0" />;
    }
  };

  return (
    <div className="w-full text-sm select-none">
      {/* Table Header */}
      <div className="grid grid-cols-12 px-3 sm:px-4 py-2 border-b border-white/[0.08] text-xs font-medium text-[#9aa0a6]">
        <div className="col-span-8 sm:col-span-5 flex items-center gap-2">
          <span>Name</span>
        </div>
        <div className="hidden sm:block sm:col-span-2">Owner</div>
        <div className="hidden sm:block sm:col-span-3">Last modified</div>
        <div className="col-span-4 sm:col-span-2 text-right pr-2">File size</div>
      </div>

      {/* Folders */}
      {folders.map((f) => {
        const isSelected = selectedIds.includes(f.id);
        const isMenuOpen = activeMenuId === f.id;
        const isDragOver = dragOverFolderId === f.id;

        return (
          <div
            key={f.id}
            data-item-id={f.id}
            draggable={!f.isDeleted}
            onDragStart={(e) => {
              if (f.isDeleted) return;
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ id: f.id, name: f.name, isFolder: true })
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (f.isDeleted) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              if (dragOverFolderId !== f.id) setDragOverFolderId(f.id);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragOverFolderId === f.id) setDragOverFolderId(null);
            }}
            onDrop={(e) => {
              if (f.isDeleted) return;
              e.preventDefault();
              e.stopPropagation();
              setDragOverFolderId(null);
              const rawData = e.dataTransfer.getData("application/json");
              if (!rawData) return;
              try {
                const data = JSON.parse(rawData);
                if (data && data.id && onDropItemOnFolder) {
                  onDropItemOnFolder(f.id, data.id, Boolean(data.isFolder));
                }
              } catch (err) {
                console.warn("[FileList] Drop parse error:", err);
              }
            }}
            onClick={() => onOpenFolder(f.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveMenuId(f.id);
            }}
            className={`grid grid-cols-12 px-3 sm:px-4 py-2.5 sm:py-3 items-center border-b border-white/[0.04] cursor-pointer transition group relative ${
              isDragOver
                ? "bg-[#004a77]/60 ring-2 ring-[#7CB8F8] scale-[1.005]"
                : isSelected
                ? "bg-[#004a77]/35 ring-1 ring-[#7CB8F8]/60"
                : "hover:bg-[#1e1f20]"
            }`}
          >
            <div className="col-span-8 sm:col-span-5 flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              {getIcon(f, true)}
              <div className="min-w-0 flex flex-col">
                <span className="font-medium text-[#e3e3e3] group-hover:text-white truncate">
                  {f.name}
                </span>
                <span className="text-[11px] text-[#9aa0a6] sm:hidden truncate">
                  {formatDate(f.updatedAt)}
                </span>
              </div>
            </div>

            <div className="hidden sm:block sm:col-span-2 text-xs text-[#9aa0a6]">me</div>
            <div className="hidden sm:block sm:col-span-3 text-xs text-[#9aa0a6]">
              {formatDate(f.updatedAt)}
            </div>

            <div
              className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-[#9aa0a6] mr-1 hidden sm:inline">—</span>

              {/* Desktop Quick Actions */}
              <div className="hidden sm:flex items-center gap-1">
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

                {f.isDeleted ? (
                  <>
                    {onRestore && (
                      <button
                        onClick={() => onRestore(f.id, true)}
                        className="p-1.5 text-[#7CB8F8] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(f.id, true)}
                      className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete forever"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    {onDownloadFolder && (
                      <button
                        onClick={() => onDownloadFolder(f)}
                        className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Download folder as ZIP"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onTogglePin && (
                      <button
                        onClick={() => onTogglePin(f.id)}
                        className={`p-1.5 rounded-full transition cursor-pointer ${
                          f.isPinned
                            ? "text-[#7CB8F8] opacity-100"
                            : "text-[#9aa0a6] hover:text-white opacity-0 group-hover:opacity-100"
                        }`}
                        title={f.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                      >
                        <Pin className={`w-3.5 h-3.5 ${f.isPinned ? "fill-[#7CB8F8]/40" : ""}`} />
                      </button>
                    )}
                    <button
                      onClick={() => onRename(f.id, f.name, true)}
                      className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(f.id, true)}
                      className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile 3-Dots Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenuId(isMenuOpen ? null : f.id)}
                  className="p-1.5 text-[#9aa0a6] hover:text-white rounded-lg transition"
                  aria-label="Folder options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveMenuId(null)}
                    />
                    <div className="absolute right-0 top-8 z-50 w-48 bg-[#1e1f20] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleStar(f.id, true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                      >
                        <Star className={`w-3.5 h-3.5 ${f.isStarred ? "text-[#f4b400] fill-[#f4b400]" : "text-[#9aa0a6]"}`} />
                        <span>{f.isStarred ? "Remove from Starred" : "Add to Starred"}</span>
                      </button>

                      {f.isDeleted ? (
                        <>
                          {onRestore && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onRestore(f.id, true);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-[#7CB8F8] transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(f.id, true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete forever</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {onDownloadFolder && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onDownloadFolder(f);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                            >
                              <Download className="w-3.5 h-3.5 text-[#9aa0a6]" />
                              <span>Download .zip</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onRename(f.id, f.name, true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#9aa0a6]" />
                            <span>Rename</span>
                          </button>
                          {onMove && !f.isDeleted && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onMove(f.id, f.name, true, f.parentId);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                            >
                              <FolderInput className="w-3.5 h-3.5 text-[#9aa0a6]" />
                              <span>Move</span>
                            </button>
                          )}
                          {onTogglePin && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onTogglePin(f.id);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                            >
                              <Pin className="w-3.5 h-3.5 text-[#7CB8F8]" />
                              <span>{f.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(f.id, true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to trash</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Files */}
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);
        const isMenuOpen = activeMenuId === file.id;

        return (
          <div
            key={file.id}
            data-item-id={file.id}
            draggable={!file.isDeleted}
            onDragStart={(e) => {
              if (file.isDeleted) return;
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ id: file.id, name: file.name, isFolder: false })
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onPreview(file)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveMenuId(file.id);
            }}
            className={`grid grid-cols-12 px-3 sm:px-4 py-2.5 sm:py-3 items-center border-b border-white/[0.04] cursor-pointer transition group relative ${
              isSelected
                ? "bg-[#004a77]/35 ring-1 ring-[#7CB8F8]/60"
                : "hover:bg-[#1e1f20]"
            }`}
          >
            <div className="col-span-8 sm:col-span-5 flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              {getIcon(file, false)}
              <div className="min-w-0 flex flex-col">
                <span className="font-normal text-[#e3e3e3] group-hover:text-white truncate">
                  {file.name}
                </span>
                <span className="text-[11px] text-[#9aa0a6] sm:hidden truncate">
                  {formatBytes(file.size)} • {formatDate(file.uploadedAt)}
                </span>
              </div>
            </div>

            <div className="hidden sm:block sm:col-span-2 text-xs text-[#9aa0a6]">me</div>
            <div className="hidden sm:block sm:col-span-3 text-xs text-[#9aa0a6]">
              {formatDate(file.uploadedAt)}
            </div>

            <div
              className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-[#9aa0a6] mr-1 hidden sm:inline">{formatBytes(file.size)}</span>

              {/* Desktop Quick Actions */}
              <div className="hidden sm:flex items-center gap-1">
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
                {file.isDeleted ? (
                  <>
                    {onRestore && (
                      <button
                        onClick={() => onRestore(file.id, false)}
                        className="p-1.5 text-[#7CB8F8] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(file.id, false)}
                      className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete forever"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onRename(file.id, file.name, false)}
                      className="p-1.5 text-[#9aa0a6] hover:text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(file.id, false)}
                      className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile 3-Dots Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenuId(isMenuOpen ? null : file.id)}
                  className="p-1.5 text-[#9aa0a6] hover:text-white rounded-lg transition"
                  aria-label="File options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveMenuId(null)}
                    />
                    <div className="absolute right-0 top-8 z-50 w-48 bg-[#1e1f20] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleStar(file.id, false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                      >
                        <Star className={`w-3.5 h-3.5 ${file.isStarred ? "text-[#f4b400] fill-[#f4b400]" : "text-[#9aa0a6]"}`} />
                        <span>{file.isStarred ? "Remove from Starred" : "Add to Starred"}</span>
                      </button>

                      {file.isDeleted ? (
                        <>
                          {onRestore && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onRestore(file.id, false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-[#7CB8F8] transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(file.id, false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete forever</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDownload(file);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                          >
                            <Download className="w-3.5 h-3.5 text-[#9aa0a6]" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onRename(file.id, file.name, false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#9aa0a6]" />
                            <span>Rename</span>
                          </button>
                          {onMove && !file.isDeleted && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onMove(file.id, file.name, false, file.folderId);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition"
                            >
                              <FolderInput className="w-3.5 h-3.5 text-[#9aa0a6]" />
                              <span>Move</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(file.id, false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to trash</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
