import React from "react";
import {
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
} from "lucide-react";
import { useTransferStore } from "../../stores/transferStore";
import { formatBytes } from "../../lib/utils/formatters";

export const TransferQueue: React.FC = () => {
  const { transfers, isOpen, setIsOpen, clearCompleted } = useTransferStore();

  if (transfers.length === 0) return null;

  const activeCount = transfers.filter(
    (t) => t.status === "active" || t.status === "pending"
  ).length;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">
            {activeCount > 0 ? `Transfers (${activeCount} active)` : "Transfers completed"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearCompleted();
            }}
            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
          >
            Clear done
          </button>
          <button className="text-slate-400 hover:text-white p-1">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {transfers.map((item) => (
            <div key={item.id} className="p-2 rounded-xl hover:bg-slate-800/40 transition">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {item.type === "upload" ? (
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  ) : (
                    <DownloadCloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 shrink-0">
                  {item.status === "completed" ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : item.status === "error" ? (
                    <span className="text-rose-400 flex items-center gap-1" title={item.error}>
                      <AlertCircle className="w-3 h-3" /> Error
                    </span>
                  ) : (
                    `${item.progress}%`
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {(item.status === "active" || item.status === "pending") && (
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
