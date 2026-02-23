import 智慧內容, { 支援的格式 } from "./智慧內容.ts";
import 多國語言字串 from "./多國語言字串.ts";
import 翻譯 from "../service/翻譯.ts";

export async function getFormOrJson(
  req: Request,
): Promise<Record<string, any>> {
  const contentType = req.headers.get("content-type") || "";

  try {
    // 處理 JSON 請求
    if (contentType.includes("application/json")) {
      const data = await req.json();
      return processNestedFiles(data);
    }

    // 處理表單數據
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      return processFormData(formData);
    }
  } catch (error) {
    console.error("處理請求數據時出錯:", error);
  }

  return {};
}
// 處理表單數據的輔助函數
function processFormData(formData: FormData): Record<string, any> {
  const result: Record<string, any> = {};

  // 處理每個表單字段
  for (const [key, value] of formData.entries()) {
    // 如果鍵已存在，轉換為數組
    result[key] = key in result
      ? [...[result[key]].flat(), processValue(value)]
      : processValue(value);
  }

  return result;
}
// 處理單個值
function processValue(value: any): any {
  // 如果是文件，轉換為智慧內容
  return value instanceof File ? 智慧內容.from(value) : value;
}
// 遞歸處理嵌套對象
function processNestedFiles(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(processNestedFiles);

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, processNestedFiles(value)]),
  );
}
