import 頁面 from "../../database/models/頁面.ts";
import 方塊 from "../../database/models/方塊.ts";
import { info, error } from "../../utils/logger.ts";

/**
 * 頁面渲染服務
 * 負責將頁面模型轉換為可渲染的 HTML
 */
export default class PageService {
  /**
   * 渲染頁面為 HTML
   */
  static async renderPage(頁面實例: 頁面, 路由參數: Record<string, string> = {}): Promise<string> {
    try {
      await info('PageService', `開始渲染頁面: ${頁面實例.路徑}`);
      
      // 1. 處理路徑參數替換
      const 處理後內容 = this.處理路徑參數(頁面實例.內容, 路由參數);
      
      // 2. 取得當前骨架的佈局設定
      const 佈局方塊ID = await this.取得佈局方塊ID();
      
      // 3. 建構佈局內容，將頁面內容注入
      const 佈局內容 = await this.建構佈局內容(佈局方塊ID, 頁面實例.方塊, 處理後內容);
      
      // 4. 渲染佈局方塊（而不是直接渲染頁面方塊）
      const html = await this.渲染方塊(佈局方塊ID, 佈局內容);
      
      await info('PageService', `頁面渲染完成: ${頁面實例.路徑}`);
      return html;
    } catch (err) {
      await error('PageService', `頁面渲染失敗: ${err.message}`);
      return this.渲染錯誤頁面(err);
    }
  }

  /**
   * 取得當前骨架的佈局方塊ID
   */
  private static async 取得佈局方塊ID(): Promise<string> {
    try {
      // TODO: 從 API 取得當前主題的骨架設定
      // 目前返回預設的經典佈局
      await info('PageService', '取得佈局方塊ID');
      return '方塊:方塊:cube-網站-經典'; // ClassicLayout
    } catch (err) {
      await error('PageService', `取得佈局方塊ID失敗: ${err.message}`);
      return '方塊:方塊:容器'; // fallback
    }
  }

  /**
   * 建構佈局內容，將頁面內容注入到佈局中
   */
  private static async 建構佈局內容(佈局方塊ID: string, 頁面方塊ID: string, 頁面內容: any): Promise<any> {
    try {
      await info('PageService', `建構佈局內容: ${佈局方塊ID} + ${頁面方塊ID}`);
      
      // TODO: 從 API 取得佈局方塊的結構定義
      // 目前返回預設的經典佈局結構
      return {
        direction: 'column',
        gap: 'none',
        children: [
          {
            方塊: '方塊:方塊:MainMenu',
            內容: {
              logo: 'WebCube 2027',
              menuItems: [
                { label: '首頁', href: '/' },
                { label: '關於我們', href: '/about' },
                { label: '聯絡我們', href: '/contact' }
              ]
            }
          },
          {
            方塊: 頁面方塊ID,  // 注入頁面方塊
            內容: 頁面內容   // 注入頁面內容
          },
          {
            方塊: '方塊:方塊:Footer',
            內容: {
              text: '© 2026 WebCube 2027. All rights reserved.',
              links: [
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' }
              ]
            }
          }
        ]
      };
    } catch (err) {
      await error('PageService', `建構佈局內容失敗: ${err.message}`);
      return {
        children: [
          {
            方塊: 頁面方塊ID,
            內容: 頁面內容
          }
        ]
      };
    }
  }

  /**
   * 處理路徑參數替換
   */
  private static 處理路徑參數(內容: any, 參數: Record<string, string>): any {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    const 處理後內容 = JSON.parse(JSON.stringify(內容));
    
    // 遞迴處理所有字串，替換 {參數名} 格式
    const 處理物件 = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        for (const [key, value] of Object.entries(參數)) {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return result;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(處理物件);
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = 處理物件(value);
        }
        return result;
      }
      
      return obj;
    };
    
    return 處理物件(處理後內容);
  }

  /**
   * 渲染單一方塊
   */
  private static async 渲染方塊(方塊ID: string, 內容: any): Promise<string> {
    try {
      // TODO: 實作方塊載入和渲染邏輯
      // 目前返回簡單的 HTML 結構，展示方塊和內容
      const 內容HTML = this.渲染內容為HTML(內容);
      
      return `
        <div class="page-content" data-cube="${方塊ID}">
          <div class="cube-info">
            <h2>方塊: ${方塊ID}</h2>
            <div class="content-display">
              ${內容HTML}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      await error('PageService', `方塊渲染失敗: ${err.message}`);
      return `<div class="error">方塊渲染失敗: ${err.message}</div>`;
    }
  }

  /**
   * 將內容轉換為 HTML 展示
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
        <h3>子方塊: ${子方塊.方塊}</h3>
        <div class="sub-cube-content">
          ${this.渲染內容為HTML(子方塊.內容)}
        </div>
      </div>
    `;
  }

  /**
   * 渲染錯誤頁面
   */
  private static 渲染錯誤頁面(err: Error): string {
    return `
      <div class="error-page">
        <h1>頁面渲染錯誤</h1>
        <p>${err.message}</p>
        <pre>${err.stack}</pre>
      </div>
    `;
  }

  /**
   * 根據路徑查找頁面
   */
  static async findPageByPath(path: string): Promise<頁面 | null> {
    try {
      await info('PageService', `查找頁面: ${path}`);
      
      // 使用內部 API 查找頁面
      // TODO: 實作真正的 API 查詢邏輯
      // 目前返回預設頁面進行測試
      
      if (path === '/' || path === '/home') {
        const 首頁 = new 頁面({
          路徑: '/',
          標題: { en: 'Home', 'zh-tw': '首頁', vi: 'Trang chủ' },
          方塊: '方塊:方塊:容器',
          內容: {
            direction: 'column',
            gap: 'lg',
            children: [
              {
                方塊: '方塊:方塊:卡片',
                內容: {
                  title: {
                    en: 'Welcome to WebCube 2027',
                    'zh-tw': '歡迎來到 WebCube 2027',
                    vi: 'Chào mừng đến với WebCube 2027'
                  },
                  content: {
                    en: 'A powerful, AI-driven website building platform',
                    'zh-tw': '一個強大、AI 驅動的網站建置平台',
                    vi: 'Một nền tảng xây dựng trang web mạnh mẽ, được điều khiển bởi AI'
                  }
                }
              }
            ]
          },
          狀態: 'PUBLISHED'
        });
        return 首頁;
      }
      
      if (path === '/about') {
        const 關於頁面 = new 頁面({
          路徑: '/about',
          標題: { en: 'About Us', 'zh-tw': '關於我們', vi: 'Về chúng tôi' },
          方塊: '方塊:方塊:容器',
          內容: {
            direction: 'column',
            children: {
              en: 'We are building the next generation of website creation tools.',
              'zh-tw': '我們正在建立下一代網站創建工具。',
              vi: 'Chúng tôi đang xây dựng các công cụ tạo trang web thế hệ tiếp theo.'
            }
          },
          狀態: 'PUBLISHED'
        });
        return 關於頁面;
      }
      
      return null;
    } catch (err) {
      await error('PageService', `查找頁面失敗: ${err.message}`);
      return null;
    }
  }

  /**
   * 解析動態路由參數
   */
  static parseRouteParams(path: string, pattern: string): Record<string, string> {
    const 參數: Record<string, string> = {};
    
    if (!pattern || !pattern.includes('{')) {
      return 參數;
    }
    
    // 簡單的路由參數解析
    // 例如: path="/users/john", pattern="/users/{username}"
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
        const paramName = patternPart.slice(1, -1);
        if (pathParts[i]) {
          參數[paramName] = pathParts[i];
        }
      }
    }
    
    return 參數;
  }
}
