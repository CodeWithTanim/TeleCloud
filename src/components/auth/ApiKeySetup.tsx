import React, { useState } from "react";
import { KeyRound, ShieldCheck, ExternalLink, ArrowRight, Lock } from "lucide-react";
import { Button } from "../common/Button";
import { useAuthStore } from "../../stores/authStore";

export const ApiKeySetup: React.FC = () => {
  const { setCredentials } = useAuthStore();
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(apiId.trim(), 10);
    const cleanedHash = apiHash.trim();

    if (isNaN(parsedId) || parsedId <= 0) {
      setError("Please enter a valid numeric Telegram API ID.");
      return;
    }
    if (!cleanedHash || cleanedHash.length < 10) {
      setError("Please enter a valid Telegram API Hash.");
      return;
    }

    setError(null);
    setCredentials(parsedId, cleanedHash);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Configure Your Telegram API</h1>
            <p className="text-sm text-slate-400">Direct client connection • Zero middleman servers</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 mb-6 text-sm text-indigo-200">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Your Credentials Stay 100% On Your Device.</span>
              <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
                Unlike third-party apps that bundle unknown developer keys, TeleCloud connects your browser directly to official Telegram data centers using your own developer credentials.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Telegram API ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 12345678"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Telegram API Hash
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="e.g. 0123456789abcdef0123456789abcdef"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full py-3 text-base">
              Continue to Login <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Need your free API credentials?</span>
          <a
            href="https://my.telegram.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            Get from my.telegram.org <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
