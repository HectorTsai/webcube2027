import { InnerAPI } from '../services/index.ts';
export interface ImageProps {
  /** Database image ID */
  id?: string;
  /** Image source URL or path */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Image width */
  width?: string | number;
  /** Image height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Loading behavior */
  loading?: "lazy" | "eager";
  /** Fallback image source */
  fallback?: string;
  /** Hono context for API calls */
  context?: any;
  /** Object-fit behavior for image sizing */
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down" | "auto";
  /** Any additional props (including Alpine.js x- attributes) */
  [key: string]: any;
}

export default async function Image({
  id,
  src,
  alt = "Image",
  width,
  height,
  className = "",
  loading = "lazy",
  fallback,
  objectFit = "contain",
  ...restProps
}: ImageProps) {
  const handleError = (e: any) => {
    if (fallback) {
      e.target.src = fallback;
    }
  };
  
  const imageSrc = src || (id ? `/media/v1/image/${id}` : null);
  
  // If src or id is provided, render as image
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`image ${className}`}
        loading={loading}
        onError={handleError}
        style={{ 
          width: width || "auto",
          height: height || "auto",
          maxWidth: "100%",
          objectFit: objectFit || "cover"
        }}
        {...restProps}
      />
    );
  }

  // Fallback placeholder
  return (
    <div 
      className={`image ${className}`}
      style={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5e7eb",
        borderRadius: "4px",
        maxWidth: "100%",
        height: height || "auto",
        width: width || "auto"
      }}
      {...restProps}
    >
      <span>!</span>
    </div>
  );
}
