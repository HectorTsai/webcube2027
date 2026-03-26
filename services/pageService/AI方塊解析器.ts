import { info, error } from "../../utils/logger.ts";

/**
 * AI 方塊解析器
 * 處理 AI 模式的方塊，執行生成的程式碼
 */
export default class AI方塊解析器 {
  /**
   * 解析 AI 方塊
   */
  static async 解析(方塊定義: any, 內容: any): Promise<string> {
    try {
      await info('AI方塊解析器', `解析AI方塊: ${方塊定義.id}`);
      
      if (!方塊定義.程式碼) {
        throw new Error(`AI方塊缺少程式碼: ${方塊定義.id}`);
      }
      
      // TODO: 實作 Hono JSX 到 HTML 的轉換
      // 目前返回結構化顯示
      return this.生成結構化顯示(方塊定義, 內容);
    } catch (err) {
      await error('AI方塊解析器', `AI方塊解析失敗: ${err.message}`);
      return `<div class="error">AI方塊解析失敗: ${err.message}</div>`;
    }
  }
  
  /**
   * 生成結構化顯示（開發階段）
   */
  private static 生成結構化顯示(方塊定義: any, 內容: any): string {
    const 內容HTML = this.渲染內容為HTML(內容);
    
    return `
      <div class="cube-display" data-cube-id="${方塊定義.id}" data-cube-mode="AI">
        <div class="cube-header">
          <h3>AI方塊: ${方塊定義.id}</h3>
          <span class="code-snippet">${方塊定義.程式碼 ? '有程式碼' : '無程式碼'}</span>
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
