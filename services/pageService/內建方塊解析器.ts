import { info, error } from "../../utils/logger.ts";

/**
 * 內建方塊解析器
 * 處理內建模式的方塊，動態載入元件並渲染
 */
export default class 內建方塊解析器 {
  /**
   * 解析內建方塊
   */
  static async 解析(方塊定義: any, 內容: any): Promise<string> {
    try {
      await info('內建方塊解析器', `解析內建方塊: ${方塊定義.元件路徑}`);
      
      // 動態 import 元件
      const 元件路徑 = `../../components/${方塊定義.元件路徑}.tsx`;
      const 元件模組 = await import(元件路徑);
      const 元件 = 元件模組.default;
      
      if (!元件) {
        throw new Error(`找不到元件: ${元件路徑}`);
      }
      
      // TODO: 實作真正的元件渲染邏輯
      // 目前返回結構化顯示
      return this.生成結構化顯示(方塊定義, 內容);
    } catch (err) {
      await error('內建方塊解析器', `內建方塊解析失敗: ${err.message}`);
      return `<div class="error">內建方塊解析失敗: ${err.message}</div>`;
    }
  }
  
  /**
   * 生成結構化顯示（開發階段）
   */
  private static 生成結構化顯示(方塊定義: any, 內容: any): string {
    const 內容HTML = this.渲染內容為HTML(內容);
    
    return `
      <div class="cube-display" data-cube-id="${方塊定義.id}" data-cube-mode="內建">
        <div class="cube-header">
          <h3>內建方塊: ${方塊定義.id}</h3>
          <span class="component-path">${方塊定義.元件路徑 || 'N/A'}</span>
        </div>
        <div class="cube-content">
          ${內容HTML}
        </div>
      </div>
    `;
  }
  
  /**
   * 將內容轉換為 HTML 顯示
   */
  private static 渲染內容為HTML(內容: any): string {
    if (typeof 內容 === 'string') {
      return `<p class="text-content">${內容}</p>`;
    }
    
    if (Array.isArray(內容)) {
      return 內容.map(item => this.渲染內容為HTML(item)).join('\n');
    }
    
    if (內容 && typeof 內容 === 'object') {
      // 檢查是否是 MultilingualString
      if (內容.en || 內容['zh-tw'] || 內容.vi) {
        return this.渲染MultilingualString(內容);
      }
      
      // 處理子方塊
      if (內容.方塊 && 內容.內容) {
        return this.渲染子方塊(內容);
      }
      
      // 一般物件
      let html = '<div class="content-object">\n';
      for (const [key, value] of Object.entries(內容)) {
        html += `  <div class="content-item">\n`;
        html += `    <strong>${key}:</strong>\n`;
        html += `    <div class="content-value">${this.渲染內容為HTML(value)}</div>\n`;
        html += `  </div>\n`;
      }
      html += '</div>';
      return html;
    }
    
    return `<div class="content-raw">${JSON.stringify(內容)}</div>`;
  }
  
  /**
   * 渲染 MultilingualString
   */
  private static 渲染MultilingualString(多語言字串: any): string {
    let html = '<div class="multilingual-content">\n';
    
    const languages = ['en', 'zh-tw', 'vi'];
    for (const lang of languages) {
      if (多語言字串[lang]) {
        html += `  <div class="lang-${lang}">\n`;
        html += `    <span class="lang-label">[${lang}]:</span>\n`;
        html += `    <span class="lang-text">${多語言字串[lang]}</span>\n`;
        html += `  </div>\n`;
      }
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * 渲染子方塊
   */
  private static 渲染子方塊(子方塊: any): string {
    return `
      <div class="sub-cube" data-cube="${子方塊.方塊}">
        <h4>子方塊: ${子方塊.方塊}</h4>
        <div class="sub-cube-content">
          ${this.渲染內容為HTML(子方塊.內容)}
        </div>
      </div>
    `;
  }
}
