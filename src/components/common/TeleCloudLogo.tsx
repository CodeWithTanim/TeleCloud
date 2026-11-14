import React from "react";
import teleCloudLogoImg from "../../assets/logo.png";

interface TeleCloudLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const TeleCloudLogo: React.FC<TeleCloudLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  onClick,
}) => {
  const iconSizes = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-12 h-12 sm:w-14 sm:h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-[22px]",
    lg: "text-2xl",
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
    >
      <img
        src={teleCloudLogoImg}
        alt="TeleCloud Logo"
        className={`${iconSizes[size]} shrink-0 object-contain transition-transform group-hover:scale-105`}
        draggable={false}
      />

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
