// unocss-cache.ts
import { info } from '../utils/logger.ts';

export class UnoCSS快取管理器 {
  private 樣式快取: Map<string, string>;

  constructor() {
    this.樣式快取 = new Map<string, string>();
  }

  /**
   * 🌟 補齊幾何與色彩的黃金雜湊計算門禁
   */
  計算雜湊(html: string, 骨架: any, 配色: any, 風格?: any, 裝飾?: any): string {
    const skeletonId = 骨架?.id || 骨架?._id || 'default-sk';
    const colorId = 配色?.id || 配色?._id || 'default-cl';
    const styleId = 風格?.id || 風格?._id || 'default-st';
    const ornamentId = 裝飾?.id || 裝飾?._id || 'default-or';
    
    // 簡單快速的字串雜湊演算法
    const str = `${html}_${skeletonId}_${colorId}_${styleId}_${ornamentId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // 轉為 32 位元整數
    }
    return `uno_hash_${hash}`;
  }

  清理樣式快取(): void {
    this.樣式快取.clear();
    info('UnoCSS', '樣式快取已清理');
  }

  取得快取統計() {
    return { 大小: this.樣式快取.size, 鍵列表: Array.from(this.樣式快取.keys()) };
  }

  是否存在(鍵: string): boolean { return this.樣式快取.has(鍵); }
  
  // 🎯 確保方法名對齊 generator 的呼叫
  取得值(鍵: string): string | undefined { return this.樣式快取.get(鍵); }
  設定值(鍵: string, 值: string): void { this.樣式快取.set(鍵, 值); }
  刪除值(鍵: string): boolean { return this.樣式快取.delete(鍵); }
}

export const 快取管理器 = new UnoCSS快取管理器();