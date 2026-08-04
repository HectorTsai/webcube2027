/**
 * GET /l3/:collection — Model types 列表 / getById 查詢
 *
 * 需要 X-Tenant header 指定租戶（effective_host）。
 * 無 tenant 時回傳空列表，不降級到 L2。
 */

export const GET = async (c: any) => {
  const host = c.get('effective_host');
  if (!host) {
    return c.json({
      success: true,
      data: { collection: c.req.param('collection'), source: 'L3', models: [], totalModels: 0 },
    });
  }
  const { handleCollection } = await import('../../../../utils/crud.ts');
  return handleCollection(c);
};