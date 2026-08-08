/**
 * @dui/framework — 權限工具模組
 *
 * 角色權限（Role Permission）的共用型別與工具函式，供各 Gateway 使用：
 *
 * - auth-gateway 在本端以 `mergePermissions()` 合併使用者的多角色權限
 *   （verify-user 流程），並以 `checkAccess()` 判斷某操作是否允許。
 * - data-gateway 不再解析角色權限（純資料層），僅以 X-API-Key
 *   collection 權限表管控 Gateway 存取。
 * - 其他 Gateway（如未來的 WebCube 前端服務）如需角色權限判斷，
 *   直接自此模組取用。
 *
 * 此模組無相依、純 TypeScript，不包含任何業務邏輯。
 */

// ── 型別 ──

/**
 * 單一 collection 的權限值：
 * - `true`：新增／修改／刪除都允許
 * - `false`：新增／修改／刪除都不允許
 * - `'self'`：作者是自己時，新增／修改／刪除都允許
 * - `'new'`：只允許新增（建立），不允許修改／刪除
 */
export type PermissionValue = boolean | 'self' | 'new';

/** 單一 collection 的權限設定 */
export interface CollectionPermission {
  讀?: PermissionValue;
  寫?: PermissionValue;
}

/** 單一層級（l2 / l3）的權限表：key 為 collection 名稱，`default` 為預設權限 */
export interface LevelPermission {
  default?: CollectionPermission;
  [collection: string]: CollectionPermission | undefined;
}

/** 完整權限表：`l2` / `l3` 兩層 */
export interface PermissionMap {
  l2?: LevelPermission;
  l3?: LevelPermission;
}

// ── 查詢函式 ──

/**
 * 取得指定 collection 的權限值
 *
 * @param permissions 權限表（通常為 JWT payload 的 `權限` 欄位）
 * @param level 層級（l2 | l3）
 * @param collection collection 名稱
 * @param action 讀 | 寫
 * @returns 該 collection 的權限值（未設定為 false）
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

/** 權限動作：讀 / 寫（修改、刪除） / 新增 */
export type PermissionAction = '讀' | '寫' | '新增';

/**
 * 完整的存取檢查（含 self 比對）
 *
 * 「新增」動作讀取「寫」欄位（true / 'new' / 'self' 皆允許建立——
 * 'self' 的建立者本人即為新記錄的作者）；「寫」動作（修改／刪除）
 * 不授予 'new'（僅新增權限）。
 *
 * @param payload JWT payload（可能為 undefined，代表未登入）
 * @param level l2 | l3
 * @param collection collection 名稱
 * @param action 讀 | 寫 | 新增
 * @param authorId 資料的 `作者` 欄位（self 檢查用）
 * @returns 是否允許
 */
export function checkAccess(
  payload: Record<string, unknown> | undefined,
  level: 'l2' | 'l3',
  collection: string,
  action: PermissionAction,
  authorId?: string,
): boolean {
  if (!payload) return false;

  // 「新增」讀取「寫」欄位
  const readAction = action === '新增' ? '寫' : action;
  const perm = checkPermission(
    payload.權限 as PermissionMap | undefined,
    level, collection, readAction,
  );

  if (perm === true) return true;
  if (perm === 'self') {
    if (action === '新增') return true; // 建立者本人即作者
    const userId = (payload.sub || payload.帳號) as string | undefined;
    if (!userId || !authorId) return false;
    return String(authorId) === String(userId);
  }
  if (perm === 'new') return action === '新增'; // 僅允許新增
  return false;
}

// ── ID 工具 ──

/**
 * 從複合 ID 中提取 collection 名稱
 * 格式：collection:model:nanoid
 */
export function extractCollection(id: string): string | null {
  const parts = id.split(':');
  return parts.length >= 3 ? parts[0] : null;
}

// ── 合併函式 ──

/** 「寫」權限值合併優先權：true > 'self' > 'new' > false */
function rankWriteValue(v: PermissionValue): number {
  return v === true ? 3 : v === 'self' ? 2 : v === 'new' ? 1 : 0;
}

/** 合併兩個「寫」權限值（取優先權較高者；相等時保留現有） */
function mergeWriteValue(
  a: PermissionValue | undefined,
  b: PermissionValue | undefined,
): PermissionValue | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return rankWriteValue(b) > rankWriteValue(a) ? b : a;
}

/**
 * 合併多個角色的權限（取最寬鬆）
 *
 * 用於 verify-user 彙整使用者各角色的權限：當多個角色對同一
 * collection 的權限設定不同時，以「允許」優先合併（「寫」值依
 * true > 'self' > 'new' > false 優先）。
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
            existing.寫 = mergeWriteValue(existing.寫, (val as CollectionPermission).寫);
          }
        }
      }
    }
  }

  return result;
}
