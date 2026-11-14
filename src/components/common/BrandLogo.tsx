import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = "md", showText = true }) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-[#1d9bf0] via-[#22c55e] to-[#f59e0b] p-0.5 shadow-lg shadow-black/40 flex items-center justify-center`}
      >
        <div className="w-full h-full bg-[#141517] rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Telegram plane inside drive badge */}
          <svg
            className="w-5 h-5 text-[#29b6f6] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </div>
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight text-white`}>
          TeleCloud
        </span>
      )}
    </div>
  );
};
