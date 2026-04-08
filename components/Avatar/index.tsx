import createVariantComponent from "../index.ts";

export interface AvatarProps {
  /** Icon ID from database */
  icon?: string;
  /** Image ID from database */
  image?: string;
  /** Direct image source URL */
  src?: string;
  /** SVG string content */
  svg?: string;
  /** Avatar color theme - controls the base color used across all variants */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  /** Avatar variant - controls the visual style and appearance */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** Avatar size - controls the width and height */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Additional CSS classes */
  className?: string;
  /** Hono context for API calls */
  context?: any;
}

export default createVariantComponent("Avatar", "solid");
