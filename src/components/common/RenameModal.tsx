import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  isFolder: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  isFolder,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      // Wait for modal animation to mount then select filename
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!isFolder && currentName.includes(".")) {
            const lastDot = currentName.lastIndexOf(".");
            inputRef.current.setSelectionRange(0, lastDot > 0 ? lastDot : currentName.length);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentName, isFolder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? "Rename folder" : "Rename"}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#1e1f20] border border-white/10 text-white placeholder-[#9aa0a6] focus:outline-none focus:border-[#7CB8F8] focus:ring-1 focus:ring-[#7CB8F8] text-sm transition"
            placeholder={isFolder ? "Folder name" : "File name"}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!name.trim()}
          >
            OK
          </Button>
        </div>
      </form>
    </Modal>
  );
};
