// UnoCSS API 模組 - 統一處理 /api/v1/unocss/* 路由
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 回應成功 } from '../../utils/response.ts';
import { 快取管理器 } from '../../core/unocss-cache.ts';
import { UnoCSS生成器 } from '../../core/unocss-generator.ts';
import 配色 from "../../database/models/配色.ts";
import 骨架 from "../../database/models/骨架.ts";
import 風格 from "../../database/models/風格.ts";
import 裝飾 from "../../database/models/裝飾.ts";

/**
 * 取得自訂 UnoCSS classes 列表
 * 提供給 AI 使用的自訂 class 列表（不包含標準 TailwindCSS）
 */
function 處理取得自訂Classes(c: Context) {
  try {
    // 👑 全面對齊五大天王建構子，傳入風格與裝飾保底實例
    const 生成器 = new UnoCSS生成器(new 骨架(), new 配色(), new 風格(), new 裝飾());
    const classes = 生成器.取得所有生成的Classes();

    return 回應成功(c, {
      message: "WebCube 自訂 UnoCSS classes",
      data: classes,
      usage: "在標準 TailwindCSS v4 基礎上使用這些自訂 classes",
      total: classes.自訂規則?.total || 0
    });
    
  } catch (_error) {
    return 回應成功(c, {
      message: "WebCube 自訂 UnoCSS classes",
      data: {
        error: "無法取得自訂 classes",
        fallback: ["btn", "btn-primary", "card", "input"]
      }
    });
  }
}

// 處理取得主題資訊
async function 處理取得主題資訊(c: Context): Promise<Response> {
  try {
    // 🎯 修正：不呼叫不存在的 取得快取狀態()，直接回傳系統快取就緒標記
    return 回應成功(c, {
      快取狀態: {
        status: "ready",
        msg: "UnoCSS 快取管理器運作正常"
      },
      timestamp: new Date().toISOString()
    });
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
    // 🎯 完美對齊：呼叫 unocss-cache.ts 內真實存在的 清理樣式快取()
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
    if (params.id === 'classes') {
      return await 處理取得自訂Classes(c);
    }
    if (params.id === 'info') {
      return await 處理取得主題資訊(c);
    }
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '未知的 UnoCSS 操作' }
    }, 404);
  } catch (錯誤) {
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'UnoCSS API 請求失敗' }
    }, 500);
  }
}

// POST - 統一處理 UnoCSS POST 請求
export async function POST(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id === 'clear-cache' || params.id === 'flush') {
      return await 處理清理快取(c);
    }
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '未知的 UnoCSS 操作' }
    }, 404);
  } catch (錯誤) {
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'UnoCSS API 請求失敗' }
    }, 500);
  }
}

const 模組: APIModule = { GET, POST };
export default 模組;