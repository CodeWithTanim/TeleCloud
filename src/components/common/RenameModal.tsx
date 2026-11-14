import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FileText, Folder } from "lucide-react";

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
  const [baseName, setBaseName] = useState("");
  const [extension, setExtension] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!isFolder && currentName.includes(".")) {
        const lastDot = currentName.lastIndexOf(".");
        if (lastDot > 0) {
          setBaseName(currentName.substring(0, lastDot));
          setExtension(currentName.substring(lastDot + 1));
        } else {
          setBaseName(currentName);
          setExtension("");
        }
      } else {
        setBaseName(currentName);
        setExtension("");
      }

      // Auto-focus and select the base name on modal open
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentName, isFolder]);

  const cleanExt = extension.trim().replace(/^\.+/, "");
  const fullName = !isFolder && cleanExt
    ? `${baseName.trim()}.${cleanExt}`
    : baseName.trim();

  const isChanged = fullName !== currentName && baseName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseName.trim() || fullName === currentName) {
      onClose();
      return;
    }
    onConfirm(fullName);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? "Rename folder" : "Rename file"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isFolder ? (
          <div>
            <label className="block text-xs font-medium text-[#9aa0a6] mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[#7CB8F8]" />
              Folder name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e1f20] border border-white/10 text-white placeholder-[#9aa0a6] focus:outline-none focus:border-[#7CB8F8] focus:ring-1 focus:ring-[#7CB8F8] text-sm transition"
              placeholder="Enter folder name"
            />
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* File Name Field */}
            <div>
              <label className="block text-xs font-medium text-[#9aa0a6] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#7CB8F8]" />
                File name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1f20] border border-white/10 text-white placeholder-[#9aa0a6] focus:outline-none focus:border-[#7CB8F8] focus:ring-1 focus:ring-[#7CB8F8] text-sm transition"
                placeholder="e.g. main, document, video"
              />
            </div>

            {/* Extension Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#9aa0a6]">
                  Extension
                </label>
                <span className="text-[11px] text-[#9aa0a6]">Separate extension option</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-semibold text-[#7CB8F8] select-none pointer-events-none">
                  .
                </span>
                <input
                  type="text"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value.replace(/^\.+/, ""))}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-[#1e1f20] border border-white/10 text-white placeholder-[#9aa0a6] focus:outline-none focus:border-[#7CB8F8] focus:ring-1 focus:ring-[#7CB8F8] text-sm font-mono transition"
                  placeholder="e.g. py, txt, mp4, zip"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs">
              <span className="text-[#9aa0a6]">Preview:</span>
              <span className="font-mono text-white font-medium truncate max-w-[260px]">
                {fullName || "(unnamed)"}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!baseName.trim()}
          >
            {isChanged ? "Rename" : "OK"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
