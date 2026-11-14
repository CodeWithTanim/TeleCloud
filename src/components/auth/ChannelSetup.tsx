import React, { useState, useEffect } from "react";
import {
  FolderPlus,
  Radio,
  PlusCircle,
  Hash,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderLock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "../common/Button";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Select Storage Channel</h1>
              <p className="text-sm text-slate-400">
                Logged in as <span className="text-indigo-400 font-medium">{user?.firstName || "User"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={loadChannels}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Refresh channels"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Informational banner highlighting user control */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 mb-6 text-sm text-slate-300">
          <p className="leading-relaxed">
            <strong className="text-white">Manual Channel Configuration:</strong> TeleCloud gives you 100% control over where your files are stored. No channels are automatically generated behind your back. Choose an existing channel, point to a specific channel ID, or manually create a fresh one below.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("select");
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition ${
              mode === "select"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Choose Existing
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("custom");
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition ${
              mode === "custom"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Channel ID / Username
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition ${
              mode === "create"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create New Channel
          </button>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: Select from existing channels */}
        {mode === "select" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm">Scanning your Telegram channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-sm mb-3">No suitable channels found where you have admin permissions.</p>
                <Button size="sm" variant="secondary" onClick={() => setMode("create")}>
                  Create a new storage channel
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {channels.map((ch) => (
                  <label
                    key={ch.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedChannelId === ch.id
                        ? "bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedChannelId === ch.id
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-600"
                        }`}
                      >
                        {selectedChannelId === ch.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{ch.title}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {ch.username ? `@${ch.username}` : ch.id}
                          {ch.isCreator && " • Creator"}
                        </div>
                      </div>
                    </div>
                    {ch.membersCount && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {ch.membersCount} members
                      </span>
                    )}
                    <input
                      type="radio"
                      name="storage_channel"
                      value={ch.id}
                      checked={selectedChannelId === ch.id}
                      onChange={() => setSelectedChannelId(ch.id)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleSelectExisting}
                disabled={!selectedChannelId || isLoading}
                className="w-full py-3 text-base"
              >
                Use Selected Channel <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Mode 2: Custom Channel ID / Username */}
        {mode === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Channel ID or @username
              </label>
              <div className="relative">
                <Hash className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. -1001234567890 or @my_storage_channel"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono transition"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Make sure your account is an Administrator or Owner of this channel with permission to post messages.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full py-3 text-base"
            >
              Verify & Connect Channel
            </Button>
          </form>
        )}

        {/* Mode 3: Explicit Channel Creation */}
        {mode === "create" && (
          <form onSubmit={handleCreateNew} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                placeholder="e.g. My Personal Cloud"
                value={newChannelTitle}
                onChange={(e) => setNewChannelTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Channel Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Encrypted personal drive storage"
                value={newChannelAbout}
                onChange={(e) => setNewChannelAbout(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full py-3 text-base"
            >
              Create & Set As Storage Channel
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
