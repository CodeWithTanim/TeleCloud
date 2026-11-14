import React from "react";
import { TeleCloudLogo } from "./TeleCloudLogo";

interface GoogleDriveLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const GoogleDriveLogo: React.FC<GoogleDriveLogoProps> = (props) => {
  return <TeleCloudLogo {...props} />;
};
