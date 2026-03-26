export interface IconProps {
  /** Database icon ID */
  id?: string;
  /** Direct icon file path */
  src?: string;
  /** SVG string content (AI generated) */
  svg?: string;
  /** Icon size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Icon color (SVG only) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Icon({
  id,
  src,
  svg,
  size = "md",
  color,
  className = "",
}: IconProps) {
  const sizeMap = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
  };
  
  const pixelSize = sizeMap[size];
  
  // If SVG content is provided directly
  if (svg) {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        fill={color || "currentColor"}
        viewBox="0 0 24 24"
        className={`icon icon-${size} ${className}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  
  // If database ID is provided, load from database
  if (id) {
    // TODO: Implement database loading
    // For now, render a placeholder
    return (
      <div 
        className={`icon icon-${size} ${className}`}
        style={{ 
          width: pixelSize, 
          height: pixelSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e5e7eb",
          borderRadius: "4px"
        }}
      >
        <span style={{ fontSize: pixelSize * 0.5 }}>?</span>
      </div>
    );
  }
  
  // If src is provided, render as image
  if (src) {
    return (
      <img
        src={src}
        width={pixelSize}
        height={pixelSize}
        alt="Icon"
        className={`icon icon-${size} ${className}`}
        style={{ objectFit: "contain" }}
      />
    );
  }
  
  // Fallback placeholder
  return (
    <div 
      className={`icon icon-${size} ${className}`}
      style={{ 
        width: pixelSize, 
        height: pixelSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5e7eb",
        borderRadius: "4px"
      }}
    >
      <span style={{ fontSize: pixelSize * 0.5 }}>!</span>
    </div>
  );
}
