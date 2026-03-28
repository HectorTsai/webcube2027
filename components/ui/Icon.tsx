export interface IconProps {
  /** Database icon ID */
  id?: string;
  /** Direct icon file path */
  src?: string;
  /** SVG string content (AI generated) */
  svg?: string;
  /** Icon size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
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
  // If SVG content is provided directly
  if (svg) {
    return (
      <svg
        fill={color || "currentColor"}
        viewBox="0 0 24 24"
        className={`icon icon-${size} ${className}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  
  // If database ID is provided, load from Media service
  if (id) {
    return (
      <img 
        src={`/media/v1/icon/${id}`}
        alt={`Icon ${id}`}
        className={`icon icon-${size} ${className}`}
        style={{ 
          objectFit: "contain"
        }}
        onError={(e: any) => {
          // Fallback to placeholder on error
          e.target.style.display = "none";
          const placeholder = e.target?.nextSibling;
          if (placeholder) placeholder.style.display = "flex";
        }}
      />
    );
  }
  
  // If src is provided, render as image
  if (src) {
    return (
      <img
        src={src}
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5e7eb",
        borderRadius: "4px"
      }}
    >
      <span>!</span>
    </div>
  );
}
