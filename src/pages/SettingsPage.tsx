import React, { useState } from "react";
import { KeyRound, Layers, User, ShieldAlert, LogOut, Save, Check } from "lucide-react";
import { Button } from "../components/common/Button";
import { useAuthStore } from "../stores/authStore";

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
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6">Settings & Configuration</h2>

      <div className="space-y-6">
        {/* Storage Channel Configuration */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Active Storage Channel</h3>
              <p className="text-xs text-slate-400">All drive files and metadata index are stored here</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{activeChannel.title || "Custom Channel"}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{activeChannel.id}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={clearActiveChannel}>
              Switch Channel
            </Button>
          </div>
        </div>

        {/* Telegram API Credentials */}
        <form onSubmit={handleSaveApi} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Telegram Developer Credentials</h3>
              <p className="text-xs text-slate-400">Your personal API ID & Hash from my.telegram.org</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                API ID
              </label>
              <input
                type="text"
                value={editApiId}
                onChange={(e) => setEditApiId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                API Hash
              </label>
              <input
                type="password"
                value={editApiHash}
                onChange={(e) => setEditApiHash(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            >
              {savedSuccess ? "Saved!" : "Update Credentials"}
            </Button>
          </div>
        </form>

        {/* User Account */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-300">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName || ""}</h3>
              <p className="text-xs text-slate-400">{user?.phone || user?.username || "Telegram Account"}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Disconnect Account
          </Button>
        </div>
      </div>
    </div>
  );
};
