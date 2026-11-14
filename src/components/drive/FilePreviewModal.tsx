import React, { useState, useEffect } from "react";
import { Download, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { DriveFile } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import {
  downloadFileFromChannel,
  triggerFileDownload,
  getOrFetchThumbnail,
} from "../../lib/telegram/downloader";
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
  const [isFullRes, setIsFullRes] = useState(false);

  useEffect(() => {
    if (!file || !activeChannel.id) {
      setBlobUrl(null);
      setTextContent(null);
      setError(null);
      setIsFullRes(false);
      return;
    }

    const category = getFileCategory(file.mimeType, file.name);

    // 1. FAST PATH FOR IMAGES:
    // If we already have a thumbnail, display it instantly (0ms latency!)
    if (category === "image") {
      if (file.thumbnail) {
        setBlobUrl(file.thumbnail);
        setIsLoading(false);
        return;
      }

      // If no stored thumbnail, fetch the lightweight ~10KB thumbnail from Telegram
      setIsLoading(true);
      setError(null);
      getOrFetchThumbnail(file.channelId, file.messageId, file.mimeType)
        .then((thumb) => {
          if (thumb) {
            setBlobUrl(thumb);
          } else {
            // Fallback: only if thumbnail is completely unavailable, load full file
            loadFullResolution();
          }
        })
        .catch(() => {
          loadFullResolution();
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // 2. TEXT / CODE FILES:
    if (category === "code" || file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".md")) {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      downloadFileFromChannel(activeChannel.id, file.messageId, file.name, (pct) => {
        setProgress(pct);
      })
        .then(async (blob) => {
          const text = await blob.text();
          setTextContent(text);
        })
        .catch((err) => {
          console.error("[FilePreview] Failed to load text:", err);
          setError("Failed to fetch document text.");
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // 3. AUDIO / VIDEO FILES:
    if (category === "audio" || category === "video") {
      loadFullResolution();
    }
  }, [file, activeChannel.id]);

  const loadFullResolution = () => {
    if (!file || !activeChannel.id) return;
    setIsLoading(true);
    setError(null);
    setProgress(0);

    downloadFileFromChannel(activeChannel.id, file.messageId, file.name, (pct) => {
      setProgress(pct);
    })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsFullRes(true);
      })
      .catch((err) => {
        console.error("[FilePreview] Failed to load full file:", err);
        setError("Failed to download media preview.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

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
        <div className="min-h-72 max-h-[65vh] bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-auto p-4 relative">
          {isLoading && !blobUrl ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Loading instant preview...</p>
              {progress > 0 && (
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-rose-400 gap-2 p-6 text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
            </div>
          ) : blobUrl && category === "image" ? (
            <div className="relative flex flex-col items-center justify-center w-full">
              <img
                src={blobUrl}
                alt={file.name}
                className="max-h-[52vh] max-w-full object-contain rounded-xl shadow-lg"
              />
              {!isFullRes && (
                <button
                  onClick={loadFullResolution}
                  className="mt-3 px-3 py-1 text-xs rounded-full bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Load Original High-Res ({formatBytes(file.size)})
                </button>
              )}
            </div>
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
              <p className="text-xs text-slate-500">Download the file to view on your device.</p>
            </div>
          )}
        </div>

        {/* File Metadata & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div>
            <span>
              Size: <strong className="text-slate-200">{formatBytes(file.size)}</strong>
            </span>
            <span className="mx-2">•</span>
            <span>
              Uploaded: <strong className="text-slate-200">{formatDate(file.uploadedAt)}</strong>
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
            >
              Download File
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
