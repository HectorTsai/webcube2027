// UnoCSS API 模組 - 統一處理 /api/v1/unocss/* 路由
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 回應成功 } from '../../utils/response.ts';

/**
 * 取得自訂 UnoCSS classes 列表
 * 提供給 AI 使用的自訂 class 列表（不包含標準 TailwindCSS）
 */
function 處理取得自訂Classes(c: Context) {
  try {
    const 自訂Classes = {
      description: "WebCube 自訂 UnoCSS preset 擴展 - 除了標準 TailwindCSS v4 之外的自訂 classes",
      customColors: {
        description: "自訂顏色系統 - 基於 oklch 色彩空間的語意化顏色",
        classes: [
          "bg-primary", "bg-secondary", "bg-accent", "bg-neutral",
          "text-primary-content", "text-secondary-content", "text-accent-content", "text-neutral-content",
          "border-primary", "border-secondary", "border-accent", "border-neutral",
          "ring-primary", "ring-secondary", "ring-accent"
        ],
        notes: [
          "text-*-content 會根據背景亮度自動調整文字顏色（40%亮度以下用白色，以上用黑色）",
          "所有顏色使用 oklch 格式，提供更好的感知均勭性",
          "遵循 DaisyUI 設計理念：bg-primary + text-primary-content"
        ]
      },
      semanticColors: {
        description: "語意化顏色 - 用於佈局和內容的基礎顏色",
        classes: [
          "bg-base-100", "bg-base-200", "bg-base-300",
          "text-base-content",
          "border-base-300",
          "fill-base-content"
        ],
        notes: [
          "base-100: 主背景色",
          "base-200: 次背景色", 
          "base-300: 邊框色",
          "base-content: 主要文字色"
        ]
      },
      statusColors: {
        description: "狀態顏色 - 用於不同狀態的指示",
        classes: [
          "bg-info", "bg-success", "bg-warning", "bg-error",
          "text-info", "text-success", "text-warning", "text-error",
          "border-info", "border-success", "border-warning", "border-error"
        ]
      },
      customSpacing: {
        description: "自訂間距系統 - 語意化的間距命名",
        classes: [
          "p-xs", "p-sm", "p-md", "p-lg", "p-xl", "p-2xl",
          "px-xs", "px-sm", "px-md", "px-lg", "px-xl", "px-2xl",
          "py-xs", "py-sm", "py-md", "py-lg", "py-xl", "py-2xl",
          "m-xs", "m-sm", "m-md", "m-lg", "m-xl",
          "mx-xs", "mx-sm", "mx-md", "mx-lg", "mx-xl",
          "my-xs", "my-sm", "my-md", "my-lg", "my-xl",
          "gap-xs", "gap-sm", "gap-md", "gap-lg", "gap-xl"
        ],
        mapping: {
          "xs": "0.5rem (8px)",
          "sm": "0.75rem (12px)", 
          "md": "1rem (16px)",
          "lg": "1.5rem (24px)",
          "xl": "2rem (32px)",
          "2xl": "3rem (48px)"
        }
      },
      customComponents: {
        description: "元件快捷樣式 - 預定義的元件組合樣式",
        classes: [
          "btn", "btn-primary", "btn-secondary", "btn-accent",
          "card", "input", "container"
        ],
        details: {
          "btn": "基礎按鈕樣式 (px-4 py-2 rounded-lg font-medium transition-colors)",
          "btn-primary": "主要按鈕 (btn + bg-primary + text-primary-content)",
          "btn-secondary": "次要按鈕 (btn + bg-secondary + text-secondary-content)",
          "btn-accent": "強調按鈕 (btn + bg-accent + text-accent-content)",
          "card": "卡片樣式 (bg-base-100 text-base-content rounded-lg shadow-md p-6)",
          "input": "輸入框樣式 (px-3 py-2 border border-base-300 rounded-md focus:ring-2 focus:ring-primary)",
          "container": "容器樣式 (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8)"
        }
      },
      customRules: {
        description: "自訂規則 - 動態生成的樣式規則",
        classes: [
          "theme-*", "text-*-content"
        ],
        notes: [
          "theme-*: 設定主題變數",
          "text-*-content: DaisyUI 風格，根據背景自動計算文字顏色（40%亮度以下用白色，以上用黑色）"
        ]
      }
    };

    return 回應成功(c, {
      message: "WebCube 自訂 UnoCSS classes",
      data: 自訂Classes,
      usage: "在標準 TailwindCSS v4 基礎上使用這些自訂 classes",
      examples: [
        "class='btn btn-primary p-md gap-sm'",
        "class='card bg-base-100 text-base-content'",
        "class='bg-primary text-primary-content p-lg'"
      ]
    });
    
  } catch (error) {
    console.error('取得自訂 UnoCSS classes 失敗:', error);
    return 回應成功(c, {
      message: "WebCube 自訂 UnoCSS classes",
      data: {
        error: "無法取得自訂 classes",
        fallback: ["btn", "btn-primary", "card", "input", "p-md", "gap-sm", "bg-primary", "text-base-content"]
      }
    }, 'default', 500);
  }
}

/**
 * 取得主題資訊
 */
function 處理取得主題資訊(c: Context) {
  try {
    const 主題資訊 = {
      colorSystem: {
        format: "oklch - 現代色彩空間",
        benefits: ["感知均勭性", "更好的色彩控制", "支援 HDR 顯示"]
      },
      customFeatures: [
        "自動文字顏色: text-auto-primary 根據背景自動調整",
        "主題變數: 使用 CSS Variables 支援動態主題切換",
        "語意化命名: bg-base-100, text-base-content 等易於理解",
        "元件快捷: btn, card, input 等預定義組合"
      ],
      integration: {
        base: "TailwindCSS v4",
        preset: "UnoCSS with webcube-preset",
        compatibility: "完全相容標準 TailwindCSS v4"
      }
    };

    return 回應成功(c, {
      message: "WebCube 主題資訊",
      data: 主題資訊
    });
    
  } catch (error) {
    console.error('取得主題資訊失敗:', error);
    return 回應成功(c, {
      message: "WebCube 主題資訊", 
      data: { error: "無法取得主題資訊" }
    }, 'default', 500);
  }
}

// 處理取得所有 classes
async function 處理取得所有Classes(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('UnoCSS API', '處理取得所有 classes 請求');
    
    // 從 query string 取得參數 (向後兼容)
    const theme = c.req.query('theme');
    const decodedTheme = theme ? decodeURIComponent(theme) : undefined;
    
    // 優先檢查路徑參數 (智能回退機制)
    if (params.id === 'classes') {
      return await 處理取得自訂Classes(c);
    }
    
    // 如果有路徑參數且不是 'classes'，當作 theme 處理
    if (params.id) {
      return await 處理取得主題資訊(c);
    }
    
    // 如果有 query 參數，向後兼容
    if (decodedTheme) {
      return await 處理取得主題資訊(c);
    }
    
    // 無參數，返回所有 classes
    return await 處理取得自訂Classes(c);
    
  } catch (錯誤) {
    await error('UnoCSS API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得 UnoCSS 資料失敗' }
    }, 500);
  }
}

// 處理取得主題資訊
async function 處理取得主題Info(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('UnoCSS API', '處理取得主題資訊請求');
    
    // 如果有路徑參數，當作 theme 處理
    if (params.id) {
      return await 處理取得主題資訊(c);
    }
    
    // 無參數，返回預設主題資訊
    return await 處理取得主題資訊(c);
    
  } catch (錯誤) {
    await error('UnoCSS API', `取得主題資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得主題資訊失敗' }
    }, 500);
  }
}

// GET - 統一處理 UnoCSS API (/api/v1/unocss/*)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('UnoCSS API', '處理取得 UnoCSS 資料請求');
    
    // 優先檢查路徑參數 (智能回退機制)
    if (params.id === 'classes') {
      return await 處理取得所有Classes(c, params);
    }
    
    if (params.id === 'info') {
      return await 處理取得主題Info(c, params);
    }
    
    // 如果有路徑參數且不是 'classes' 或 'info'，當作 theme 處理
    if (params.id) {
      return await 處理取得主題資訊(c);
    }
    
    // 無參數，返回所有 classes (預設行為)
    return await 處理取得自訂Classes(c);
    
  } catch (錯誤) {
    await error('UnoCSS API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得 UnoCSS 資料失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: GET
};

export default API;
