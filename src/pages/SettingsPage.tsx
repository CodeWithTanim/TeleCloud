import React, { useState } from "react";
import { KeyRound, Layers, LogOut, Save, Check } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { MosaicCredentialField } from "../components/common/MosaicCredentialField";

export const SettingsPage: React.FC = () => {
  const { apiId, apiHash, user, activeChannel, clearActiveChannel, setCredentials, logout } =
    useAuthStore();

  const [editApiId, setEditApiId] = useState(apiId ? String(apiId) : "");
  const [editApiHash, setEditApiHash] = useState(apiHash || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(editApiId.trim(), 10);
    const cleanedHash = editApiHash.trim();
    if (parsedId && cleanedHash) {
      setCredentials(parsedId, cleanedHash);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl select-none">
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Settings & Configuration</h2>

      <div className="space-y-6">
        {/* Storage Channel Configuration */}
        <div className="p-6 bg-[#141517] border border-white/[0.08] rounded-3xl shadow-[0_16px_44px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-white/5 text-[#A8C7FA]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Active Storage Channel</h3>
              <p className="text-xs text-neutral-400">All drive files and metadata index are stored here</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#18191B] border border-white/[0.06] mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{activeChannel.title || "Custom Channel"}</div>
              <div className="text-xs text-neutral-400 font-mono mt-0.5">{activeChannel.id}</div>
            </div>
            <button
              onClick={clearActiveChannel}
              className="px-4 py-2 text-xs font-medium rounded-full bg-[#2C2D30] hover:bg-[#383a3e] text-white transition cursor-pointer"
            >
              Switch Channel
            </button>
          </div>
        </div>

        {/* Telegram API Credentials */}
        <form onSubmit={handleSaveApi} className="p-6 bg-[#141517] border border-white/[0.08] rounded-3xl shadow-[0_16px_44px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/5 text-[#A8C7FA]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Telegram Developer Credentials</h3>
              <p className="text-xs text-neutral-400">Your personal API ID & Hash from my.telegram.org</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9aa0a6] mb-1.5">
                API ID
              </label>
              <input
                type="text"
                value={editApiId}
                onChange={(e) => setEditApiId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] text-white font-mono text-sm focus:border-[#7CB8F8] focus:ring-2 focus:ring-[#7CB8F8]/20 outline-none"
              />
            </div>
            <div>
              <MosaicCredentialField
                label="API Hash"
                value={editApiHash}
                onChange={setEditApiHash}
                placeholder="Enter API Hash"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* User Account */}
        <div className="p-6 bg-[#141517] border border-white/[0.08] rounded-3xl shadow-[0_16px_44px_rgba(0,0,0,0.4)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E1F22] border border-white/[0.08] flex items-center justify-center font-bold text-sm text-[#A8C7FA]">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName || ""}</h3>
              <p className="text-xs text-neutral-400">{user?.phone || user?.username || "Telegram Account"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-xs font-medium rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
