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
}

// Async component to load image from database
async function ImageWithDatabase({ id, alt, width, height, className, loading, fallback, context }: { id: string; alt?: string; width?: string | number; height?: string | number; className?: string; loading?: "lazy" | "eager"; fallback?: string; context?: any }) {
  try {
    if (context) {
      // 使用 InnerAPI 從資料庫載入圖片
      const { InnerAPI } = await import('../services/index.ts');
      const response = await InnerAPI(context, `/media/v1/image/${id}`);
      
      if (response.ok) {
        const imageUrl = await response.text();
        const handleError = (e: any) => {
          if (fallback) {
            e.target.src = fallback;
          }
        };
        
        return (
          <img
            src={imageUrl}
            alt={alt || `Image ${id}`}
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
    }
  } catch (_error) {
    // 載入失敗時使用預設值
  }
  
  // Fallback to direct URL
  const handleError = (e: any) => {
    if (fallback) {
      e.target.src = fallback;
    }
  };
  
  return (
    <img
      src={`/media/v1/image/${id}`}
      alt={alt || `Image ${id}`}
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

export default async function Image({
  id,
  src,
  alt = "Image",
  width,
  height,
  className = "",
  loading = "lazy",
  fallback,
  context,
}: ImageProps) {
  const handleError = (e: any) => {
    if (fallback) {
      e.target.src = fallback;
    }
  };
  
  // If src is provided, render as image
  if (src) {
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

  // If database ID is provided, load from Media service
  if (id) {
    // 如果有 context，使用 InnerAPI 載入
    if (context) {
      return await ImageWithDatabase({ id, alt, width, height, className, loading, fallback, context });
    } else {
      // 沒有 context 時，回退到原來的 img 方式
      return (
        <img
          src={`/media/v1/image/${id}`}
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
    >
      <span>!</span>
    </div>
  );
}
