import React, { useState, useEffect } from "react";
import {
  FolderPlus,
  RefreshCw,
  FolderLock,
  ArrowRight,
  Hash,
  AlertCircle,
  Check,
} from "lucide-react";
import { BrandLogo } from "../common/BrandLogo";
import { useAuthStore } from "../../stores/authStore";
import { StorageChannelInfo } from "../../types";
import {
  fetchUserChannels,
  verifyChannel,
  createChannelExplicitly,
} from "../../lib/telegram/channelManager";

export const ChannelSetup: React.FC = () => {
  const { setActiveChannel, user } = useAuthStore();
  const [channels, setChannels] = useState<StorageChannelInfo[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [mode, setMode] = useState<"select" | "custom" | "create">("select");

  // Custom ID input
  const [customInput, setCustomInput] = useState("");
  // New channel creation input
  const [newChannelTitle, setNewChannelTitle] = useState("My Personal Cloud");
  const [newChannelAbout, setNewChannelAbout] = useState("Encrypted Cloud Storage powered by TeleCloud");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchUserChannels();
      setChannels(list);
      if (list.length > 0) {
        setSelectedChannelId(list[0].id);
      } else {
        setMode("create");
      }
    } catch (err: any) {
      console.warn("[ChannelSetup] Failed to load dialogs:", err);
      setError("Could not automatically list channels. You can specify a channel ID or create one below.");
      setMode("custom");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleSelectExisting = () => {
    const selected = channels.find((c) => c.id === selectedChannelId);
    if (!selected) {
      setError("Please select a channel from the list.");
      return;
    }
    setActiveChannel(selected.id, selected.title);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) {
      setError("Please enter a valid channel ID or username.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const channel = await verifyChannel(customInput);
      setActiveChannel(channel.id, channel.title);
    } catch (err: any) {
      setError(err.message || "Failed to verify access to this channel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelTitle.trim()) {
      setError("Please provide a title for your new channel.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const channel = await createChannelExplicitly(newChannelTitle, newChannelAbout);
      setActiveChannel(channel.id, channel.title);
    } catch (err: any) {
      setError(err.message || "Failed to create channel on Telegram.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#0a0b0d] text-[#e3e3e3] select-none font-sans">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <BrandLogo size="md" showText={true} />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[460px] bg-[#141517] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-[0_16px_44px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Storage Destination
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose where your drive files are stored
            </p>
          </div>
          <button
            onClick={loadChannels}
            disabled={isLoading}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#1E1F22] transition"
            title="Refresh channels"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Pill Segmented Tabs */}
        <div className="flex bg-[#1E1F22] p-1 rounded-full mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("select");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all text-center cursor-pointer ${
              mode === "select"
                ? "bg-[#2C2D30] text-white shadow-xs font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Existing
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("custom");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all text-center cursor-pointer ${
              mode === "custom"
                ? "bg-[#2C2D30] text-white shadow-xs font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Channel ID
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all text-center cursor-pointer ${
              mode === "create"
                ? "bg-[#2C2D30] text-white shadow-xs font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Create New
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* MODE 1: Select Existing Channel */}
        {mode === "select" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#A8C7FA]" />
                <p className="text-xs">Scanning Telegram channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 space-y-3">
                <p className="text-xs">No channels found where you are an admin.</p>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="px-4 py-2 text-xs rounded-full bg-[#2C2D30] hover:bg-[#383a3e] text-white"
                >
                  Create new storage channel
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {channels.map((ch) => {
                  const isSelected = selectedChannelId === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChannelId(ch.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? "bg-[#1f2633] border-[#70a7ff] text-white ring-1 ring-[#70a7ff]/50"
                          : "bg-[#18191B] border-white/[0.08] hover:border-white/[0.18] text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-[#70a7ff] bg-[#70a7ff]"
                              : "border-neutral-500"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate">{ch.title}</h4>
                          <p className="text-[11px] text-neutral-400 font-mono truncate">
                            {ch.username ? `@${ch.username}` : ch.id}
                            {ch.isCreator && " • Owner"}
                          </p>
                        </div>
                      </div>
                      {ch.membersCount && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 shrink-0">
                          {ch.membersCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleSelectExisting}
              disabled={!selectedChannelId || isLoading}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] active:bg-[#455a7e] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-5"
            >
              <span>Connect Selected Channel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODE 2: Custom Channel ID / Username */}
        {mode === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
                Channel ID or @username
              </label>
              <input
                type="text"
                placeholder="e.g. -1001234567890 or @my_storage"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setError(null);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 font-mono text-sm transition outline-none"
                autoFocus
              />
              <p className="text-[11px] text-neutral-400 mt-2">
                Make sure your account is an Administrator or Owner with posting rights.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !customInput.trim()}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Connect</span>
              )}
            </button>
          </form>
        )}

        {/* MODE 3: Create New Channel */}
        {mode === "create" && (
          <form onSubmit={handleCreateNew} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
                Channel Title
              </label>
              <input
                type="text"
                placeholder="e.g. My Personal Cloud"
                value={newChannelTitle}
                onChange={(e) => setNewChannelTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 text-sm transition outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
                Channel Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Personal drive cloud storage"
                value={newChannelAbout}
                onChange={(e) => setNewChannelAbout(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 text-sm transition outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newChannelTitle.trim()}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create & Connect</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Pagination pill indicator dots */}
      <div className="flex items-center gap-1.5 mt-5">
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
        <div className="w-4.5 h-1 bg-[#A8C7FA] rounded-full transition-all duration-300" />
      </div>
    </div>
  );
};
