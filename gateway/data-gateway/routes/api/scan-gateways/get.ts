/**
 * GET /api/scan-gateways
 *
 * 掃描本機埠號 8001-8010 的 /api/health，回傳所有已註冊與自動發現的閘道清單。
 * 由 data-gateway 伺服器端執行（無瀏覽器 CORS 問題），供 Alpina 匝道列表使用。
 */
 import type { Context } from 'hono';
 import { getConfig } from '../../../services/config.ts';

 // data-gateway 自身埠號，掃描時略過
 const OWN_PORT = Number(Deno.env.get('DATA_GATEWAY_PORT') || 8002);

 interface GatewayEntry {
   name: string;
   url: string;
   status: string;
 }

 export const GET = async (c: Context): Promise<Response> => {
   const host = 'localhost';
   const results: GatewayEntry[] = [];
   const seen = new Set<string>();

   // 1. 已註冊閘道（從 config 讀取）
   try {
     const stored = await getConfig().get('gateways');
     if (stored) {
       const gateways: Record<string, string> = JSON.parse(stored);
       for (const [name, url] of Object.entries(gateways)) {
         if (!seen.has(name)) {
           results.push({ name, url, status: 'registered' });
           seen.add(name);
         }
       }
     }
   } catch { /* ignore */ }

   // 2. 掃描埠號 8001-8010
   for (let port = 8001; port <= 8010; port++) {
     if (port === OWN_PORT) continue; // 略過自身
     try {
       const r = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(2000) });
       if (r.ok) {
         const data = await r.json();
         if (data && data.service && data.status === 'degraded' && !seen.has(data.service)) {
           results.push({
             name: data.service,
             url: `http://${host}:${port}`,
             status: data.status,
           });
           seen.add(data.service);
         }
       }
     } catch {
       // 埠號無回應，跳過
     }
   }

   // 3. 依名稱排序
   results.sort((a, b) => a.name.localeCompare(b.name));

   return c.json({ gateways: results });
 };