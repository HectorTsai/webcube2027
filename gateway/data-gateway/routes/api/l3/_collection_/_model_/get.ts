/**
 * GET /l3/:collection/:model — 通用列表查詢
 *
 * 需要 X-Tenant header 指定租戶（effective_host）。
 * 無 tenant 時回傳空列表，不降級到 L2。
 */

export const GET = async (c: any) => {
  const host = c.get('effective_host');
  if (!host) {
    return c.json({
      success: true,
      data: [],
      source: 'L3',
      pagination: {
        page: 1, pageSize: 50, totalPages: 0,
        limit: 50, offset: 0, count: 0, totalCount: 0,
      },
    });
  }
  const { handleList } = await import('../../../../../utils/crud.ts');
  return handleList(c);
};