import { 子方塊配置, 參數映射 } from "../database/models/方塊.ts";

/**
 * Parameter Mapper for Composition Cubes
 * 處理組合方塊的參數轉換和映射
 * 
 * 支援功能：
 * 1. 深層路徑映射（如 子方塊[0].children[1].attributes.id）
 * 2. 模板變數替換（如 ${name}、${variant}）
 * 3. 一個參數映射到多個目標（用分號分隔）
 * 4. context 自動傳遞
 */

export interface MappedParameters {
  [子方塊索引: string]: Record<string, unknown>;
}

export interface MappingError {
  path: string;
  message: string;
}

export class ParameterMapper {
  /**
   * 將對外參數映射到各個子方塊
   * @param 子方塊 子方塊配置
   * @param 對外參數映射 參數映射規則
   * @param 外部內容 使用者輸入的參數
   * @returns 映射後的子方塊配置
   */
  public static mapParameters(
    子方塊: 子方塊配置[],
    對外參數映射: 參數映射,
    外部內容: Record<string, unknown>
  ): { result: 子方塊配置[]; errors: MappingError[] } {
    const errors: MappingError[] = [];
    
    // 深拷貝子方塊配置，避免修改原始資料
    const 處理後子方塊 = JSON.parse(JSON.stringify(子方塊)) as 子方塊配置[];

    // 處理每個對外參數映射規則
    for (const [對外參數名, 映射規則] of Object.entries(對外參數映射)) {
      const 外部參數值 = 外部內容[對外參數名];
      
      if (外部參數值 === undefined || 外部參數值 === null) {
        continue;
      }

      try {
        // 支援多個映射路徑（用分號分隔）
        const 路徑陣列 = 映射規則.映射到.split(';').map(p => p.trim());
        
        for (const 映射路徑 of 路徑陣列) {
          this.applyMappingToPath(處理後子方塊, 映射路徑, 外部參數值);
        }
      } catch (error) {
        errors.push({
          path: 對外參數名,
          message: `Mapping failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // 處理模板變數替換（在子方塊配置中查找 ${變數名} 並替換）
    for (const 子方塊配置 of 處理後子方塊) {
      this.replaceTemplateVariables(子方塊配置.參數, 外部內容);
    }

    return { result: 處理後子方塊, errors };
  }

  /**
   * 將值映射到指定路徑
   */
  private static applyMappingToPath(
    子方塊: 子方塊配置[],
    mappingPath: string,
    value: unknown
  ): void {
    // 解析路徑：子方塊[索引].路徑
    const cubeMatch = mappingPath.match(/^子方塊\[(\d+)\]\.(.+)$/);
    
    if (!cubeMatch) {
      throw new Error(`Invalid mapping path: ${mappingPath}`);
    }

    const 子方塊索引 = parseInt(cubeMatch[1], 10);
    const 內部路徑 = cubeMatch[2];

    if (子方塊索引 < 0 || 子方塊索引 >= 子方塊.length) {
      throw new Error(`Sub-block index ${子方塊索引} out of range`);
    }

    // 將值設定到內部路徑
    this.setValueAtPath(子方塊[子方塊索引].參數, 內部路徑, value);
  }

  /**
   * 設定值到指定路徑（支援深層嵌套）
   * 例如：children[1].attributes.id
   */
  private static setValueAtPath(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (part.type === 'property' && part.key) {
        if (!(part.key in current)) {
          current[part.key] = {};
        }
        current = current[part.key] as Record<string, unknown>;
      } else if (part.type === 'index' && part.index !== undefined) {
        if (!Array.isArray(current)) {
          throw new Error(`Expected array at path, but got ${typeof current}`);
        }
        while (current.length <= part.index) {
          current.push({});
        }
        if (current[part.index] === undefined || current[part.index] === null) {
          current[part.index] = {};
        }
        current = current[part.index] as Record<string, unknown>;
      }
    }

    // 設定最後一個路徑的值
    const lastPart = parts[parts.length - 1];
    if (lastPart.type === 'property' && lastPart.key) {
      current[lastPart.key] = value;
    } else if (lastPart.type === 'index' && lastPart.index !== undefined) {
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at path, but got ${typeof current}`);
      }
      while (current.length <= lastPart.index) {
        current.push({});
      }
      current[lastPart.index] = value;
    }
  }

  /**
   * 解析路徑字串
   * 例如：children[1].attributes.id -> [{type:'property',key:'children'}, {type:'index',index:1}, {type:'property',key:'attributes'}, {type:'property',key:'id'}]
   */
  private static parsePath(path: string): Array<{type: 'property' | 'index'; key?: string; index?: number}> {
    const parts: Array<{type: 'property' | 'index'; key?: string; index?: number}> = [];
    const regex = /(\w+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1]) {
        parts.push({ type: 'property', key: match[1] });
      } else if (match[2] !== undefined) {
        parts.push({ type: 'index', index: parseInt(match[2], 10) });
      }
    }

    return parts;
  }

  /**
   * 替換模板變數（遞迴處理物件中的所有字串）
   * 例如：${name} -> "birth_date"
   */
  private static replaceTemplateVariables(
    obj: Record<string, unknown>,
    variables: Record<string, unknown>
  ): void {
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'string') {
        // 替換字串中的模板變數
        obj[key] = this.replaceStringTemplate(value, variables);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // 遞迴處理物件
        this.replaceTemplateVariables(value as Record<string, unknown>, variables);
      } else if (Array.isArray(value)) {
        // 處理陣列
        value.forEach((item, index) => {
          if (typeof item === 'string') {
            value[index] = this.replaceStringTemplate(item, variables);
          } else if (item && typeof item === 'object') {
            this.replaceTemplateVariables(item as Record<string, unknown>, variables);
          }
        });
      }
    }
  }

  /**
   * 替換字串中的模板變數
   */
  private static replaceStringTemplate(
    str: string,
    variables: Record<string, unknown>
  ): string {
    return str.replace(/\$\{(\w+)\}/g, (match, varName) => {
      if (varName in variables) {
        const value = variables[varName];
        // 如果值是物件或陣列，轉為 JSON 字串
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return String(value);
      }
      return match; // 找不到變數時保留原樣
    });
  }

  /**
   * 驗證參數映射規則
   */
  public static validateMapping(
    對外參數映射: 參數映射,
    子方塊: 子方塊配置[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [對外參數名, 映射規則] of Object.entries(對外參數映射)) {
      const 路徑陣列 = 映射規則.映射到.split(';').map(p => p.trim());
      
      for (const mappingPath of 路徑陣列) {
        const cubeMatch = mappingPath.match(/^子方塊\[(\d+)\]\.(.+)$/);
        
        if (!cubeMatch) {
          errors.push(`Invalid mapping path for '${對外參數名}': ${mappingPath}`);
          continue;
        }

        const 子方塊索引 = parseInt(cubeMatch[1], 10);
        
        if (子方塊索引 < 0 || 子方塊索引 >= 子方塊.length) {
          errors.push(`Sub-block index ${子方塊索引} out of range for '${對外參數名}'`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 生成參數映射規則的預設值
   */
  public static generateDefaultMapping(子方塊: 子方塊配置[]): 參數映射 {
    const mapping: 參數映射 = {};

    子方塊.forEach((子方塊配置, index) => {
      const indexStr = index.toString();
      
      for (const [參數名, _參數值] of Object.entries(子方塊配置.參數)) {
        const 對外參數名 = `${子方塊配置.方塊ID}_${參數名}`;
        mapping[對外參數名] = {
          映射到: `子方塊[${indexStr}].參數.${參數名}`,
        };
      }
    });

    return mapping;
  }

  /**
   * 取得組合方塊的對外參數定義
   */
  public static getExternalParameterDefinition(
    子方塊: 子方塊配置[],
    方塊資料庫: Record<string, unknown>
  ): Record<string, { type: string; description: string; required: boolean }> {
    const definition: Record<string, { type: string; description: string; required: boolean }> = {};

    for (const 子方塊配置 of 子方塊) {
      const 方塊資料 = 方塊資料庫[子方塊配置.方塊ID] as Record<string, unknown>;
      
      if (!方塊資料) {
        continue;
      }

      const 屬性定義 = (方塊資料.屬性定義 as Record<string, unknown>) || {};
      
      for (const [參數名, 屬性資訊] of Object.entries(屬性定義)) {
        const 屬性物件 = 屬性資訊 as Record<string, unknown>;
        const 對外參數名 = `${子方塊配置.方塊ID}_${參數名}`;
        
        definition[對外參數名] = {
          type: String(屬性物件.type || "string"),
          description: `Parameter for ${子方塊配置.方塊ID}: ${String(屬性物件.description || "")}`,
          required: Boolean(屬性物件.required || false),
        };
      }
    }

    return definition;
  }

  /**
   * 轉換參數值型別
   */
  public static convertParameterValue(value: unknown, targetType: string): unknown {
    switch (targetType) {
      case "string": {
        return String(value);
      }
      case "number": {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }
      case "boolean": {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          return value.toLowerCase() === "true" || value === "1";
        }
        return Boolean(value);
      }
      case "array": {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return [value];
          }
        }
        return [value];
      }
      case "object": {
        if (typeof value === "object" && value !== null) return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        return {};
      }
      default: {
        return value;
      }
    }
  }
}
