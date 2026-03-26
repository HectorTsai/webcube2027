export interface ImageProps {
  /** Image source URL or path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
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
}

export default function Image({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  fallback,
}: ImageProps) {
  const handleError = (e: any) => {
    if (fallback) {
      e.target.src = fallback;
    }
  };
  
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`image ${className}`}
      loading={loading}
      onError={handleError}
      style={{ 
        maxWidth: "100%",
        height: height || "auto",
        objectFit: "cover"
      }}
    />
  );
}
