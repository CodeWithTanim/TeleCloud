import React, { useState, useEffect, useRef } from "react";
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

export const TransferQueue: React.FC = () => {
  const { transfers, isOpen, setIsOpen, clearCompleted } = useTransferStore();
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeCount = transfers.filter(
    (t) => t.status === "active" || t.status === "pending"
  ).length;

  const isAllCompleted = transfers.length > 0 && activeCount === 0;

  useEffect(() => {
    if (isAllCompleted) {
      setIsExiting(false);

      // Start 5-second countdown timer, then slide away like react-toast
      exitTimeoutRef.current = setTimeout(() => {
        setIsExiting(true);

        clearAnimationTimeoutRef.current = setTimeout(() => {
          clearCompleted();
          setIsExiting(false);
        }, 400); // 400ms matches the slide-out transition duration
      }, 5000);

      return () => {
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        if (clearAnimationTimeoutRef.current) clearTimeout(clearAnimationTimeoutRef.current);
      };
    } else {
      // If a new transfer is added or active, cancel any pending exit
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (clearAnimationTimeoutRef.current) clearTimeout(clearAnimationTimeoutRef.current);
      setIsExiting(false);
    }
  }, [isAllCompleted, clearCompleted]);

  const handleManualDismiss = () => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    setIsExiting(true);
    clearAnimationTimeoutRef.current = setTimeout(() => {
      clearCompleted();
      setIsExiting(false);
    }, 400);
  };

  // If no transfers and not currently in exit animation, render nothing
  if (transfers.length === 0 && !isExiting) return null;

  return (
    <>
      <style>{`
        @keyframes toastCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: toastCountdown 5s linear forwards;
        }
      `}</style>

      <div
        className={`fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-84 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl transition-all duration-400 ease-out select-none ${
          isExiting
            ? "translate-x-[125%] opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100"
        }`}
      >
        {/* Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            {activeCount > 0 ? (
              <Layers className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-semibold text-slate-200 truncate">
              {activeCount > 0 ? `Transfers (${activeCount} active)` : "Transfers completed"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleManualDismiss}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
              title="Clear and dismiss"
            >
              Clear done
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={handleManualDismiss}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
              title="Close"
              aria-label="Close transfers"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body (Items List) */}
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

        {/* React-Toast 5s countdown progress line when all completed */}
        {isAllCompleted && (
          <div className="w-full h-0.5 bg-slate-800/80 overflow-hidden">
            <div className="h-full bg-emerald-400 animate-toast-progress" />
          </div>
        )}
      </div>
    </>
  );
};
