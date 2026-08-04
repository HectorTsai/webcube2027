/**
 * POST /api/verify-user
 * 驗證使用者帳號密碼（bcrypt + permission merge）
 *
 * 取代舊的 data-gateway inner API，auth-gateway 現在直接：
 *   1. 透過 data-gateway CRUD API 查詢使用者
 *   2. 在本端以 bcryptjs 驗證密碼
 *   3. 在本端合併角色權限
 *
 * Request:  { 帳號: string, 密碼: string, tenant?: string }
 * Response: { success: true, data: { id, 帳號, 角色, layer, 權限 } }
 */

import type { Context } from 'hono';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';
import { mergePermissions } from '@dui/framework';

/** 從角色 ID 清單取得各角色的權限並合併 */
async function getRolePermissions(roleIds: string[]): Promise<Record<string, unknown>> {
  if (!roleIds?.length) return {};

  const dataGatewayUrl = await getDataGatewayUrl();
  const apiKey = await getDataGatewayApiKey();
  if (!apiKey) return {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };

  const roles: Record<string, unknown>[] = [];
  for (const roleId of roleIds) {
    try {
      // 透過 data-gateway L2 getById 查詢角色
      const r = await fetch(`${dataGatewayUrl}/api/l2/${roleId}`, { headers });
      const res = await r.json();
      if (res.success && res.data) roles.push(res.data);
    } catch {
      // 角色不存在則跳過
    }
  }

  return mergePermissions(roles) as unknown as Record<string, unknown>;
}

function formatUserResponse(user: Record<string, unknown>) {
  return {
    id: user.id,
    帳號: user.帳號,
    // 名稱可能為空（舊使用者/seed 未設定），回退到 帳號 確保 JWT 與 API 永遠有值
    名稱: user.名稱 || user.帳號,
    角色: user.角色 ?? [],
    layer: (user as any)._layer || 'L2',
  };
}

export async function POST(c: Context) {
  try {
    const { 帳號, 密碼, tenant } = await c.req.json();
    if (!帳號 || !密碼) {
      return c.json({ success: false, error: '請提供帳號與密碼' }, 400);
    }

    const dataGatewayUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!apiKey) {
      return c.json({ success: false, error: 'auth-gateway 尚未安裝，缺少 data-gateway API Key' }, 500);
    }

    const bcrypt = (await import('bcryptjs')) as any;

    // ── 共用 headers ──
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };

    // ── 1. 先查 L2（超級管理員） ──
    const l2Res = await fetch(
      `${dataGatewayUrl}/api/l2/使用者/使用者?帳號=${encodeURIComponent(帳號)}&limit=1`,
      { headers: baseHeaders },
    );
    const l2Data = await l2Res.json();
    const l2User = l2Data.success ? (l2Data.data as Record<string, unknown>[])?.[0] : null;

    if (l2User) {
      const match = await bcrypt.default.compare(密碼, l2User.密碼雜湊 as string);
      if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });

      const 權限 = await getRolePermissions(l2User.角色 as string[]);
      return c.json({
        success: true,
        data: { ...formatUserResponse(l2User), _layer: 'L2', 權限 },
      });
    }

    // ── 2. 查不到 + 有 tenant → 查 L3（站台管理員） ──
    if (tenant) {
      const l3Headers = { ...baseHeaders, 'X-Tenant': tenant };
      const l3Res = await fetch(
        `${dataGatewayUrl}/api/l3/使用者/使用者?帳號=${encodeURIComponent(帳號)}&limit=1`,
        { headers: l3Headers },
      );
      const l3Data = await l3Res.json();
      const l3User = l3Data.success ? (l3Data.data as Record<string, unknown>[])?.[0] : null;

      if (l3User) {
        const match = await bcrypt.default.compare(密碼, l3User.密碼雜湊 as string);
        if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });

        const 權限 = await getRolePermissions(l3User.角色 as string[]);
        return c.json({
          success: true,
          data: { ...formatUserResponse(l3User), _layer: 'L3', 權限 },
        });
      }
    }

    // ── 3. 都找不到 ──
    return c.json({ success: false, error: '帳號或密碼錯誤' });
  } catch (err) {
    return c.json(
      { success: false, error: `驗證失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}