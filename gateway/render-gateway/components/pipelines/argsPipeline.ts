// pipelines/argsPipeline.ts — 當前層私有變數供電管線
// 職責：融合 definition.args 的預設值（default）與使用者傳入的 userArgs，
//       產出當前層唯一的私有業務數據環境 localArgs。
//       同時導入 nanoid 血統鏈路（Bloodline Path），實現 Parent-Child 樹狀路徑追蹤。
// 死鐵律：只做變數的融合與覆寫，不准包含任何 HTML 屬性、CSS Class 或 @api 請求。
import type { Context } from "hono";
import { customAlphabet } from "nanoid";
import { substitute, 智慧插值, 純模板正則 } from "../../utils/安全過濾器.ts";

// ── 變體值傳播用標準鍵（與 stylePipeline 保持一致的 variant 判斷）──
const 標準Key = new Set("className style on data alpine containerClassName wrapClassName".split(" "));

/**
 * 🌊 Phase 1：變體值傳播（內嵌於 argsPipeline，步驟 4.5）
 * 將 variant 中的非標準鍵（如 fontSize、rounded、padding）注入 localArgs，
 * 確保 variant 鍵在步驟 5 集中化插值之前寫入，供後續管線使用。
 * ⚠️ 副作用：直接變異傳入的 localArgs 物件。
 */
function 傳播變體值(
  definition: any,
  localArgs: Record<string, unknown>,
): void {
  if (!definition.args) return;

  for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
    const runtimeVal = localArgs[key];
    if (runtimeVal === undefined) continue;
    const v = argDef.variants?.[String(runtimeVal)];
    if (!v) continue;
    // ① 注入選中變體的非標準鍵（如 direction=horizontal → isHorizontal: true）
    for (const [vk, vv] of Object.entries(v)) {
      if (!標準Key.has(vk)) localArgs[vk] = vv;
    }
    // ② 其他 sibling variant 的非標準鍵設為 false，
    //    防止 Phase 2 styleConditions 將其 undefined 誤判為 Alpine :class 動態綁定
    if (argDef.variants) {
      for (const [variantName, variantDef] of Object.entries(argDef.variants) as [string, any][]) {
        if (variantName === String(runtimeVal)) continue;
        for (const vk of Object.keys(variantDef)) {
          if (!標準Key.has(vk) && !(vk in v)) {
            localArgs[vk] = false;
          }
        }
      }
    }
  }
}

// 🔴 純英數字 nanoid 產生器（固定以 cb 開頭，符合 W3C HTML id 規範）
const generateCryptoId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  6,
);

function generateSafeId(): string {
  return "cb" + generateCryptoId();
}

export interface CubeEnv {
  color?: string;
  __cube_chain?: Set<string>;
  __cube_instance_path?: string; // 🔴 樹狀血統路徑環境變數
  [key: string]: unknown;
}

/**
 * 建立子供電環境 — 變數融合與血統鏈路追蹤
 * @param definition 已合併定義鏈路的完整定義
 * @param userArgs   使用者傳入的覆寫值
 * @param env        環境變數（含 currentYear 與可選的 __cube_instance_path）
 * @param _context   請求上下文（可選）
 * @param apiData    由 apiPipeline 撈回的生數據（可選）
 * @returns { localArgs, nextEnv } — 融合後的參數與延伸環境
 */
export async function 建立子供電環境(
  definition: any,
  userArgs: Record<string, unknown>,
  env: CubeEnv,
  _context?: Context,
  apiData?: Record<string, unknown>,
): Promise<{ localArgs: Record<string, unknown>; nextEnv: CubeEnv }> {
  // 1. 🔴 樹狀血統路徑（Bloodline Path）核心機制
  const parentPath = env.__cube_instance_path || "root";

  // 當前層識別符號：優先採納語意化 ID，無語意時使用 nanoid 安全碼
  const currentKey = String(userArgs.id || definition.id || generateSafeId())
    .trim()
    .replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, ""); // 保留中文與英數字

  // 串接成全宇宙唯一的家族血統鏈路識別碼，例如 "root_mainMenu_選單"
  const instanceId = `${parentPath}_${currentKey}`;

  const localArgs: Record<string, unknown> = {
    currentYear: env.currentYear as number,
    cube_instance_id: instanceId, // 🔴 將血統唯一碼注入當前層 args
  };

  // 2. 合併使用者傳入值與 API 生數據
  Object.assign(localArgs, userArgs);
  if (apiData) {
    Object.assign(localArgs, apiData);
  }

  // 3. 收集全鏈路的所有內部宣告鍵（供 htmlPropsPipeline 防外洩使用）
  //    🏎️ 快取守衛：同一定義在遞迴渲染中重複出現時，只解析一次 Set
  if (!definition.__all_internal_keys) {
    const allInternalKeys = new Set<string>();
    if (definition.args) Object.keys(definition.args).forEach(k => allInternalKeys.add(k));
    if (definition.defaults) Object.keys(definition.defaults).forEach(k => allInternalKeys.add(k));
    if (definition.mergedArgs) Object.keys(definition.mergedArgs).forEach(k => allInternalKeys.add(k));
    // 納入五態與內部機制鍵（這些永遠不應作為 HTML 屬性輸出）
    ["active", "hover", "focus", "selected", "disabled", "activeStateName", "state", "cube_instance_id", "__cube_instance_path", "_五態分類", "_mergedArgKeys"].forEach(k => allInternalKeys.add(k));
    definition.__all_internal_keys = allInternalKeys;
  }

  // 4. 從 definition.args 載入預設值（含模板插值）
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      if (argDef.default !== undefined && localArgs[key] === undefined) {
        const defaultValue = argDef.default;
        const interpolatedValue = typeof defaultValue === "string" && defaultValue.includes("{")
          ? 智慧插值(defaultValue, localArgs)
          : defaultValue;
        localArgs[key] = interpolatedValue;
      }
    }
  }

  // 4.5 🌊 變體值傳播：將 variant 非標準鍵注入 localArgs
  //       必須在集中化插值（步驟 5）之前執行，否則 variant 注入的 {key} 模板無法解析
  傳播變體值(definition, localArgs);

  // 5. 🔴 集中化插值：對所有尚未插值的純 {key} 模板字串進行一次解析
  //    這是「智慧插值集中化」的核心步驟：childPipeline/renderPipeline 不再負責插值，
  //    所有 {key} 模板統一在此處用 localArgs（已含 userArgs + apiData + defaults）解析。
  //    注意：只處理純模板引用（如 "{parentSize}"），不處理含有複雜字串的值。
  for (const [key, value] of Object.entries(localArgs)) {
    if (typeof value === "string" && 純模板正則.test(value)) {
      const resolved = 智慧插值(value, localArgs);
      if (typeof resolved === "string" && !純模板正則.test(resolved)) {
        localArgs[key] = resolved;
      }
    }
  }

  // 6. 建立延伸環境變數，讓血統識別碼隨 Wave 3 遞迴傳遞給所有子孫方塊
  const nextEnv: CubeEnv = {
    ...env,
    __cube_instance_path: instanceId,
    // 🛡️ 深拷貝血統鏈：確保並行子方塊各自持有獨立 Set，防止跨分支污染
    __cube_chain: env.__cube_chain ? new Set(env.__cube_chain) : undefined,
  };

  return { localArgs, nextEnv };
}
