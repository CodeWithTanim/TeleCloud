import React from "react";

interface TeleCloudLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const TeleCloudLogo: React.FC<TeleCloudLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-[22px]",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none cursor-pointer ${className}`}>
      {/* Official Telegram Logo SVG */}
      <svg
        className={`${iconSizes[size]} shrink-0 transition-transform hover:scale-105`}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="telecloud-tg-gradient"
            x1="120"
            y1="0"
            x2="120"
            y2="240"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2AABEE" />
            <stop offset="1" stopColor="#229ED9" />
          </linearGradient>
        </defs>
        {/* Telegram official blue circle */}
        <circle cx="120" cy="120" r="120" fill="url(#telecloud-tg-gradient)" />
        {/* Official paper plane fold 1 */}
        <path
          d="M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
          fill="#C8DAEA"
        />
        {/* Official paper plane fold 2 */}
        <path
          d="M98 175c3 0 4.333-1.375 6-3l16-15.562L100.04 144"
          fill="#A9C6DF"
        />
        {/* Official paper plane wings & body */}
        <path
          d="M100.04 144l48.36 35.729c5.519 3.045 9.501 1.468 10.875-5.125l19.685-92.75c2.015-8.08-3.08-11.746-8.36-9.349l-115.5 44.542c-7.89 3.165-7.843 7.566-1.438 9.528l29.663 9.259 68.773-43.39c3.249-1.97 6.228-.91 3.784 1.258z"
          fill="#FFFFFF"
        />
      </svg>

      {showText && (
        <span
          className={`${textSizes[size]} font-medium text-white tracking-tight flex items-center leading-none`}
          style={{ fontFamily: "'Google Sans', 'Inter', system-ui, -apple-system, sans-serif" }}
        >
          TeleCloud
        </span>
      )}
    </div>
  );
};
