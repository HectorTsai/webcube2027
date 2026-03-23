// Renderer Service 主要入口點
import { Context } from 'hono';
import { 產生樣式 } from '../../core/unocss.ts';
import { info, error } from '../../utils/logger.ts';

// Renderer Service 處理器
export async function 處理Renderer請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    await info('Renderer Service', `處理 ${method} ${path}`);
    
    // 只處理 GET 請求
    if (method !== 'GET') {
      return c.json({
        success: false,
        message: 'Renderer Service 只支援 GET 請求',
        error: 'METHOD_NOT_ALLOWED'
      }, 405);
    }
    
    // 根據路徑渲染不同頁面
    if (path === '/' || path === '/index' || path === '/home') {
      return await 渲染首頁(c);
    }
    
    // 主題預覽頁面
    if (path.startsWith('/theme/')) {
      const themeId = path.replace('/theme/', '');
      return await 渲染主題預覽(c, themeId);
    }
    
    // 動態頁面路由
    if (path.startsWith('/page/')) {
      const pageSlug = path.replace('/page/', '');
      return await 渲染動態頁面(c, pageSlug);
    }
    
    // 404 頁面
    return await 渲染404頁面(c);
    
  } catch (錯誤) {
    await error('Renderer Service', `Renderer 請求處理失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤 as Error);
  }
}

// 渲染首頁
async function 渲染首頁(c: Context): Promise<Response> {
  try {
    // 透過 API 取得預設值
    const [系統資訊回應, 預設配色回應, 預設骨架回應] = await Promise.all([
      fetch(`http://localhost:8000/api/v1/system/info`, {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      }),
      fetch(`http://localhost:8000/api/v1/defaults/color`, {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      }),
      fetch(`http://localhost:8000/api/v1/defaults/skeleton`, {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      })
    ]);
    
    const 系統資訊 = await 系統資訊回應.json();
    const 預設配色 = await 預設配色回應.json();
    const 預設骨架 = await 預設骨架回應.json();
    
    // 建構 HTML 內容
    const htmlContent = `
      <div class="container mx-auto p-6">
        <header class="text-center mb-8">
          <h1 class="text-4xl font-bold text-primary mb-4">
            ${系統資訊.資料?.名稱 || 'WebCube 2027'}
          </h1>
          <p class="text-lg text-base-content opacity-80">
            現代化的網站建構平台
          </p>
        </header>
        
        <main class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="card">
            <h2 class="text-xl font-semibold mb-3">系統資訊</h2>
            <p class="text-base-content opacity-70 mb-4">
              查看目前系統的配置和狀態
            </p>
            <a href="/api/v1/system/info" class="btn-primary">
              查看系統資訊
            </a>
          </div>
          
          <div class="card">
            <h2 class="text-xl font-semibold mb-3">三層查詢測試</h2>
            <p class="text-base-content opacity-70 mb-4">
              測試三層資料庫查詢功能
            </p>
            <a href="/api/v1/test/three-tier" class="btn-secondary">
              執行測試
            </a>
          </div>
          
          <div class="card">
            <h2 class="text-xl font-semibold mb-3">主題預覽</h2>
            <p class="text-base-content opacity-70 mb-4">
              預覽不同的佈景主題效果
            </p>
            <a href="/theme/preview" class="btn btn-accent">
              預覽主題
            </a>
          </div>
        </main>
        
        <footer class="text-center mt-12 pt-8 border-t border-base-300">
          <p class="text-base-content opacity-60">
            WebCube 2027 - 由三層資料庫架構驅動
          </p>
        </footer>
      </div>
    `;
    
    // 生成 CSS
    const css = await 產生樣式(htmlContent, 預設配色.資料);
    
    // 建構完整 HTML
    const fullHTML = await 建構完整HTML({
      title: 系統資訊.資料?.名稱?.toString() || 'WebCube 2027',
      description: '現代化的網站建構平台',
      content: htmlContent,
      css,
      骨架: 預設骨架.資料
    });
    
    await info('Renderer Service', '首頁渲染完成');
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('Renderer Service', `首頁渲染失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤 as Error);
  }
}

// 渲染主題預覽頁面
async function 渲染主題預覽(c: Context, themeId: string): Promise<Response> {
  try {
    // 取得指定主題或預設主題
    let 主題配色;
    if (themeId && themeId !== 'preview') {
      const 回應 = await fetch(`http://localhost:8000/api/v1/colors/${themeId}`, {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      });
      主題配色 = await 回應.json();
    } else {
      const 回應 = await fetch(`http://localhost:8000/api/v1/defaults/color`, {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      });
      主題配色 = await 回應.json();
    }
    
    // 建構主題預覽 HTML
    const htmlContent = `
      <div class="container mx-auto p-6">
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-primary mb-4">主題預覽</h1>
          <p class="text-lg text-base-content opacity-80">
            ${主題配色.資料?.名稱 || '預設主題'}
          </p>
        </header>
        
        <div class="grid gap-6">
          <!-- 色彩展示 -->
          <section class="card">
            <h2 class="text-xl font-semibold mb-4">色彩系統</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                <p class="text-sm">主色</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2"></div>
                <p class="text-sm">次色</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
                <p class="text-sm">強調色</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-neutral rounded-lg mx-auto mb-2"></div>
                <p class="text-sm">中性色</p>
              </div>
            </div>
          </section>
          
          <!-- 按鈕展示 -->
          <section class="card">
            <h2 class="text-xl font-semibold mb-4">按鈕樣式</h2>
            <div class="flex flex-wrap gap-4">
              <button class="btn-primary">主要按鈕</button>
              <button class="btn-secondary">次要按鈕</button>
              <button class="btn btn-accent">強調按鈕</button>
              <button class="btn" disabled>停用按鈕</button>
            </div>
          </section>
          
          <!-- 表單展示 -->
          <section class="card">
            <h2 class="text-xl font-semibold mb-4">表單元素</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">文字輸入</label>
                <input type="text" class="input w-full" placeholder="請輸入文字...">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">選擇框</label>
                <select class="input w-full">
                  <option>選項 1</option>
                  <option>選項 2</option>
                  <option>選項 3</option>
                </select>
              </div>
            </div>
          </section>
        </div>
        
        <div class="text-center mt-8">
          <a href="/" class="btn-secondary">返回首頁</a>
        </div>
      </div>
    `;
    
    // 生成 CSS
    const css = await 產生樣式(htmlContent, 主題配色.資料);
    
    // 建構完整 HTML
    const fullHTML = await 建構完整HTML({
      title: `主題預覽 - ${主題配色.資料?.名稱 || '預設主題'}`,
      description: '主題色彩和樣式預覽',
      content: htmlContent,
      css
    });
    
    await info('Renderer Service', `主題預覽渲染完成: ${themeId}`);
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('Renderer Service', `主題預覽渲染失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤 as Error);
  }
}

// 渲染動態頁面
async function 渲染動態頁面(c: Context, pageSlug: string): Promise<Response> {
  try {
    // TODO: 從資料庫查詢頁面內容
    await info('Renderer Service', `動態頁面渲染待實作: ${pageSlug}`);
    
    const htmlContent = `
      <div class="container mx-auto p-6">
        <div class="card text-center">
          <h1 class="text-2xl font-bold text-primary mb-4">動態頁面</h1>
          <p class="text-base-content opacity-70 mb-4">
            頁面 "${pageSlug}" 的內容尚未實作
          </p>
          <a href="/" class="btn-primary">返回首頁</a>
        </div>
      </div>
    `;
    
    const css = await 產生樣式(htmlContent);
    const fullHTML = await 建構完整HTML({
      title: `${pageSlug} - WebCube 2027`,
      description: `動態頁面: ${pageSlug}`,
      content: htmlContent,
      css
    });
    
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('Renderer Service', `動態頁面渲染失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤 as Error);
  }
}

// 渲染 404 頁面
async function 渲染404頁面(c: Context): Promise<Response> {
  const htmlContent = `
    <div class="container mx-auto p-6">
      <div class="card text-center">
        <h1 class="text-6xl font-bold text-error mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-base-content mb-4">頁面不存在</h2>
        <p class="text-base-content opacity-70 mb-6">
          抱歉，您要找的頁面不存在或已被移除。
        </p>
        <a href="/" class="btn-primary">返回首頁</a>
      </div>
    </div>
  `;
  
  const css = await 產生樣式(htmlContent);
  const fullHTML = await 建構完整HTML({
    title: '404 - 頁面不存在',
    description: '頁面不存在',
    content: htmlContent,
    css
  });
  
  return new Response(fullHTML, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染錯誤頁面
async function 渲染錯誤頁面(c: Context, 錯誤: Error): Promise<Response> {
  const htmlContent = `
    <div class="container mx-auto p-6">
      <div class="card text-center">
        <h1 class="text-4xl font-bold text-error mb-4">系統錯誤</h1>
        <p class="text-base-content opacity-70 mb-6">
          系統發生錯誤，請稍後再試。
        </p>
        <details class="text-left bg-base-200 p-4 rounded-lg mb-6">
          <summary class="cursor-pointer font-medium">錯誤詳情</summary>
          <pre class="mt-2 text-sm text-error">${錯誤.message}</pre>
        </details>
        <a href="/" class="btn-primary">返回首頁</a>
      </div>
    </div>
  `;
  
  const css = await 產生樣式(htmlContent);
  const fullHTML = await 建構完整HTML({
    title: '系統錯誤',
    description: '系統發生錯誤',
    content: htmlContent,
    css
  });
  
  return new Response(fullHTML, {
    status: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 建構完整 HTML 文件
async function 建構完整HTML(options: {
  title: string;
  description: string;
  content: string;
  css: string;
  骨架?: any;
}): Promise<string> {
  const { title, description, content, css, 骨架 } = options;
  
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- SEO Meta Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  
  <!-- Styles -->
  <style>
    ${css}
  </style>
  
  ${骨架?.載入器 ? `
  <!-- Loading Animation -->
  <style>
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--color-base-100);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.3s ease-out;
    }
    
    .loading-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
  </style>
  ` : ''}
</head>
<body>
  ${骨架?.載入器 ? `
  <div class="loading-overlay" id="loading">
    <div class="text-center">
      <div class="loading-spinner mb-4"></div>
      <p class="text-base-content opacity-70">載入中...</p>
    </div>
  </div>
  ` : ''}
  
  <main>
    ${content}
  </main>
  
  ${骨架?.載入器 ? `
  <script>
    window.addEventListener('load', function() {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 300);
      }
    });
  </script>
  ` : ''}
</body>
</html>`;
}
