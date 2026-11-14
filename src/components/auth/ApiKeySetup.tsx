import React, { useState } from "react";
import { KeyRound, ShieldCheck, ExternalLink, ArrowRight, Info } from "lucide-react";
import { BrandLogo } from "../common/BrandLogo";
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#0a0b0d] text-[#e3e3e3] select-none font-sans">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <BrandLogo size="md" showText={true} />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-[#141517] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-[0_16px_44px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300">
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Developer Setup
          </h1>
          <p className="text-xs text-neutral-400">
            Configure your personal Telegram API credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-150">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
              Telegram API ID
            </label>
            <input
              type="text"
              placeholder="e.g. 12345678"
              value={apiId}
              onChange={(e) => {
                setApiId(e.target.value);
                setError(null);
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] hover:border-white/[0.16] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 font-mono text-sm transition outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
              Telegram API Hash
            </label>
            <input
              type="password"
              placeholder="e.g. 457f14bd4e74ea235a9c72627..."
              value={apiHash}
              onChange={(e) => {
                setApiHash(e.target.value);
                setError(null);
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] hover:border-white/[0.16] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 font-mono text-sm transition outline-none"
            />
          </div>

          <div className="flex items-start gap-1.5 px-1 mt-2 text-[11px] text-neutral-400 leading-tight">
            <Info className="w-3.5 h-3.5 text-[#A8C7FA] shrink-0 mt-0.5" />
            <span>
              Your keys remain strictly on your local device. Direct client connection to Telegram data centers.
            </span>
          </div>

          <button
            type="submit"
            disabled={!apiId.trim() || !apiHash.trim()}
            className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] active:bg-[#455a7e] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-5"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Need your free API keys?</span>
          <a
            href="https://my.telegram.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#A8C7FA] hover:underline font-medium transition"
          >
            my.telegram.org <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Pagination pill indicator dots */}
      <div className="flex items-center gap-1.5 mt-5">
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
        <div className="w-4.5 h-1 bg-[#A8C7FA] rounded-full transition-all duration-300" />
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};
