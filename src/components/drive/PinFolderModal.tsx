import React, { useState } from "react";
import { Folder, Pin, PinOff, Search, Check } from "lucide-react";
import { Modal } from "../common/Modal";
import { useAuthStore } from "../../stores/authStore";
import { useFileStore } from "../../stores/fileStore";

interface PinFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinFolderModal: React.FC<PinFolderModalProps> = ({ isOpen, onClose }) => {
  const { activeChannel } = useAuthStore();
  const { folders, togglePinFolder } = useFileStore();
  const [search, setSearch] = useState("");

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const filteredFolders = activeFolders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleToggle = (folderId: string) => {
    if (!activeChannel.id) return;
    togglePinFolder(activeChannel.id, folderId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pin Folders to Sidebar" maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-[#9aa0a6] leading-relaxed">
          Pin frequently used folders to your left sidebar for quick, one-click access anywhere in TeleCloud.
        </p>

        {activeFolders.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1e1f20] border border-white/10 text-white placeholder-[#9aa0a6] text-xs focus:outline-none focus:border-[#7CB8F8] transition"
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {activeFolders.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9aa0a6] space-y-2">
              <Folder className="w-8 h-8 text-[#9aa0a6]/50 mx-auto" />
              <p>No folders found.</p>
              <p className="text-[11px] text-[#75777a]">
                Create a folder first using the <span className="text-white font-medium">+ New</span> button.
              </p>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#9aa0a6]">
              No folders match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredFolders.map((folder) => {
              const isPinned = Boolean(folder.isPinned);
              return (
                <div
                  key={folder.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder
                      className={`w-5 h-5 shrink-0 ${
                        isPinned
                          ? "text-[#7CB8F8] fill-[#7CB8F8]/20"
                          : "text-amber-400/80 fill-amber-400/20"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-white truncate block">
                        {folder.name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(folder.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                      isPinned
                        ? "bg-[#004a77] text-[#c2e7ff] hover:bg-rose-500/20 hover:text-rose-300"
                        : "bg-white/10 text-white hover:bg-[#004a77] hover:text-[#c2e7ff]"
                    }`}
                    title={isPinned ? "Click to unpin" : "Click to pin"}
                  >
                    {isPinned ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Pinned</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>Pin</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-white bg-white/10 hover:bg-white/15 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
