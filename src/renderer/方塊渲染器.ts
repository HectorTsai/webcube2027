// 方塊渲染器 - 動態生成 JSX 元件

import { jsx } from 'hono/jsx'
import { css } from '@emotion/css'

export class 方塊渲染器 {
  private static 元件快取 = new Map<string, Function>()
  
  /**
   * 渲染方塊元件
   * @param 方塊ID 方塊唯一識別碼
   * @param 屬性 方塊屬性
   * @param 子元件 子元件
   * @returns JSX 元件
   */
  static async 渲染方塊(方塊ID: string, 屬性: any = {}, 子元件?: any): Promise<JSX.Element> {
    try {
      // 1. 從 KV 資料庫讀取方塊定義
      if (!globalThis.kv) {
        throw new Error('KV 資料庫未初始化')
      }
      
      const 方塊資料 = await globalThis.kv.取得資料(`方塊:基礎:${方塊ID}`)
      if (!方塊資料) {
        throw new Error(`方塊 ${方塊ID} 不存在`)
      }
      
      // 2. 檢查快取
      if (this.元件快取.has(方塊ID)) {
        const 元件函數 = this.元件快取.get(方塊ID)!
        return 元件函數({ ...屬性, 子元件 })
      }
      
      // 3. 動態建立元件函數
      const 元件函數 = this.建立元件函數(方塊資料)
      
      // 4. 快取元件函數
      this.元件快取.set(方塊ID, 元件函數)
      
      // 5. 渲染元件
      return 元件函數({ ...屬性, 子元件 })
      
    } catch (error) {
      console.error('[渲染器] 渲染方塊失敗:', error)
      return this.錯誤方塊(error.message, 方塊ID)
    }
  }
  
  /**
   * 建立元件函數
   * @param 方塊資料 方塊資料定義
   * @returns 元件函數
   */
  private static 建立元件函數(方塊資料: any): Function {
    try {
      // 建立安全的執行環境
      const 安全環境 = this.建立安全環境()
      
      // 動態執行元件程式碼
      const 元件函數 = new Function(
        'React', 'jsx', 'css', '安全環境',
        `
        try {
          ${方塊資料.程式碼}
          return ${方塊資料.名稱};
        } catch (error) {
          console.error('元件執行錯誤:', error);
          return 安全環境.錯誤元件(error.message, '${方塊資料.id}');
        }
        `
      )(React, jsx, css, 安全環境)
      
      return 元件函數
      
    } catch (error) {
      console.error('[渲染器] 建立元件函數失敗:', error)
      return () => this.錯誤方塊(error.message, 方塊資料.id)
    }
  }
  
  /**
   * 建立安全的執行環境
   * @returns 安全環境物件
   */
  private static 建立安全環境() {
    return {
      // 安全的 CSS 函數
      css: (樣式字串: string, 樣式物件?: any) => {
        // 驗證 CSS 樣式安全性
        if (!this.驗證CSS安全性(樣式字串)) {
          throw new Error('不安全的 CSS 樣式')
        }
        return css(樣式字串, 樣式物件)
      },
      
      // 錯誤元件
      錯誤元件: (錯誤訊息: string, 方塊ID: string) => {
        return (
          <div css={css`
            background-color: var(--b1);
            border: 2px dashed var(--error);
            border-radius: var(--radius-box);
            padding: var(--spacing-lg);
            margin: var(--spacing-md) 0;
            text-align: center;
            color: var(--error);
          `}>
            <div css={css`
              font-size: var(--text-2xl);
              margin-bottom: var(--spacing-sm);
            `}>
              ⚠️
            </div>
            <h3 css={css`
              font-weight: 600;
              margin-bottom: var(--spacing-sm);
            `}>
              方塊渲染錯誤
            </h3>
            <p css={css`
              font-size: var(--text-sm);
              margin-bottom: var(--spacing-sm);
            `}>
              {錯誤訊息}
            </p>
            <p css={css`
              font-size: var(--text-xs);
              opacity: 0.6;
            `}>
              方塊 ID: {方塊ID}
            </p>
          </div>
        )
      }
    }
  }
  
  /**
   * 驗證 CSS 樣式安全性
   * @param 樣式字串 CSS 樣式字串
   * @returns 是否安全
   */
  private static 驗證CSS安全性(樣式字串: string): boolean {
    // 危險模式檢查
    const 危險模式 = [
      /javascript:/i,
      /on\w+\s*=/i,
      /<script/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /document\./i,
      /window\./i,
      /localStorage/i,
      /fetch\s*\(/i,
      /expression\s*\(/i
    ]
    
    return !危險模式.some(模式 => 模式.test(樣式字串))
  }
  
  /**
   * 錯誤方塊
   * @param 錯誤訊息 錯誤訊息
   * @param 方塊ID 方塊ID
   * @returns 錯誤方塊 JSX
   */
  private static 錯誤方塊(錯誤訊息: string, 方塊ID: string): JSX.Element {
    return (
      <div css={css`
        background-color: var(--b1);
        border: 2px dashed var(--error);
        border-radius: var(--radius-box);
        padding: var(--spacing-lg);
        margin: var(--spacing-md) 0;
        text-align: center;
        color: var(--error);
      `}>
        <div css={css`
          font-size: var(--text-2xl);
          margin-bottom: var(--spacing-sm);
        `}>
          ⚠️
        </div>
        <h3 css={css`
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        `}>
          方塊渲染錯誤
        </h3>
        <p css={css`
          font-size: var(--text-sm);
          margin-bottom: var(--spacing-sm);
        `}>
          {錯誤訊息}
        </p>
        <p css={css`
          font-size: var(--text-xs);
          opacity: 0.6;
        `}>
          方塊 ID: {方塊ID}
        </p>
      </div>
    )
  }
  
  /**
   * 清除快取
   * @param 方塊ID 方塊ID (可選，不提供則清除所有快取)
   */
  static 清除快取(方塊ID?: string): void {
    if (方塊ID) {
      this.元件快取.delete(方塊ID)
    } else {
      this.元件快取.clear()
    }
  }
  
  /**
   * 取得快取統計
   * @returns 快取統計資訊
   */
  static 取得快取統計(): { 總數: number; 方塊列表: string[] } {
    return {
      總數: this.元件快取.size,
      方塊列表: Array.from(this.元件快取.keys())
    }
  }
}

// 佈局渲染器 - 專門處理佈局方塊的組合
export class 佈局渲染器 {
  /**
   * 渲染佈局配置
   * @param 佈局配置 佈局配置物件
   * @param 插槽 插槽內容
   * @returns JSX 元件
   */
  static async 渲染佈局(佈局配置: any, 插槽: Record<string, any> = {}): Promise<JSX.Element> {
    try {
      if (!佈局配置.元件) {
        throw new Error('佈局配置缺少元件資訊')
      }
      
      // 遞歸渲染子元件
      const 渲染子元件 = async (子元件: any): Promise<any> => {
        if (!子元件) return null
        
        if (Array.isArray(子元件)) {
          return await Promise.all(子元件.map(渲染子元件))
        }
        
        if (typeof 子元件 === 'object' && 子元件.元件) {
          const 元件 = await 方塊渲染器.渲染方塊(
            子元件.元件,
            子元件.屬性 || {},
            子元件.子元件 ? await 渲染子元件(子元件.子元件) : undefined
          )
          return 元件
        }
        
        return 子元件
      }
      
      // 渲染主元件
      const 主元件 = await 方塊渲染器.渲染方塊(
        佈局配置.元件,
        佈局配置.屬性 || {},
        佈局配置.子元件 ? await 渲染子元件(佈局配置.子元件) : undefined
      )
      
      // 提供插槽上下文
      if (Object.keys(插槽).length > 0) {
        return this.提供插槽上下文(主元件, 插槽)
      }
      
      return 主元件
      
    } catch (error) {
      console.error('[佈局渲染器] 渲染佈局失敗:', error)
      return 方塊渲染器.錯誤方塊(error.message, '佈局錯誤')
    }
  }
  
  /**
   * 提供插槽上下文
   * @param 元件 主要元件
   * @param 插槽 插槽內容
   * @returns 包含插槽的元件
   */
  private static 提供插槽上下文(元件: JSX.Element, 插槽: Record<string, any>): JSX.Element {
    // 這裡可以實現插槽機制
    // 目前簡單返回元件，未來可以擴展
    return 元件
  }
}
