// UnoCSS 快取管理模組
// 使用 class 封裝快取功能

import { info } from '../utils/logger.ts';

export class UnoCSS快取管理器 {
  private 樣式快取: Map<string, string>;

  constructor() {
    this.樣式快取 = new Map<string, string>();
  }

  // 清理樣式快取
  清理樣式快取(): void {
    this.樣式快取.clear();
    info('UnoCSS', '樣式快取已清理');
  }

  // 取得快取統計
  取得快取統計(): { 大小: number; 鍵列表: string[] } {
    return {
      大小: this.樣式快取.size,
      鍵列表: Array.from(this.樣式快取.keys())
    };
  }

  // 取得快取實例（如果需要直接操作）
  取得快取實例(): Map<string, string> {
    return this.樣式快取;
  }

  // 檢查快取中是否存在指定鍵
  是否存在(鍵: string): boolean {
    return this.樣式快取.has(鍵);
  }

  // 取得快取值
  取得值(鍵: string): string | undefined {
    return this.樣式快取.get(鍵);
  }

  // 設定快取值
  設定值(鍵: string, 值: string): void {
    this.樣式快取.set(鍵, 值);
  }

  // 刪除指定快取
  刪除值(鍵: string): boolean {
    return this.樣式快取.delete(鍵);
  }
}

// 建立全域快取實例
export const 快取管理器 = new UnoCSS快取管理器();
