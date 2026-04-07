export interface IconProps {
  /** Database icon ID */
  id?: string;
  /** Direct icon file path */
  src?: string;
  /** SVG string content */
  svg?: string;
  /** Size setting */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Additional CSS classes */
  className?: string;
  /** Hono context for API calls */
  context?: any;
}

// Size classes mapping
const sizeClasses: Record<string, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
  "2xl": "w-12 h-12",
  "3xl": "w-16 h-16",
};

// Fallback SVG icon
const fallbackSvg = (className: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="20" height="20" stroke="currentColor" stroke-width=".6" fill="rgba(0,0,0,0)" stroke-linecap="round" class="${className}">
    <path d="M2,3L5,3L8,3M2,5L8,5M2,7L5,7L8,7"></path>
  </svg>`;

// Async component to load SVG from database
async function IconWithCurrentColor({ id, className, context }: { id: string; className: string; context?: any }) {
  try {
    if (context) {
      // 使用 InnerAPI 從資料庫載入 SVG
      const { InnerAPI } = await import('../services/index.ts');
      const response = await InnerAPI(context, `/media/v1/icon/${id}`);
      
      if (response.ok) {
        const svgContent = await response.text();
        
        if (svgContent.trim().startsWith('<svg')) {
          // 直接在 SVG 標籤中添加 className
          const svgWithClass = svgContent.replace('<svg', `<svg class="${className}"`);
          return <span dangerouslySetInnerHTML={{ __html: svgWithClass }} />;
        }
      }
    }
  } catch (_error) {
    // 載入失敗時使用預設值
  }
  
  return <span dangerouslySetInnerHTML={{ __html: fallbackSvg(className) }} />;
}

export default async function Icon({
  id,
  src,
  svg,
  size = "md",
  className = "",
  context,
}: IconProps) {
  // Combine size class with custom className
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const finalClassName = className ? `${sizeClass} ${className}` : sizeClass;

  // If SVG content is provided directly
  if (svg) {
    // 完整 SVG 內容，使用 dangerouslySetInnerHTML
    return <span dangerouslySetInnerHTML={{ __html: svg.replace('<svg', `<svg class="${finalClassName}"`) }} />;
  }

  // If database ID is provided, load from Media service
  if (id) {
    // 如果有 context，使用 InnerAPI 載入
    if (context) {
      return await IconWithCurrentColor({ id, className: finalClassName, context });
    } else {
      // 沒有 context 時，回退到原來的 img 方式
      return (
        <img 
          src={`/media/v1/icon/${id}`}
          alt={`Icon ${id}`}
          className={finalClassName}
          style={{ objectFit: "contain" }}
        />
      );
    }
  }

  // If src is provided, render as image
  if (src) {
    return (
      <img
        src={src}
        alt="Icon"
        className={finalClassName}
        style={{ objectFit: "contain" }}
      />
    );
  }

  // Fallback placeholder
  return <span dangerouslySetInnerHTML={{ __html: fallbackSvg(finalClassName) }} />;
}
