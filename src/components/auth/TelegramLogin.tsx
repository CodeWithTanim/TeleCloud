import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  QrCode,
  Info,
  Copy,
  Check,
  ArrowRight,
  Shield,
  RefreshCw,
  Lock,
} from "lucide-react";
import QRCode from "qrcode";
import { BrandLogo } from "../common/BrandLogo";
import { useAuthStore } from "../../stores/authStore";
import { getOrInitClient } from "../../lib/telegram/client";
import {
  sendLoginCode,
  submitLoginCode,
  submit2FAPassword,
  startQrLogin,
} from "../../lib/telegram/auth";

type LoginStep = "phone" | "code" | "password" | "qr";

export const TelegramLogin: React.FC = () => {
  const { apiId, apiHash, setUser } = useAuthStore();
  const [tab, setTab] = useState<"phone" | "qr">("phone");
  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedDiag, setCopiedDiag] = useState(false);

  // QR Login state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Switch between Phone and QR tabs
  const handleTabChange = (newTab: "phone" | "qr") => {
    setTab(newTab);
    setError(null);
    if (newTab === "qr") {
      setStep("qr");
      loadQr();
    } else {
      setStep("phone");
    }
  };

  const loadQr = async () => {
    if (!apiId || !apiHash) return;
    setQrLoading(true);
    setError(null);
    try {
      await getOrInitClient(apiId, apiHash);
      startQrLogin(async (tgUrl) => {
        const dataUrl = await QRCode.toDataURL(tgUrl, {
          margin: 1.5,
          width: 240,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataUrl(dataUrl);
        setQrLoading(false);
      })
        .then((user) => {
          if (user) setUser(user);
        })
        .catch((err) => {
          console.warn("[TelegramLogin] QR login error:", err);
          setQrLoading(false);
        });
    } catch (err: any) {
      setError(err.message || "Failed to initialize QR code login.");
      setQrLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");

    if (!cleanPhone || cleanPhone.length < 8) {
      setError("Please enter your complete phone number with country code (e.g. +8801885686368).");
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
      const res = await sendLoginCode(apiId, apiHash, cleanPhone);
      setPhoneCodeHash(res.phoneCodeHash);
      setStep("code");
    } catch (err: any) {
      console.error("[TelegramLogin] Send code error:", err);
      let msg = err.message || "Failed to send code.";
      if (msg.includes("PHONE_NUMBER_INVALID")) {
        msg = "Invalid phone number. Ensure you included the proper country code (e.g. +880 for Bangladesh).";
      }
      setError(msg);
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

  const copyDiagnostics = () => {
    const diag = `TeleCloud v1.0.0\nTime: ${new Date().toISOString()}\nPlatform: Web (Browser MTProto)\nAPI ID configured: ${Boolean(apiId)}\nStep: ${step}`;
    navigator.clipboard.writeText(diag);
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2000);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#0a0b0d] text-[#e3e3e3] select-none font-sans">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <BrandLogo size="md" showText={true} />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-[#141517] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-[0_16px_44px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300">
        {/* Pill Segmented Tabs (Phone / QR) */}
        <div className="flex bg-[#1E1F22] p-1 rounded-full mb-6">
          <button
            type="button"
            onClick={() => handleTabChange("phone")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === "phone"
                ? "bg-[#2C2D30] text-white shadow-xs font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("qr")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === "qr"
                ? "bg-[#2C2D30] text-white shadow-xs font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Number Input */}
        {step === "phone" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="text-center space-y-1 mb-5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Sign in
              </h1>
              <p className="text-xs text-neutral-400">
                Use your Telegram account to continue
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
                Phone number (+country code)
              </label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError(null);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] hover:border-white/[0.16] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 font-mono text-sm transition outline-none"
                autoFocus
              />
              <div className="flex items-start gap-1.5 px-1 mt-2 text-[11px] text-neutral-400 leading-tight">
                <Info className="w-3.5 h-3.5 text-[#A8C7FA] shrink-0 mt-0.5" />
                <span>
                  Telegram delivers the code to its app first. SMS or a call is offered only when Telegram allows it.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] active:bg-[#455a7e] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <span>Next</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verification Code Input */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center space-y-1 mb-5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Enter Code
              </h1>
              <p className="text-xs text-neutral-400">
                Code sent to <span className="text-[#A8C7FA] font-mono">{phoneNumber}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="text-[11px] text-[#A8C7FA] hover:underline block mx-auto mt-1"
              >
                Change number
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5 text-center">
                Telegram Verification Code
              </label>
              <input
                type="text"
                placeholder="12345"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                className="w-full h-12 px-4 text-center tracking-[0.4em] text-2xl font-mono rounded-xl bg-[#18191B] border border-white/[0.08] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-600 outline-none transition"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: 2FA Password Input */}
        {step === "password" && (
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="text-center space-y-1 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/25 mx-auto flex items-center justify-center text-amber-400 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Two-Step Verification
              </h1>
              <p className="text-xs text-neutral-400">
                Your account is protected by an additional cloud password
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8C7FA] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your 2FA password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18191B] border border-white/[0.08] focus:border-[#A8C7FA] focus:ring-2 focus:ring-[#A8C7FA]/20 text-white placeholder-neutral-500 text-sm outline-none transition"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-11 rounded-full bg-[#526a94] hover:bg-[#5f7cae] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: QR Code Scan */}
        {step === "qr" && (
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Quick Login with QR
              </h1>
              <p className="text-xs text-neutral-400">
                Scan with your phone’s Telegram app
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl flex items-center justify-center min-h-[220px] min-w-[220px]">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-neutral-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#526a94]" />
                  <span className="text-xs">Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="Telegram QR Login" className="w-48 h-48 object-contain" />
              ) : (
                <button
                  onClick={loadQr}
                  className="text-xs text-neutral-600 hover:text-black font-medium"
                >
                  Click to reload QR
                </button>
              )}
            </div>

            <div className="text-[11px] text-neutral-400 space-y-1">
              <p>1. Open Telegram on your phone</p>
              <p>2. Go to <strong>Settings → Devices → Link Desktop Device</strong></p>
              <p>3. Point your camera at this screen</p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-[10px] text-neutral-500 pt-5 border-t border-white/[0.06] mt-5">
          By continuing, you agree to our{" "}
          <span className="text-[#A8C7FA] hover:underline cursor-pointer">Terms of Service</span>
        </p>

        {/* Diagnostics button */}
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={copyDiagnostics}
            className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 transition"
          >
            {copiedDiag ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied to clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy diagnostics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pagination pill indicator dots */}
      <div className="flex items-center gap-1.5 mt-5">
        <div className="w-4.5 h-1 bg-[#A8C7FA] rounded-full transition-all duration-300" />
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
        <div className="w-1.5 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};
