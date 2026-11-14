import React, { useState, useEffect } from "react";
import { Download, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { DriveFile } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import { downloadFileFromChannel, triggerFileDownload } from "../../lib/telegram/downloader";
import { formatBytes, formatDate, getFileCategory } from "../../lib/utils/formatters";

interface FilePreviewModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const { activeChannel } = useAuthStore();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file || !activeChannel.id) {
      setBlobUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    const category = getFileCategory(file.mimeType, file.name);

    // Only auto-fetch preview for images, audio, video, text/code
    if (["image", "video", "audio", "code", "document"].includes(category)) {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      downloadFileFromChannel(activeChannel.id, file.messageId, file.name, (pct) => {
        setProgress(pct);
      })
        .then(async (blob) => {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);

          if (category === "code" || file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".md")) {
            const text = await blob.text();
            setTextContent(text);
          }
        })
        .catch((err) => {
          console.error("[FilePreview] Failed to load preview:", err);
          setError("Failed to fetch preview from Telegram channel.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, activeChannel.id]);

  if (!file) return null;

  const category = getFileCategory(file.mimeType, file.name);

  const handleDownload = () => {
    if (!activeChannel.id) return;
    triggerFileDownload(activeChannel.id, file.messageId, file.name);
  };

  return (
    <Modal isOpen={Boolean(file)} onClose={onClose} title={file.name} maxWidth="xl">
      <div className="space-y-4">
        {/* Preview viewport */}
        <div className="min-h-64 max-h-[60vh] bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-auto p-4 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Downloading preview from Telegram... {progress}%</p>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-rose-400 gap-2 p-6 text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
            </div>
          ) : blobUrl && category === "image" ? (
            <img src={blobUrl} alt={file.name} className="max-h-[50vh] object-contain rounded-lg" />
          ) : blobUrl && category === "video" ? (
            <video src={blobUrl} controls className="max-h-[50vh] rounded-lg w-full" />
          ) : blobUrl && category === "audio" ? (
            <div className="w-full max-w-md py-8">
              <audio src={blobUrl} controls className="w-full" />
            </div>
          ) : textContent !== null ? (
            <pre className="text-xs font-mono text-slate-300 w-full text-left overflow-auto max-h-[50vh] p-4 bg-slate-900 rounded-xl">
              {textContent}
            </pre>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm mb-2">Preview not available for this file type.</p>
              <p className="text-xs text-slate-500">Download the file to open it on your device.</p>
            </div>
          )}
        </div>

        {/* File Metadata & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div>
            <span>Size: <strong className="text-slate-200">{formatBytes(file.size)}</strong></span>
            <span className="mx-2">•</span>
            <span>Uploaded: <strong className="text-slate-200">{formatDate(file.uploadedAt)}</strong></span>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
              Download File
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
