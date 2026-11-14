import React, { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface MosaicCredentialFieldProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const MosaicCredentialField: React.FC<MosaicCredentialFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "Enter API Hash...",
  readOnly = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleReveal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRevealed((prev) => !prev);
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-xs font-medium text-[#9aa0a6] mb-1.5 select-none">
        {label}
      </label>

      {/* Input container with Eye and Copy icons */}
      <div className="relative w-full flex items-center">
        {/* SVG Filter for realistic Telegram mosaic scrambling */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <filter id="tg-mosaic-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="4"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="9"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
        </svg>

        <input
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={`w-full h-11 pl-3.5 pr-20 rounded-xl bg-[#18191B] border border-white/[0.08] hover:border-white/[0.16] focus:border-[#7CB8F8] focus:ring-2 focus:ring-[#7CB8F8]/20 text-[#e3e3e3] font-mono text-sm transition outline-none ${
            !isRevealed && value
              ? "tracking-widest select-none"
              : "tracking-normal"
          }`}
          style={
            !isRevealed && value
              ? {
                  filter: "url(#tg-mosaic-filter) blur(3.5px) contrast(200%) brightness(1.1)",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  textShadow: "0 0 4px rgba(255,255,255,0.4)",
                }
              : {}
          }
        />

        {/* Right side buttons: Eye & Copy */}
        <div className="absolute right-2.5 flex items-center gap-1.5 text-[#9aa0a6]">
          {/* Eye Icon to Toggle Mosaic / Plain Text */}
          <button
            type="button"
            onClick={toggleReveal}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
            title={isRevealed ? "Hide API Hash" : "Show API Hash"}
          >
            {isRevealed ? (
              <EyeOff className="w-4 h-4 text-[#7CB8F8]" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* Copy Icon */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              copied
                ? "text-emerald-400 bg-emerald-500/10"
                : "hover:bg-white/10 hover:text-white"
            }`}
            title={copied ? "Copied to clipboard!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
