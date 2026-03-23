// 暫時使用 any 類型，後續會替換為具體的 Hono Context 類型
// deno-lint-ignore-file no-explicit-any

// 錯誤代碼常數
export const 錯誤代碼 = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN', 
  DELETE_PROTECTED: 'DELETE_PROTECTED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type 錯誤代碼類型 = typeof 錯誤代碼[keyof typeof 錯誤代碼];

// 資料來源類型
export type 資料來源 = 'site' | 'system' | 'default';

// 成功回應介面
export interface 成功回應<T = any> {
  成功: true;
  資料: T;
  來源: 資料來源;
}

// 錯誤回應介面
export interface 錯誤回應 {
  成功: false;
  錯誤: {
    代碼: 錯誤代碼類型;
    訊息: string;
    狀態碼: number;
  };
}

// API 回應類型
export type API回應<T = any> = 成功回應<T> | 錯誤回應;

// 成功回應建構函數
export function 建立成功回應<T>(
  資料: T,
  來源: 資料來源 = 'default'
): 成功回應<T> {
  return {
    成功: true,
    資料,
    來源
  };
}

// 錯誤回應建構函數
export function 建立錯誤回應(
  代碼: 錯誤代碼類型,
  訊息: string,
  狀態碼: number
): 錯誤回應 {
  return {
    成功: false,
    錯誤: {
      代碼,
      訊息,
      狀態碼
    }
  };
}

// 常用錯誤回應建構函數
export const 錯誤回應建構器 = {
  找不到資源: (訊息 = '找不到指定的資源') => 
    建立錯誤回應(錯誤代碼.NOT_FOUND, 訊息, 404),
    
  禁止操作: (訊息 = '禁止執行此操作') => 
    建立錯誤回應(錯誤代碼.FORBIDDEN, 訊息, 403),
    
  刪除保護: (訊息 = '此資源受保護，無法刪除') => 
    建立錯誤回應(錯誤代碼.DELETE_PROTECTED, 訊息, 403),
    
  驗證錯誤: (訊息 = '資料驗證失敗') => 
    建立錯誤回應(錯誤代碼.VALIDATION_ERROR, 訊息, 422),
    
  請求錯誤: (訊息 = '請求格式錯誤') => 
    建立錯誤回應(錯誤代碼.BAD_REQUEST, 訊息, 400),
    
  內部錯誤: (訊息 = '伺服器內部錯誤') => 
    建立錯誤回應(錯誤代碼.INTERNAL_ERROR, 訊息, 500)
};

// Hono Context 回應輔助函數 (暫時使用 any，後續會引入正確的 Context 類型)
export function 回應成功<T>(
  c: any,
  資料: T,
  來源: 資料來源 = 'default',
  狀態碼 = 200
) {
  return c.json(建立成功回應(資料, 來源), 狀態碼);
}

export function 回應錯誤(
  c: any,
  錯誤回應: 錯誤回應
) {
  return c.json(錯誤回應, 錯誤回應.錯誤.狀態碼);
}

// 分頁資料介面
export interface 分頁資訊 {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface 分頁資料<T> {
  items: T[];
  pagination: 分頁資訊;
}

// 分頁回應建構函數
export function 建立分頁回應<T>(
  項目: T[],
  分頁: 分頁資訊,
  來源: 資料來源 = 'default'
): 成功回應<分頁資料<T>> {
  return 建立成功回應({
    items: 項目,
    pagination: 分頁
  }, 來源);
}
