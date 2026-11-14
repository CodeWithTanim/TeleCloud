import React, { useState, useEffect } from "react";
import { Download, RefreshCw, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
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
    if (category === "image") {
      if (file.thumbnail) {
        setBlobUrl(file.thumbnail);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      getOrFetchThumbnail(file.channelId, file.messageId, file.mimeType)
        .then((thumb) => {
          if (thumb) {
            setBlobUrl(thumb);
          } else {
            loadFullResolution(category);
          }
        })
        .catch(() => {
          loadFullResolution(category);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // 2. PDF DOCUMENTS:
    if (category === "pdf") {
      loadFullResolution(category);
      return;
    }

    // 3. TEXT / CODE FILES:
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

    // 4. AUDIO / VIDEO FILES:
    if (category === "audio" || category === "video") {
      loadFullResolution(category);
    }
  }, [file, activeChannel.id]);

  const loadFullResolution = (category: string) => {
    if (!file || !activeChannel.id) return;
    setIsLoading(true);
    setError(null);
    setProgress(0);

    downloadFileFromChannel(activeChannel.id, file.messageId, file.name, (pct) => {
      setProgress(pct);
    })
      .then((blob) => {
        const finalBlob =
          category === "pdf" ? new Blob([blob], { type: "application/pdf" }) : blob;
        const url = URL.createObjectURL(finalBlob);
        setBlobUrl(url);
        setIsFullRes(true);
      })
      .catch((err) => {
        console.error("[FilePreview] Failed to load file preview:", err);
        setError("Failed to download file preview.");
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
    <Modal
      isOpen={Boolean(file)}
      onClose={onClose}
      title={file.name}
      maxWidth={category === "pdf" ? "4xl" : "xl"}
    >
      <div className="space-y-4">
        {/* Preview viewport */}
        <div className="min-h-72 max-h-[72vh] bg-[#0a0b0d] rounded-2xl border border-white/[0.08] flex items-center justify-center overflow-auto p-3 relative">
          {isLoading && !blobUrl ? (
            <div className="flex flex-col items-center justify-center text-neutral-400 gap-3 py-14">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">
                {category === "pdf" ? "Loading PDF document..." : "Loading preview..."}
              </p>
              {progress > 0 && (
                <div className="w-56 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
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
          ) : blobUrl && category === "pdf" ? (
            <div className="w-full h-[65vh] flex flex-col items-center justify-center">
              <iframe
                src={`${blobUrl}#toolbar=1`}
                className="w-full h-full rounded-xl border border-white/[0.08] bg-white shadow-2xl"
                title={file.name}
              />
            </div>
          ) : blobUrl && category === "image" ? (
            <div className="relative flex flex-col items-center justify-center w-full">
              <img
                src={blobUrl}
                alt={file.name}
                className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-lg"
              />
              {!isFullRes && (
                <button
                  onClick={() => loadFullResolution(category)}
                  className="mt-3 px-3 py-1 text-xs rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Load Original High-Res ({formatBytes(file.size)})
                </button>
              )}
            </div>
          ) : blobUrl && category === "video" ? (
            <video src={blobUrl} controls className="max-h-[55vh] rounded-lg w-full" />
          ) : blobUrl && category === "audio" ? (
            <div className="w-full max-w-md py-8">
              <audio src={blobUrl} controls className="w-full" />
            </div>
          ) : textContent !== null ? (
            <pre className="text-xs font-mono text-neutral-300 w-full text-left overflow-auto max-h-[55vh] p-4 bg-[#141517] rounded-xl border border-white/[0.06]">
              {textContent}
            </pre>
          ) : (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-sm mb-2">Preview not available for this file type.</p>
              <p className="text-xs text-neutral-500">Download the file to view on your device.</p>
            </div>
          )}
        </div>

        {/* File Metadata & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs text-neutral-400">
          <div>
            <span>
              Size: <strong className="text-neutral-200">{formatBytes(file.size)}</strong>
            </span>
            <span className="mx-2">•</span>
            <span>
              Uploaded: <strong className="text-neutral-200">{formatDate(file.uploadedAt)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && category === "pdf" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(blobUrl, "_blank")}
                icon={<ExternalLink className="w-4 h-4" />}
              >
                Open in New Tab
              </Button>
            )}
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
