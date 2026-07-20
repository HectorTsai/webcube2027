import { jsx } from "hono/jsx/jsx-runtime";
import { Children, cloneElement } from 'hono/jsx';
import { InnerAPI } from "../services/index.ts";
import 骨架 from "../database/models/骨架.ts";

/**
 * 核心微觀處理器：單一子節點的屬性注入與安全過濾
 * 從 processChildren 中抽取，讓單節點高速通道與陣列遍歷路徑共用同一邏輯
 */
function processSingleChild(
  child: any,
  index: number,
  baseProps: Record<string, any>,
  extraPropsFn?: (child: any, index: number) => Record<string, any>
) {
  // 過濾 null/undefined，避免 Hono stringBufferToString 崩潰
  if (child === null || child === undefined) return "";
  if (child && typeof child === 'object' && 'props' in child) {
    const childType = (child as any).type ?? (child as any).tag;

    // 🛡️ 終極防火牆 A：原生 HTML 元素（tag 為字串，如 "div", "ul"）不需傳遞 baseProps
    if (typeof childType === 'string') return child;

    const extraProps = extraPropsFn ? extraPropsFn(child, index) : {};

    // 🛡️ 終極防火牆 B：核心非同步組件（Cube / VariantComponent）
    // 不能執行 cloneElement（會損壞 Hono 非同步 VNode）
    // 數據變數（prefix, copyright 等）已由 方塊.tsx 的 父層數據 在 JSON children 遞迴路徑中注入
    // 此處僅補上 context，確保 JSX children 路徑的 context 不遺失
    const tagName = childType?.name;
    if (tagName === 'Cube' || tagName === 'VariantComponent' || childType?.toString().includes('Cube')) {
      if (child.props.context === undefined && baseProps.context !== undefined) {
        child.props.context = baseProps.context;
      }
      // color 不再由 JS 層傳遞，改由 CSS 自訂屬性（--c-current / --c-current-content）自然繼承
      return child;
    }

    const newProps: Record<string, any> = {};

    // 只在子元件沒有指定的情況下才傳入 baseProps
    const baseKeys = Object.keys(baseProps);
    for (let i = 0; i < baseKeys.length; i++) {
      const key = baseKeys[i];
      if (child.props[key] === undefined) {
        newProps[key] = baseProps[key];
      }
    }

    // 合併 extraProps
    Object.assign(newProps, extraProps);

    // 沒有新屬性時回傳原 child（避免無謂的 cloneElement 可能影響 JSX 內部屬性）
    if (Object.keys(newProps).length === 0) return child;

    return cloneElement(child, newProps);
  }
  return child;
}

/**
 * 處理 children，自動把 baseProps 傳給子元件（如果子元件沒有指定的話）
 * @param children 要處理的 children
 * @param baseProps 要傳給子元件的基礎屬性（例如 color, variant, context）
 * @param extraPropsFn 選擇性的函數，用來處理每個 child 的額外屬性
 * @returns 處理後的 children
 */
export function processChildren(
  children: any, 
  baseProps: Record<string, any>,
  extraPropsFn?: (child: any, index: number) => Record<string, any>
) {
  // 如果 children 是未定義或 null，直接回傳
  if (children === undefined || children === null) {
    return children;
  }

  // 🚀 單節點高速通道：90% 常規場景（純文字、單一方塊）直接走這裡
  // 徹底免除 Children.toArray 的陣列分配、重新排序與 GC 壓力
  if (!Array.isArray(children)) {
    return processSingleChild(children, 0, baseProps, extraPropsFn);
  }

  return Children.toArray(children as any).map((child, index) => {
    return processSingleChild(child, index, baseProps, extraPropsFn);
  });
}

// 核心優化點 A：用來記錄失敗的 import 路徑。Deno 無法快取失敗的 import，我們手動幫它阻斷
const INVALID_PATHS = new Set<string>();

async function importComponentModule(componentPath: string, variant: string): Promise<any> {
  const name = componentPath.split('/').pop() || componentPath;
  const paths = [
    `./${componentPath}/${variant}.tsx`,
    `./${componentPath}/index.tsx`,
    `./${componentPath}.tsx`,
    `./${componentPath}/${name}.tsx`,
  ];

  for (const path of paths) {
    // 如果這個路徑在之前的請求中已經失敗過了，直接跳過，避免無意義的磁碟 I/O 阻斷
    if (INVALID_PATHS.has(path)) continue;

    try {
      // 這裡完全交給 Deno 2 原生的 ESM 機制進行高速快取讀取（成功的 import 會自動快取）
      const mod = await import(path);
      if (mod.default) return mod.default;
    } catch {
      INVALID_PATHS.add(path); // 記錄此無效路徑，下次直接跳過
      continue;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🏭 Variant 工廠快取系統（多租戶安全防禦版）
// ═══════════════════════════════════════════════════════════════════════════
//
// 安全設計說明：
//   - 工廠函數本身是無狀態的（stateless），租戶資料透過 props.context 在渲染時注入
//   - skeleton 查詢使用 InnerAPI(context) → 請求級 context 已含租戶路由，骨架結果依賴 context.get/set 快取在同一個 HTTP 請求生命週期內
//   - 不同租戶共用同一份工廠函數實例是安全的：如同所有租戶共用同一個 Express route handler
//   - 真正需要防禦的是「工廠快取容量膨脹」導致 OOM，而非 tenant-to-tenant 函數實例污染
//
const variantComponentCache = new Map<string, any>();
const GLOBAL_MAX_FACTORY_LIMIT = 10000; // 全系統允許快取的工廠函數總量上限

/**
 * 獨立的組件工廠生成器（純函數，不依賴外部可變狀態）
 * 產生一個無狀態的 VariantComponent 異步函數，透過 props.context 在運行期解析租戶骨架
 */
function createVariantComponentInstance(componentPath: string, componentName: string) {
  async function VariantComponent({ variant, ...props }: any) {
    try {
      // 如果有 context 且使用者未指定 variant，則從骨架讀取預設風格
      if (props && props.context && !variant) {
        try {
          const context = props.context;

          // 🔥 防禦性鎖：快取 Promise 本身而非結果，杜絕重入鎖死（Re-entrancy Loop）
          // 同一個 SSR 請求內數百個元件同時檢查 !skeleton 時，只有第一個會發 API，
          // 其餘全部 await 同一個 Promise，避免 N 倍 API 轟炸與 OOM
          let skeletonPromise = context.get?.('skeleton_promise');

          if (!skeletonPromise) {
            skeletonPromise = (async () => {
              try {
                const res = await InnerAPI(context, `/api/v1/skeleton`);
                if (res.ok) {
                  const data = await res.json();
                  return new 骨架(data.skeleton);
                }
              } catch (_e) {
                // ignore
              }
              return null;
            })();
            context.set?.('skeleton_promise', skeletonPromise);
          }

          const skeleton = await skeletonPromise;
          if (skeleton?.風格) {
            variant = skeleton.風格[componentName] ?? skeleton.風格["default"];
          }
        } catch (_e) {
          // 不用處理
        }
      }

      // 最終預設值
      variant = variant || "solid";

      // 嘗試載入指定的 variant
      let Component = await importComponentModule(componentPath, variant);
      if (!Component) {
        Component = await importComponentModule(componentPath, "solid");
      }

      if (!Component) {
        return jsx("div", {}, `${componentPath}:${variant}`);
      }

      const result = await Component({ variant, ...props });
      return result;
    } catch (_e) {
      return jsx("div", {}, `${componentPath}:${variant}`);
    }
  }

  // 設置函數名稱，維持 Hono 組件識別能力
  Object.defineProperty(VariantComponent, 'name', {
    value: componentName,
    writable: false,
    configurable: true
  });

  return VariantComponent;
}

/**
 * 創建動態 variant 元件（帶工廠快取 + OOM 防膨脹防線）
 *
 * 快取策略：以 componentPath 為鍵（工廠函數無狀態，無需租戶隔離）。
 * 當全域快取池達到 GLOBAL_MAX_FACTORY_LIMIT 時，自動降級為拋棄式實例，
 * 犧牲該節點的 JIT 優化以守住整台伺服器的記憶體底線。
 *
 * @param componentPath 元件路徑（如 "Container"）
 */
export default function createVariantComponent(componentPath: string) {
  const cached = variantComponentCache.get(componentPath);
  if (cached) return cached;

  const componentName = componentPath.split('/').pop() || componentPath;

  // � 跨租戶防膨脹防線：快取池滿時走降級通道，現場生成拋棄式實例（不寫入快取）
  if (variantComponentCache.size >= GLOBAL_MAX_FACTORY_LIMIT) {
    return createVariantComponentInstance(componentPath, componentName);
  }

  const VariantComponent = createVariantComponentInstance(componentPath, componentName);
  variantComponentCache.set(componentPath, VariantComponent);
  return VariantComponent;
}