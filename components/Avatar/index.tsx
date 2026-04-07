import createVariantComponent from "../index.ts";

export interface AvatarProps {
  /** Icon component or icon props */
  icon?: any;
  /** Image component or image props */
  image?: any;
  /** Size setting */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Color theme */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "neutral";
  /** Layout variant */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | "glow" | "minimalist";
  /** Additional CSS classes */
  className?: string;
  /** Hono context for API calls */
  context?: any;
}

export default createVariantComponent("Avatar", "solid");
