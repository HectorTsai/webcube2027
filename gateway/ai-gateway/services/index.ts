/**
 * services/index.ts — ai-gateway 設定服務
 *
 * 移除 InnerAPI（不再需要內部代理路由），
 * 簡化為工具方法與啟動設定。
 */

// ── 工具方法 ──

/**
 * 從 Request 解析語言偏好
 * 優先取 cookie `lang`，其次 Accept-Language header
 */
export function 取得語言(c: { req: { header(name: string): string | undefined }; cookie?: Record<string, string> }): string {
  const cookieLang = (c as { cookie?: Record<string, string> }).cookie?.lang;
  if (cookieLang) return cookieLang;

  const accept = c.req.header('Accept-Language');
  if (accept) {
    const parsed = accept.split(',')[0]?.split('-')[0]; // "zh-TW" → "zh"
    if (parsed) return parsed;
  }
  return 'en';
}

/**
 * 從 Request host header 取得網域名稱
 */
export function 取得域名(c: { req: { header(name: string): string | undefined } }): string {
  const host = c.req.header('Host') ?? 'localhost';
  return host.split(':')[0];
}