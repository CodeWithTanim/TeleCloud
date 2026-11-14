import React, { useState } from "react";
import { Phone, Lock, KeyRound, ArrowRight, Shield, RefreshCw } from "lucide-react";
import { Button } from "../common/Button";
import { useAuthStore } from "../../stores/authStore";
import { getOrInitClient } from "../../lib/telegram/client";
import { sendLoginCode, submitLoginCode, submit2FAPassword } from "../../lib/telegram/auth";

type LoginStep = "phone" | "code" | "password";

export const TelegramLogin: React.FC = () => {
  const { apiId, apiHash, setUser } = useAuthStore();
  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number with country code (e.g. +1234567890).");
      return;
    }
    if (!apiId || !apiHash) {
      setError("Missing API credentials. Please re-configure.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await getOrInitClient(apiId, apiHash);
      const res = await sendLoginCode(apiId, apiHash, phoneNumber);
      setPhoneCodeHash(res.phoneCodeHash);
      setStep("code");
    } catch (err: any) {
      console.error("[TelegramLogin] Send code error:", err);
      setError(err.message || "Failed to send verification code. Please check your number and API keys.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code sent to your Telegram app.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await submitLoginCode(phoneNumber, phoneCodeHash, code);
      setUser(user);
    } catch (err: any) {
      console.error("[TelegramLogin] Verify code error:", err);
      // Check if 2FA password is required
      if (err.message?.includes("SESSION_PASSWORD_NEEDED") || err.errorMessage === "SESSION_PASSWORD_NEEDED") {
        setStep("password");
      } else {
        setError(err.message || "Invalid code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your Telegram 2FA cloud password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await submit2FAPassword(password);
      setUser(user);
    } catch (err: any) {
      console.error("[TelegramLogin] 2FA error:", err);
      setError(err.message || "Incorrect 2FA password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Connect Telegram</h1>
            <p className="text-sm text-slate-400">Sign in securely to access your drive</p>
          </div>
        </div>

        {step === "phone" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Phone Number (with Country Code)
              </label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Telegram will send a login code directly to your Telegram app.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3 text-base"
            >
              Send Login Code <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Change Number
                </button>
              </div>
              <input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-widest text-xl font-mono rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Enter the code received in your Telegram chat for {phoneNumber}.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3 text-base"
            >
              Verify & Connect
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Two-Step Verification Password
                </label>
              </div>
              <input
                type="password"
                placeholder="Enter your 2FA password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Your account is protected by an additional cloud password.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3 text-base"
            >
              Unlock Account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
