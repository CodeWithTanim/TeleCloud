import React, { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useAuthStore } from "../../stores/authStore";
import { useFileStore } from "../../stores/fileStore";
import { useTransferStore } from "../../stores/transferStore";
import { uploadFileToChannel } from "../../lib/telegram/uploader";
import { formatBytes } from "../../lib/utils/formatters";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const { activeChannel } = useAuthStore();
  const { currentFolderId, addFile } = useFileStore();
  const { addTransfer, updateProgress, setStatus } = useTransferStore();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!activeChannel.id || selectedFiles.length === 0) return;

    setIsUploading(true);
    onClose();

    for (const file of selectedFiles) {
      const transferId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      addTransfer({
        id: transferId,
        name: file.name,
        size: file.size,
        transferred: 0,
        type: "upload",
      });

      try {
        const driveFile = await uploadFileToChannel(
          activeChannel.id,
          file,
          currentFolderId,
          (progress) => {
            updateProgress(transferId, progress.percentage, progress.bytesUploaded);
          }
        );

        await addFile(activeChannel.id, driveFile);
        setStatus(transferId, "completed");
      } catch (err: any) {
        console.error("[FileUpload] Upload error for", file.name, err);
        setStatus(transferId, "error", err.message || "Upload failed");
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Files" maxWidth="md">
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40 hover:bg-indigo-950/10 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Click to browse or drag & drop files here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Up to 2GB per file (4GB for Telegram Premium)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selected ({selectedFiles.length})
            </h4>
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-200 truncate">{file.name}</span>
                  <span className="text-slate-500 shrink-0">({formatBytes(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            isLoading={isUploading}
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
