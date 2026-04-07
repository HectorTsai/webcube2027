// UnoCSS API 模組 - 統一處理 /api/v1/unocss/* 路由
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 回應成功 } from '../../utils/response.ts';
import { 快取管理器 } from '../../core/unocss-cache.ts';
import { UnoCSS生成器 } from '../../core/unocss-generator.ts';
import 配色 from "../../database/models/配色.ts";
import 骨架 from "../../database/models/骨架.ts";

/**
 * 取得自訂 UnoCSS classes 列表
 * 提供給 AI 使用的自訂 class 列表（不包含標準 TailwindCSS）
 */
function 處理取得自訂Classes(c: Context) {
  try {
    // 直接使用 UnoCSS生成器
    const 生成器 = new UnoCSS生成器(new 骨架(), new 配色());
    const classes = 生成器.getAllClasses();

    return 回應成功(c, {
      message: "WebCube 自訂 UnoCSS classes",
      data: classes,
      usage: "在標準 TailwindCSS v4 基礎上使用這些自訂 classes",
      total: classes.total || 0
    });
    
  } catch (_error) {
    // 靜默處理錯誤，返回預設值
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
    // await info('UnoCSS API', '處理取得所有 classes 請求');
    
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
    // await info('UnoCSS API', '處理取得主題資訊請求');
    
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

// POST - 處理清理快取請求
async function 處理清理快取(c: Context): Promise<Response> {
  try {
    // await info('UnoCSS API', '處理清理快取請求');
    
    // 清理 UnoCSS 樣式快取
    快取管理器.清理樣式快取();
    
    return 回應成功(c, {
      message: "UnoCSS 樣式快取已清理",
      timestamp: new Date().toISOString()
    });
    
  } catch (錯誤) {
    await error('UnoCSS API', `清理快取失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '清理快取失敗' }
    }, 500);
  }
}

// GET - 統一處理 UnoCSS API (/api/v1/unocss/*)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // await info('UnoCSS API', '處理取得 UnoCSS 資料請求');
    
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
  GET: GET,
  POST: 處理清理快取
};

export default API;
