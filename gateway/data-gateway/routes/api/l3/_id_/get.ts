/**
 * GET /l3/:id — 通用單筆查詢
 *
 * 需要 X-Tenant header 指定租戶（effective_host）。
 * 無 tenant 時回傳 404，不降級到 L2。
 */

export const GET = async (c: any) => {
  const host = c.get('effective_host');
  if (!host) {
    return c.json({ success: false, error: 'L3 查詢需要指定租戶（X-Tenant header）' }, 404);
  }
  const { handleGetById } = await import('../../../../utils/crud.ts');
  return handleGetById(c);
};