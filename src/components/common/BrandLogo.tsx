import React from "react";
import { TeleCloudLogo } from "./TeleCloudLogo";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = (props) => {
  return <TeleCloudLogo {...props} />;
};
