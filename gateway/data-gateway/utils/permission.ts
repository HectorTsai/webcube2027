/**
 * 權限檢查工具
 *
 * 從 JWT payload 的 `權限` 欄位判斷使用者是否有權執行操作。
 * 支援三種權限值：true（允許）、false（拒絕）、'self'（僅限本人）。
 */

export type PermissionValue = boolean | 'self';

export interface CollectionPermission {
  讀?: PermissionValue;
  寫?: PermissionValue;
}

export interface LevelPermission {
  default?: CollectionPermission;
  [collection: string]: CollectionPermission | undefined;
}

export interface PermissionMap {
  l2?: LevelPermission;
  l3?: LevelPermission;
}

/**
 * 取得指定 collection 的權限值
 */
export function checkPermission(
  permissions: PermissionMap | undefined,
  level: 'l2' | 'l3',
  collection: string,
  action: '讀' | '寫',
): PermissionValue {
  if (!permissions) return false;
  const levelPerms = permissions[level];
  if (!levelPerms) return false;

  const colPerm = levelPerms[collection] ?? levelPerms.default;
  if (!colPerm) return false;

  return colPerm[action] ?? false;
}

/**
 * 完整的存取檢查（含 self 比對）
 *
 * @param payload JWT payload（可能為 undefined，代表未登入）
 * @param level l2 | l3
 * @param collection collection 名稱
 * @param action 讀 | 寫
 * @param authorId 資料的 `作者` 欄位（self 檢查用）
 * @returns 是否允許
 */
export function checkAccess(
  payload: Record<string, unknown> | undefined,
  level: 'l2' | 'l3',
  collection: string,
  action: '讀' | '寫',
  authorId?: string,
): boolean {
  if (!payload) return false;

  const perm = checkPermission(
    payload.權限 as PermissionMap | undefined,
    level, collection, action,
  );

  if (perm === true) return true;
  if (perm === 'self') {
    const userId = (payload.sub || payload.帳號) as string | undefined;
    if (!userId || !authorId) return false;
    return String(authorId) === String(userId);
  }
  return false;
}

/**
 * 從複合 ID 中提取 collection 名稱
 * 格式：collection:model:nanoid
 */
export function extractCollection(id: string): string | null {
  const parts = id.split(':');
  return parts.length >= 3 ? parts[0] : null;
}

/**
 * 合併多個角色的權限（取最寬鬆）
 * 用於 verify-user 端點彙整使用者各角色的權限
 */
export function mergePermissions(roles: Record<string, unknown>[]): PermissionMap {
  const result: PermissionMap = {};

  for (const role of roles) {
    const perms = role.權限 as PermissionMap | undefined;
    if (!perms) continue;

    for (const level of ['l2', 'l3'] as const) {
      const levelPerms = perms[level];
      if (!levelPerms) continue;

      if (!result[level]) result[level] = {};

      for (const [key, val] of Object.entries(levelPerms)) {
        const existing = result[level]![key];
        if (!existing) {
          result[level]![key] = { ...(val as CollectionPermission) };
        } else {
          if ((val as CollectionPermission).讀 !== undefined) {
            existing.讀 = existing.讀 || (val as CollectionPermission).讀;
          }
          if ((val as CollectionPermission).寫 !== undefined) {
            existing.寫 = existing.寫 || (val as CollectionPermission).寫;
          }
        }
      }
    }
  }

  return result;
}