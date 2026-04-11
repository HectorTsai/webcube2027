import { raw } from 'hono/utils/html';
import { InnerAPI } from '../services/index.ts';

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
  /** Any additional props (including Alpine.js x- attributes) */
  [key: string]: any;
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

// Parse SVG string to extract attributes and inner content for direct SVG rendering
function parseSvgString(svgString: string, className: string): { innerHtml: string; svgProps: Record<string, string> } {
  // Extract <svg> opening tag attributes
  const svgOpenMatch = svgString.match(/<svg([^>]*)>/);
  const svgCloseMatch = svgString.match(/<\/svg>/i);
  
  if (!svgOpenMatch || !svgCloseMatch) {
    return { innerHtml: svgString, svgProps: { class: className } };
  }
  
  // Parse attributes from the opening tag
  const attrString = svgOpenMatch[1];
  const svgProps: Record<string, string> = {};
  
  // Extract all attributes key="value" or key='value' (support both single and double quotes)
  const attrRegex = /(\w+[-:]?\w*)=(?:["']([^"']*)["'])/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const attrName = match[1];
    const attrValue = match[2] || '';
    
    // Skip original class, we'll use our own
    if (attrName !== 'class' && attrName !== 'className') {
      svgProps[attrName] = attrValue;
    }
  }
  
  // Set our className
  svgProps.class = className;
  
  // Extract inner content (between <svg> and </svg>)
  const startIdx = svgOpenMatch.index! + svgOpenMatch[0].length;
  const endIdx = svgCloseMatch.index!;
  const innerHtml = svgString.slice(startIdx, endIdx).trim();
  
  return { innerHtml, svgProps };
}

// Fallback SVG icon (just the inner content)
const fallbackSvgContent = () => `<path d="M2,3L5,3L8,3M2,5L8,5M2,7L5,7L8,7"></path>`;

// Async component to load SVG from database
async function IconWithCurrentColor({ id, className, context, restProps }: { id: string; className: string; context?: any; restProps?: any }) {
  try {
    if (context) {
      // 使用 InnerAPI 從資料庫載入 SVG
      const response = await InnerAPI(context, `/media/v1/icon/${id}`);
      
      if (response.ok) {
        const svgContent = await response.text();
        
        if (svgContent.trim().startsWith('<svg')) {
          // Parse SVG and render directly as <svg> element
          const { innerHtml, svgProps } = parseSvgString(svgContent, className);
          const svgContentRaw = raw(innerHtml);
          return <svg {...svgProps} {...restProps}>{svgContentRaw}</svg>;
        }
      }
    }
  } catch (_error) {
    // 載入失敗時使用預設值
  }
  
  // Fallback: render as direct <svg> element
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 10 10" 
      width="20" 
      height="20" 
      stroke="currentColor" 
      stroke-width=".6" 
      fill="rgba(0,0,0,0)" 
      stroke-linecap="round" 
      class={className}
      {...restProps}
    >
      {raw(fallbackSvgContent())}
    </svg>
  );
}

export default async function Icon({
  id,
  src,
  svg,
  size = "md",
  className = "",
  context,
  ...restProps
}: IconProps) {
  // Combine size class with custom className
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const finalClassName = className ? `${sizeClass} ${className}` : sizeClass;

  // If SVG content is provided directly
  if (svg) {
    // 解析 SVG 並直接輸出為 <svg> 元素（無外層包裹）
    const { innerHtml, svgProps } = parseSvgString(svg, finalClassName);
    const svgContentRaw = raw(innerHtml);
    return <svg {...svgProps} {...restProps}>{svgContentRaw}</svg>;
  }

  // If database ID is provided, load from Media service
  if (id) {
    // 如果有 context，使用 InnerAPI 載入
    if (context) {
      return await IconWithCurrentColor({ id, className: finalClassName, context, restProps });
    } else {
      // 沒有 context 時，回退到原來的 img 方式
      return (
        <img 
          src={`/media/v1/icon/${id}`}
          alt={`Icon ${id}`}
          className={finalClassName}
          style={{ objectFit: "contain" }}
          {...restProps}
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
        {...restProps}
      />
    );
  }

  // Fallback placeholder - direct <svg> element
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 10 10" 
      width="20" 
      height="20" 
      stroke="currentColor" 
      stroke-width=".6" 
      fill="rgba(0,0,0,0)" 
      stroke-linecap="round" 
      class={finalClassName}
      {...restProps}
    >
      {raw(fallbackSvgContent())}
    </svg>
  );
}
