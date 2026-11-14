import React, { useState } from "react";
import { FolderPlus, Pin } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useAuthStore } from "../../stores/authStore";
import { useFileStore } from "../../stores/fileStore";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({ isOpen, onClose }) => {
  const { activeChannel } = useAuthStore();
  const { createFolder } = useFileStore();
  const [folderName, setFolderName] = useState("");
  const [pinToSidebar, setPinToSidebar] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel.id || !folderName.trim()) return;

    setIsCreating(true);
    try {
      await createFolder(activeChannel.id, folderName.trim(), pinToSidebar);
      setFolderName("");
      setPinToSidebar(false);
      onClose();
    } catch (err) {
      console.error("[NewFolder] Create folder error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Folder" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Folder Name
          </label>
          <input
            type="text"
            placeholder="e.g. Python, NextJs"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
            autoFocus
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-[#c4c7c5] hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={pinToSidebar}
            onChange={(e) => setPinToSidebar(e.target.checked)}
            className="rounded border-[#444746] bg-[#1e1f20] text-[#7CB8F8] focus:ring-0 cursor-pointer"
          />
          <Pin className="w-3.5 h-3.5 text-sky-400" />
          <span>Pin to sidebar for quick access</span>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!folderName.trim() || isCreating}
            isLoading={isCreating}
          >
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
};
