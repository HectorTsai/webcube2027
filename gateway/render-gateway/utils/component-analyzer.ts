import { PropertySchema } from "../database/models/方塊.ts";

/**
 * Component Property Analyzer
 * 使用 Deno TypeScript Compiler API 分析 component 的 interface 和 properties
 */
export class ComponentAnalyzer {
  /**
   * 分析 component 檔案並提取 property schema
   * @param componentPath 相對路徑，如 "ui/Button"
   * @returns PropertySchema 物件
   */
  public async analyzeComponent(componentPath: string): Promise<Record<string, PropertySchema>> {
    try {
      const fullPath = `${Deno.cwd()}/components/${componentPath}.tsx`;
      
      // 檢查檔案是否存在
      try {
        await Deno.stat(fullPath);
      } catch (_error) {
        throw new Error(`Component file not found: ${fullPath}`);
      }

      // 讀取檔案內容
      const sourceCode = await Deno.readTextFile(fullPath);
      
      // 使用正則表達式分析 interface
      const schema = this.extractInterfaceFromSource(sourceCode);
      
      return schema;
    } catch (error) {
      console.error(`Error analyzing component ${componentPath}:`, error);
      throw error;
    }
  }

  /**
   * 從原始碼中提取 interface 定義
   */
  private extractInterfaceFromSource(sourceCode: string): Record<string, PropertySchema> {
    const schema: Record<string, PropertySchema> = {};
    
    // 尋找 interface Props 或類似定義
    const interfaceRegex = /export\s+interface\s+(\w*Props?)\s*{([^}]+)}/gs;
    const matches = sourceCode.matchAll(interfaceRegex);
    
    for (const match of matches) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      
      // 提取每個 property
      const propertyRegex = /(\w+)(\?)?:\s*([^;]+);?\s*(?:\/\/\s*(.+))?/g;
      const propertyMatches = interfaceBody.matchAll(propertyRegex);
      
      for (const propMatch of propertyMatches) {
        const propName = propMatch[1];
        const isOptional = propMatch[2] === "?";
        const propType = propMatch[3].trim();
        const comment = propMatch[4]?.trim() || "";
        
        schema[propName] = {
          type: this.normalizeType(propType),
          description: comment || `Property ${propName}`,
          required: !isOptional,
          default: undefined,
          // 從型別定義中提取額外資訊
          ...this.extractTypeConstraints(propType, propName),
        };
      }
    }
    
    // 如果沒找到 interface，嘗試從 JSDoc 註解提取
    if (Object.keys(schema).length === 0) {
      return this.extractFromJSDoc(sourceCode);
    }
    
    return schema;
  }

  /**
   * 從型別定義中提取約束條件
   */
  private extractTypeConstraints(typeString: string, propName: string): Partial<PropertySchema> {
    const constraints: Partial<PropertySchema> = {};
    
    // 提取聯合型別作為選項
    if (typeString.includes('|')) {
      const options = typeString.split('|')
        .map(opt => opt.trim().replace(/['"]/g, ''))
        .filter(opt => opt && !opt.includes('undefined'));
      
      if (options.length > 0) {
        constraints.options = options;
        constraints.example = options[0];
      }
    }
    
    // 根據屬性名稱推斷約束
    if (propName.includes('size') || propName.includes('Size')) {
      constraints.options = ['xs', 'sm', 'md', 'lg', 'xl'];
      constraints.example = 'md';
    }
    
    if (propName.includes('variant') || propName.includes('Variant')) {
      constraints.options = ['primary', 'secondary', 'outline', 'ghost', 'default', 'elevated'];
      constraints.example = 'primary';
    }
    
    if (propName.includes('align') || propName.includes('Align')) {
      constraints.options = ['left', 'center', 'right', 'justify'];
      constraints.example = 'left';
    }
    
    if (propName.includes('weight') || propName.includes('Weight')) {
      constraints.options = ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold'];
      constraints.example = 'semibold';
    }
    
    if (propName.includes('type') && propName.includes('Input')) {
      constraints.options = ['text', 'email', 'password', 'number', 'tel'];
      constraints.example = 'text';
    }
    
    return constraints;
  }

  /**
   * 從 JSDoc 註解提取 property 資訊
   */
  private extractFromJSDoc(sourceCode: string): Record<string, PropertySchema> {
    const schema: Record<string, PropertySchema> = {};
    
    // 尋找 JSDoc 註解中的 @param
    const jsDocRegex = /\/\*\*\s*\n([^*]|[\r\n]*|\*[^/])*\*\/\s*\n\s*(?:export\s+)?(?:default\s+)?(?:function|const)\s+\w+/gs;
    const jsDocMatches = sourceCode.matchAll(jsDocRegex);
    
    for (const match of jsDocMatches) {
      const jsDocContent = match[0];
      
      // 提取 @param 註解
      const paramRegex = /@param\s+\{([^}]+)\}\s+(\w+)(?:\s+(.+))?/g;
      const paramMatches = jsDocContent.matchAll(paramRegex);
      
      for (const paramMatch of paramMatches) {
        const paramType = paramMatch[1].trim();
        const paramName = paramMatch[2];
        const paramDesc = paramMatch[3]?.trim() || `Property ${paramName}`;
        
        schema[paramName] = {
          type: this.normalizeType(paramType),
          description: paramDesc,
          required: true, // JSDoc @param 通常預設為 required
          default: undefined,
        };
      }
    }
    
    return schema;
  }

  /**
   * 正規化型別
   */
  private normalizeType(typeString: string): PropertySchema["type"] {
    const normalized = typeString.toLowerCase().replace(/[\s<>]/g, "");
    
    if (normalized.includes("string")) return "string";
    if (normalized.includes("number")) return "number";
    if (normalized.includes("boolean")) return "boolean";
    if (normalized.includes("function")) return "function";
    if (normalized.includes("array") || normalized.endsWith("[]")) return "array";
    if (normalized.includes("object")) return "object";
    
    // 預設為 string
    return "string";
  }

  /**
   * 批次分析多個 components
   */
  public async analyzeComponents(componentPaths: string[]): Promise<Record<string, Record<string, PropertySchema>>> {
    const results: Record<string, Record<string, PropertySchema>> = {};
    
    for (const path of componentPaths) {
      try {
        results[path] = await this.analyzeComponent(path);
      } catch (error) {
        console.error(`Failed to analyze ${path}:`, error);
        results[path] = {};
      }
    }
    
    return results;
  }

  /**
   * 從 component 檔案路徑自動推斷可能的 interface 名稱
   */
  private inferInterfaceName(componentPath: string): string[] {
    const componentName = componentPath.split("/").pop() || "";
    const baseName = componentName.replace(/^[a-z]/, (match) => match.toUpperCase());
    
    return [
      `${baseName}Props`,
      `${componentName}Props`,
      "Props",
      "Properties",
    ];
  }
}

// 單例實例
export const componentAnalyzer = new ComponentAnalyzer();
