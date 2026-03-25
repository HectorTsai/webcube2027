import { 子方塊配置, 參數映射 } from "../database/models/方塊.ts";

/**
 * Parameter Mapper for Composition Cubes
 * 處理組合方塊的參數轉換和映射
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
   * @param 對外參數 使用者輸入的參數
   * @param 對外參數映射 參數映射規則
   * @param 子方塊 子方塊配置
   * @returns 映射後的子方塊參數
   */
  public static mapParameters(
    對外參數: Record<string, unknown>,
    對外參數映射: 參數映射,
    子方塊: 子方塊配置[]
  ): { result: MappedParameters; errors: MappingError[] } {
    const result: MappedParameters = {};
    const errors: MappingError[] = [];

    // 初始化結果物件
    子方塊.forEach((_, index) => {
      result[index.toString()] = {};
    });

    // 處理每個對外參數
    for (const [對外參數名, 映射規則] of Object.entries(對外參數映射)) {
      const 對外參數值 = 對外參數[對外參數名];
      
      if (對外參數值 === undefined) {
        // 檢查是否為必要參數
        errors.push({
          path: 對外參數名,
          message: `Required parameter '${對外參數名}' is missing`,
        });
        continue;
      }

      try {
        const 映射結果 = this.applyMapping(對外參數值, 映射規則.映射到, 子方塊);
        
        // 將映射結果合併到對應的子方塊
        for (const [子方塊索引, 參數值] of Object.entries(映射結果)) {
          if (result[子方塊索引]) {
            result[子方塊索引] = {
              ...result[子方塊索引],
              ...參數值,
            };
          }
        }
      } catch (error) {
        errors.push({
          path: 對外參數名,
          message: `Mapping failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // 合併原有的子方塊參數
    子方塊.forEach((子方塊配置, index) => {
      const indexStr = index.toString();
      result[indexStr] = {
        ...子方塊配置.參數,
        ...result[indexStr],
      };
    });

    return { result, errors };
  }

  /**
   * 應用單個參數映射
   * @param value 要映射的值
   * @param mappingPath 映射路徑，如 "子方塊[0].參數.title"
   * @param 子方塊 子方塊配置
   * @returns 映射結果
   */
  private static applyMapping(
    value: unknown,
    mappingPath: string,
    子方塊: 子方塊配置[]
  ): MappedParameters {
    const result: MappedParameters = {};

    // 解析映射路徑
    const pathMatch = mappingPath.match(/子方塊\[(\d+)\]\.參數\.(\w+)/);
    
    if (!pathMatch) {
      throw new Error(`Invalid mapping path: ${mappingPath}`);
    }

    const 子方塊索引 = pathMatch[1];
    const 參數名稱 = pathMatch[2];

    // 驗證子方塊索引
    const index = parseInt(子方塊索引, 10);
    if (index < 0 || index >= 子方塊.length) {
      throw new Error(`Sub-block index ${index} out of range`);
    }

    // 設定映射結果
    result[子方塊索引] = {
      [參數名稱]: value,
    };

    return result;
  }

  /**
   * 驗證參數映射規則
   * @param 對外參數映射 參數映射規則
   * @param 子方塊 子方塊配置
   * @returns 驗證結果
   */
  public static validateMapping(
    對外參數映射: 參數映射,
    子方塊: 子方塊配置[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [對外參數名, 映射規則] of Object.entries(對外參數映射)) {
      const mappingPath = 映射規則.映射到;
      
      // 檢查映射路徑格式
      const pathMatch = mappingPath.match(/子方塊\[(\d+)\]\.參數\.(\w+)/);
      if (!pathMatch) {
        errors.push(`Invalid mapping path for '${對外參數名}': ${mappingPath}`);
        continue;
      }

      const 子方塊索引 = parseInt(pathMatch[1], 10);
      
      // 檢查子方塊索引範圍
      if (子方塊索引 < 0 || 子方塊索引 >= 子方塊.length) {
        errors.push(`Sub-block index ${子方塊索引} out of range for '${對外參數名}'`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 生成參數映射規則的預設值
   * @param 子方塊 子方塊配置
   * @returns 預設的參數映射規則
   */
  public static generateDefaultMapping(子方塊: 子方塊配置[]): 參數映射 {
    const mapping: 參數映射 = {};

    子方塊.forEach((子方塊配置, index) => {
      const indexStr = index.toString();
      
      // 為每個子方塊的參數生成映射
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
   * @param 子方塊 子方塊配置
   * @param 方塊資料庫 方塊資料庫，用於取得子方塊的屬性定義
   * @returns 對外參數定義
   */
  public static getExternalParameterDefinition(
    子方塊: 子方塊配置[],
    方塊資料庫: Record<string, unknown> // 方塊資料庫的型別
  ): Record<string, { type: string; description: string; required: boolean }> {
    const definition: Record<string, { type: string; description: string; required: boolean }> = {};

    for (const 子方塊配置 of 子方塊) {
      const 方塊資料 = 方塊資料庫[子方塊配置.方塊ID] as Record<string, unknown>;
      
      if (!方塊資料) {
        continue;
      }

      // 取得子方塊的屬性定義
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
   * @param value 原始值
   * @param targetType 目標型別
   * @returns 轉換後的值
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
