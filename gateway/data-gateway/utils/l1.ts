import { getConfig } from '../services/config.ts';

/** 檢查 data-gateway 是否已完成安裝 */
export async function isInstalled(): Promise<boolean> {
  try {
    const connStr = await getConfig().get('l2_connection');
    return !!connStr;
  } catch {
    return false;
  }
}

export { getConfig } from '../services/config.ts';