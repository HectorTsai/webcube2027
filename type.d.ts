import {
  多國語言資料 as _多國語言資料,
  所有語言 as _所有語言,
  支援的語言 as _支援的語言,
} from "./utils/多國語言物件.ts";
import { default as _多國語言字串 } from "./utils/多國語言字串.ts";

declare global {
  // 擴展 String 原型
  interface String {
    capitalize(): string;
    capitalizeAll(): string;
    toUint8Array(): Uint8Array;
    fromUint8Array(bytes: Uint8Array): string;
    toHex(): string;
    fromHex(hex: string): string;
    toArrayBuffer(): ArrayBuffer;
    fromArrayBuffer(buffer: ArrayBuffer): string;
  }

  interface Uint8Array {
    toBase64(): string;
    fromBase64(base64String: string): Uint8Array;
    toString(): string;
    toHex(): string;
    fromHex(hex: string): Uint8Array;
    toJSON(): string; // 添加 toJSON 方法聲明，返回 base64 字串
  }

  // 多國語言相關類型
  interface MenuItem {
    id?: string;
    icon?: string;
    name?: 多國語言字串;
    link?: string;
    checked?: boolean;
    option?: string;
  }

  const 多國語言字串: {
    new (data?: any): any;
    from(json: 多國語言資料<string>): Promise<_多國語言字串>;
    is(obj: any): obj is 多國語言字串;
  };
  type 多國語言字串 = _多國語言字串;
  type 多國語言資料<T = string> = _多國語言資料<T>;
  type 支援的語言 = _支援的語言;

  // 常數
  const 所有語言: readonly 支援的語言[];
}

// 確保此檔案被視為模組
export {};
