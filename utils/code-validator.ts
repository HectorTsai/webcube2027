/**
 * Code Validator for AI-generated Components
 * 檢查 AI 生成的 JSX 程式碼是否符合安全性要求
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CodeValidator {
  private static readonly FORBIDDEN_PATTERNS = [
    // 禁止 import 語句
    /\bimport\s+\w+/gi,
    /\bimport\s+{[^}]*}\s+from\s+['"][^'"]*['"]/gi,
    /\bimport\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*['"]/gi,
    /\brequire\s*\(/gi,
    
    // 禁止 JavaScript 程式碼
    /\bfunction\s+\w+\s*\(/gi,
    /\bconst\s+\w+\s*=\s*\(/gi,
    /\blet\s+\w+\s*=\s*\(/gi,
    /\bvar\s+\w+\s*=\s*\(/gi,
    /\bclass\s+\w+/gi,
    
    // 禁止危險的全域物件
    /\bwindow\./gi,
    /\bdocument\./gi,
    /\bglobal\./gi,
    /\bprocess\./gi,
    /\bconsole\./gi,
    
    // 禁止 eval 和類似函數
    /\beval\s*\(/gi,
    /\bFunction\s*\(/gi,
    /\bsetTimeout\s*\(/gi,
    /\bsetInterval\s*\(/gi,
    
    // 禁止存取本地檔案
    /\bDeno\./gi,
    /\bfetch\s*\(/gi,
    /\bXMLHttpRequest/gi,
    
    // 禁止危險的運算式
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  private static readonly REQUIRED_PATTERNS = [
    // 必須包含 JSX 元素
    /<\w+[^>]*>/gi,
    /<\/\w+>/gi,
  ];

  private static readonly ALLOWED_JSX_PATTERNS = [
    // 允許的 JSX 屬性
    /\w+\s*=\s*{[^}]*}/gi,
    /\w+\s*=\s*['"][^'"]*['"]/gi,
    
    // 允許的條件渲染
    /{[^}]*\?[^:]*:[^}]*}/gi,
    /{[^}]*&&[^}]*}/gi,
    
    // 允許的 map 函數（用於列表渲染）
    /\.map\s*\(\s*\([^)]*\)\s*=>\s*<[^>]+>/gi,
  ];

  /**
   * 驗證 AI 生成的 JSX 程式碼
   * @param code AI 生成的 JSX 程式碼
   * @returns 驗證結果
   */
  public static validateCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 檢查禁止的模式
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      const matches = code.match(pattern);
      if (matches) {
        errors.push(`Forbidden pattern detected: ${matches[0]}`);
      }
    }

    // 檢查必要的模式
    let hasJSXElement = false;
    for (const pattern of this.REQUIRED_PATTERNS) {
      if (pattern.test(code)) {
        hasJSXElement = true;
        break;
      }
    }

    if (!hasJSXElement) {
      errors.push("Code must contain JSX elements");
    }

    // 檢查程式碼長度
    if (code.length > 10000) {
      warnings.push("Code is quite long, consider simplifying");
    }

    // 檢查巢狀深度
    const maxDepth = this.calculateJSXDepth(code);
    if (maxDepth > 10) {
      warnings.push(`JSX nesting depth (${maxDepth}) is quite high`);
    }

    // 檢查是否有未閉合的標籤
    const unclosedTags = this.findUnclosedTags(code);
    if (unclosedTags.length > 0) {
      errors.push(`Unclosed tags detected: ${unclosedTags.join(", ")}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 計算 JSX 巢狀深度
   */
  private static calculateJSXDepth(code: string): number {
    let depth = 0;
    let maxDepth = 0;
    
    const openTagRegex = /<\w+[^>]*>/g;
    const closeTagRegex = /<\/\w+>/g;
    const selfClosingRegex = /<\w+[^>]*\/>/g;
    
    // 先移除自閉合標籤
    const cleanCode = code.replace(selfClosingRegex, '');
    
    // 計算開啟標籤
    const openMatches = cleanCode.match(openTagRegex);
    const closeMatches = cleanCode.match(closeTagRegex);
    
    if (openMatches && closeMatches) {
      const openTags = openMatches.map(tag => tag.replace(/<(\w+).*/, '$1'));
      const closeTags = closeMatches.map(tag => tag.replace(/<\/(\w+)>/, '$1'));
      
      for (let i = 0; i < openTags.length; i++) {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
        
        // 找到對應的關閉標籤
        if (i < closeTags.length && openTags[i] === closeTags[i]) {
          depth--;
        }
      }
    }
    
    return maxDepth;
  }

  /**
   * 找出未閉合的標籤
   */
  private static findUnclosedTags(code: string): string[] {
    const openTags: string[] = [];
    const _unclosed: string[] = [];
    
    const openTagRegex = /<(\w+)[^>]*>/g;
    const closeTagRegex = /<\/(\w+)>/g;
    const selfClosingRegex = /<(\w+)[^>]*\/>/g;
    
    // 先處理自閉合標籤
    const selfClosingMatches = code.match(selfClosingRegex);
    if (selfClosingMatches) {
      // 自閉合標籤不需要配對
    }
    
    // 處理開啟標籤
    const openMatches = code.match(openTagRegex);
    if (openMatches) {
      for (const match of openMatches) {
        const tagName = match.replace(/<(\w+).*/, '$1');
        openTags.push(tagName);
      }
    }
    
    // 處理關閉標籤
    const closeMatches = code.match(closeTagRegex);
    if (closeMatches) {
      for (const match of closeMatches) {
        const tagName = match.replace(/<\/(\w+)>/, '$1');
        const index = openTags.lastIndexOf(tagName);
        if (index !== -1) {
          openTags.splice(index, 1);
        }
      }
    }
    
    return openTags;
  }

  /**
   * 快速檢查（用於寫入資料庫前的基本驗證）
   */
  public static quickValidate(code: string): boolean {
    // 只檢查最重要的安全性問題
    const criticalPatterns = [
      /\bimport\s+/gi,
      /\brequire\s*\(/gi,
      /\beval\s*\(/gi,
      /\bDeno\./gi,
      /\bwindow\./gi,
      /\bdocument\./gi,
      /javascript:/gi,
    ];

    for (const pattern of criticalPatterns) {
      if (pattern.test(code)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 清理程式碼（移除不必要的空白和註解）
   */
  public static sanitizeCode(code: string): string {
    return code
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\/\*[^*]*\*\/|\/\/.*$/gm, '');
  }
}

