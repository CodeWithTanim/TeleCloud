import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Folder, ChevronRight, ChevronDown, Check, Home } from "lucide-react";
import { DriveFolder } from "../../types";

interface MoveModalProps {
  isOpen: boolean;
  itemId: string;
  itemName: string;
  isFolder: boolean;
  folders: DriveFolder[];
  currentParentId: string | null;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  itemId,
  itemName,
  isFolder,
  folders,
  currentParentId,
  onClose,
  onConfirm,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(currentParentId);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Determine disallowed folder IDs: if moving a folder, it cannot move into itself or any descendant
  const disallowedFolderIds = new Set<string>();
  if (isFolder) {
    disallowedFolderIds.add(itemId);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && disallowedFolderIds.has(f.parentId) && !disallowedFolderIds.has(f.id)) {
          disallowedFolderIds.add(f.id);
          added = true;
        }
      }
    }
  }

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelect = (folderId: string | null) => {
    if (folderId !== null && disallowedFolderIds.has(folderId)) return;
    setSelectedTargetId(folderId);
  };

  // Build tree hierarchy
  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const subFolders = folders.filter(
      (f) => !f.isDeleted && f.parentId === parentId
    );

    if (subFolders.length === 0) return null;

    return (
      <div className="space-y-0.5">
        {subFolders.map((folder) => {
          const isDisallowed = disallowedFolderIds.has(folder.id);
          const isSelected = selectedTargetId === folder.id;
          const hasChildren = folders.some(
            (f) => !f.isDeleted && f.parentId === folder.id
          );
          const isExpanded = expandedFolderIds.has(folder.id);

          return (
            <div key={folder.id} className="select-none">
              <div
                onClick={() => !isDisallowed && handleSelect(folder.id)}
                style={{ paddingLeft: `${depth * 18 + 12}px` }}
                className={`flex items-center justify-between py-2 pr-3 rounded-xl transition cursor-pointer text-sm ${
                  isDisallowed
                    ? "opacity-35 cursor-not-allowed bg-transparent text-neutral-500"
                    : isSelected
                    ? "bg-[#004a77] text-[#c2e7ff] font-medium"
                    : "text-[#e3e3e3] hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(folder.id, e)}
                      className="p-0.5 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-white transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4.5" />
                  )}

                  <Folder
                    className={`w-4 h-4 shrink-0 ${
                      isSelected
                        ? "text-[#c2e7ff] fill-[#c2e7ff]/30"
                        : "text-[#9aa0a6] fill-[#9aa0a6]/20"
                    }`}
                  />
                  <span className="truncate">{folder.name}</span>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#c2e7ff] shrink-0 ml-2" />
                )}
              </div>

              {/* Recursive child folders */}
              {hasChildren && isExpanded && (
                <div className="mt-0.5">
                  {renderFolderTree(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isCurrentLocation = selectedTargetId === currentParentId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Move "${itemName}"`}
      maxWidth="md"
    >
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        <p className="text-xs text-[#9aa0a6]">
          Select destination folder to move <span className="text-white font-medium">"{itemName}"</span>:
        </p>

        {/* Tree Container */}
        <div className="max-h-64 sm:max-h-72 overflow-y-auto bg-[#0e0f11] border border-white/[0.08] rounded-2xl p-2.5 space-y-1">
          {/* Root / Home Item */}
          <div
            onClick={() => handleSelect(null)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-sm ${
              selectedTargetId === null
                ? "bg-[#004a77] text-[#c2e7ff] font-medium"
                : "text-[#e3e3e3] hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Home
                className={`w-4 h-4 shrink-0 ${
                  selectedTargetId === null ? "text-[#c2e7ff]" : "text-[#9aa0a6]"
                }`}
              />
              <span className="truncate">Home (Root)</span>
            </div>
            {selectedTargetId === null && (
              <Check className="w-4 h-4 text-[#c2e7ff] shrink-0" />
            )}
          </div>

          {/* Subfolders list */}
          <div className="pt-1">
            {renderFolderTree(null, 0)}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isCurrentLocation}
            onClick={() => {
              onConfirm(selectedTargetId);
              onClose();
            }}
          >
            {isCurrentLocation ? "Already here" : "Move here"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
