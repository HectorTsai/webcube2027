import { Context } from 'hono';

/**
 * 通用水合 API（備用）
 * 
 * 注意：主要水合邏輯已移至「動態方塊JSX解析器.解析內建方塊」，
 * 解析器會直接呼叫元件的 getHydrationScript() 並內嵌到 SSR HTML 中，
 * 不需要額外的 HTTP 請求。
 * 
 * 此 API 保留供以下場景使用：
 * - 需要 lazy load（延遲載入）水合腳本時
 * - 客戶端動態載入元件時
 * 
 * 支援路徑：/api/v1/hydrate/navigation/MainMenu
 *         /api/v1/hydrate/ui/Drawer
 *         /api/v1/hydrate/forms/Input
 */
export async function GET(c: Context): Promise<Response> {
  try {
    // 利用 API 退回機制取得完整路徑
    // 例如：navigation/MainMenu, ui/Drawer, forms/Input
    const componentPath = c.req.param('component');
    
    if (!componentPath) {
      return c.text('console.error("Component path required");', 400);
    }
    
    // 動態 import 該元件
    const componentModule = await import(`../../components/${componentPath}.tsx`);
    const hydrationData = componentModule.getHydrationScript?.();
    
    if (!hydrationData) {
      return c.text('console.error("No hydration script found");', 404);
    }
    
    // 支援物件格式與字串格式
    let script = '';
    if (typeof hydrationData === 'string') {
      // 舊版字串格式（向下相容）
      script = hydrationData;
    } else if (typeof hydrationData === 'object') {
      // 新版物件格式：組合 imports + component + initCode
      const imports = hydrationData.imports?.join('\n') || '';
      const componentStr = hydrationData.component
        ? `const MainComponent = ${hydrationData.component.toString()};`
        : '';
      const initCode = hydrationData.initCode || '';
      script = [imports, componentStr, initCode].filter(Boolean).join('\n\n');
    }
    
    console.log(`Hydration API: ${componentPath} loaded`);
    
    return c.text(script, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    });
  } catch (err) {
    const errorMsg = (err as Error).message || 'Unknown error';
    console.error('Hydration failed:', errorMsg);
    return c.text(`console.error("Hydration failed: ${errorMsg}");`, 500);
  }
}
