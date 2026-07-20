// pipelines/rawParserPipeline.ts — HTML/SVG 字串拆解管線
// 職責：當 args 中拿到完整 HTML/SVG 字串時（如圖示 apiSvg），
//       拆解最外層標籤屬性（viewBox、xmlns 等），提取到 definition.attrs，
//       剝除外殼只留內部 innerHTML，指派給 definition.raw。
// 死鐵律：徹底消滅雙層 tag 污染，將外部字串降維為標準內部內容。
import { substitute, 智慧插值 } from "../../utils/安全過濾器.ts";

// ── ReDoS 防禦：限制最大輸入長度，阻斷正則回溯爆炸 ──
const MAX_RAW_LENGTH = 100_000; // 100KB，合法 SVG/HTML 絕對不會超過

export interface RawParserResult {
  definition: any;
  rawContent: string | null; // 剝除外殼後的內部 HTML
  extractedAttrs: Record<string, string>; // 從外層標籤拆出的屬性
}

export function 運行字串拆解管線(
  definition: any,
  localArgs: Record<string, unknown>,
): RawParserResult {
  // 優先使用 svg 值（使用者直接傳入的內聯 SVG 字串），其次使用 raw（apiPipeline 返回的數據）
  const rawStr = (localArgs.svg as string | undefined) || (localArgs.raw as string | undefined);
  if (!rawStr || typeof rawStr !== "string" || !definition.attrs || !definition.tag) {
    return { definition, rawContent: null, extractedAttrs: {} };
  }

  // ReDoS 防線：輸入過大直接熔斷
  if (rawStr.length > MAX_RAW_LENGTH) return { definition, rawContent: null, extractedAttrs: {} };

  const tagMatch = rawStr.match(/^<\s*(\w+)([^>]*)>/);
  if (!tagMatch) return { definition, rawContent: null, extractedAttrs: {} };

  // 提取既有屬性
  const attrString = tagMatch[2];
  const originalAttrs: Record<string, string> = {};
  const attrRegex = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = attrRegex.exec(attrString)) !== null) {
    originalAttrs[m[1]] = m[2] || m[3] || "";
  }

  // 只保留 definition.attrs 有定義的 key（過濾 class/className，這些由 stylePipeline 處理）
  const defAttrKeys = Object.keys(definition.attrs);
  const extractedAttrs: Record<string, string> = {};
  for (const key of defAttrKeys) {
    if (key === "class" || key === "className") continue;
    if (key in originalAttrs) {
      extractedAttrs[key] = originalAttrs[key];
    }
  }

  // 剝除外殼，只留內部內容
  const restAfterOpen = rawStr.slice(tagMatch[0].length);
  const rawContent = restAfterOpen.replace(/<\/\w+>\s*$/, "");

  return { definition, rawContent, extractedAttrs };
}
