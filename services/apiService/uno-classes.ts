import { Context } from 'hono';
import { 處理取得自訂Classes, 處理取得主題資訊 } from './uno-custom-classes.ts';
import type { APIModule } from './index.ts';

// UnoCSS Classes API 模組
export default {
  // 取得所有自訂 classes
  GET: async (c: Context) => {
    return await 處理取得自訂Classes(c);
  },
  
  // 取得主題資訊
  ONE: async (c: Context) => {
    return await 處理取得主題資訊(c);
  }
} as APIModule;
