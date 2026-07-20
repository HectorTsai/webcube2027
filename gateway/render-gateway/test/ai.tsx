// AI Service 測試頁面 — /test/ai
// 互動式測試所有 AI 端點

import { Context } from 'hono';
import { MultilingualString } from '@dui/smartmultilingual';
import type { SupportedLanguage } from '@dui/smartmultilingual';

export default async function AITestPage(c: Context) {
  // Server-side MultilingualString 測試
  const mls = new MultilingualString({ en: 'Hello, welcome to our website.' });
  const host = c.req.header('host') ? `http://${c.req.header('host')}` : undefined;
  let mlsResult = '載入中...';
  try {
    mlsResult = await mls.toStringAsync('zh-tw' as SupportedLanguage, host);
  } catch (e) {
    mlsResult = `錯誤: ${String(e)}`;
  }

  const scriptContent = `
document.addEventListener('alpine:init', () => {
  Alpine.data('aiTester', () => ({
    r1:'', r2:'', r3:'', r4:'', r5:'',
    status:'就緒',
    srcLang:'zh-tw', tgtLang:'en',
    txt:'你好，歡迎來到我們的網站',
    q:'你們公司提供什麼服務？',
    cpu:'Intel Core i3-N305',
    fk:'名稱', fv:'關於我們',
    pd:'建立一個簡潔的公司簡介頁面',
    async call(url, body, key) {
      this.status = '呼叫中: ' + url;
      this[key] = '載入中...';
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body),
        });
        const j = await r.json();
        this[key] = JSON.stringify(j, null, 2);
        this.status = '完成';
      } catch(e) {
        this[key] = '錯誤: ' + e.message;
        this.status = '錯誤';
      }
    },
  }));
});
`;

  return (
    <div class="max-w-4xl mx-auto p-6" x-data="aiTester">
      <h1 class="text-3xl font-bold mb-6">AI Service 測試面板</h1>

      {/* 翻譯 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">1. 翻譯</h2>
        <div class="flex flex-wrap gap-2 mb-2">
          <input class="input input-bordered w-20" placeholder="zh-tw" x-model="srcLang" value="zh-tw" type="text" />
          <span class="self-center">→</span>
          <input class="input input-bordered w-20" placeholder="en" x-model="tgtLang" value="en" type="text" />
        </div>
        <textarea class="textarea textarea-bordered w-full mb-2" x-model="txt" placeholder="輸入要翻譯的文字">你好，歡迎來到我們的網站</textarea>
        <button class="btn btn-primary btn-sm" type="button" x-on:click="call('/api/v1/ai/translate',{text:txt,sourceLang:srcLang,targetLangs:[tgtLang]},'r1')">
          呼叫翻譯 API
        </button>
        <pre class="text-xs bg-base-300 p-2 rounded mt-2 max-h-40 overflow-auto" x-text="r1 || '結果會顯示在這裡'"></pre>
      </div>

      {/* 客服 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">2. 客服問答</h2>
        <textarea class="textarea textarea-bordered w-full mb-2" x-model="q" placeholder="輸入客服問題">你們公司提供什麼服務？</textarea>
        <button class="btn btn-secondary btn-sm" type="button" x-on:click="call('/api/v1/ai/chat',{問題:q},'r2')">
          呼叫客服 API
        </button>
        <pre class="text-xs bg-base-300 p-2 rounded mt-2 max-h-40 overflow-auto" x-text="r2 || '結果會顯示在這裡'"></pre>
      </div>

      {/* 硬體推測 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">3. AI 小幫手 — 硬體推測</h2>
        <input class="input input-bordered w-full mb-2" x-model="cpu" placeholder="Intel i3-N305" value="Intel i3-N305" type="text" />
        <button class="btn btn-accent btn-sm" type="button" x-on:click="call('/api/v1/ai/assist/hardware',{cpu:cpu},'r3')">
          呼叫硬體推測
        </button>
        <pre class="text-xs bg-base-300 p-2 rounded mt-2 max-h-40 overflow-auto" x-text="r3 || '結果會顯示在這裡'"></pre>
      </div>

      {/* 翻譯填空 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">4. AI 小幫手 — 翻譯填空</h2>
        <div class="flex gap-2 mb-2">
          <input class="input input-bordered flex-1" x-model="fk" placeholder="欄位 key" value="名稱" type="text" />
          <input class="input input-bordered flex-1" x-model="fv" placeholder="欄位 value" value="關於我們" type="text" />
        </div>
        <button class="btn btn-info btn-sm" type="button" x-on:click="call('/api/v1/ai/assist/translate',{欄位:{[fk]:fv},sourceLang:'zh-tw',targetLangs:['en']},'r4')">
          呼叫翻譯填空
        </button>
        <pre class="text-xs bg-base-300 p-2 rounded mt-2 max-h-40 overflow-auto" x-text="r4 || '結果會顯示在這裡'"></pre>
      </div>

      {/* 頁面生成 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">5. 頁面生成</h2>
        <textarea class="textarea textarea-bordered w-full mb-2" x-model="pd" placeholder="描述想要的頁面">建立一個簡潔的公司簡介頁面</textarea>
        <button class="btn btn-warning btn-sm" type="button" x-on:click="call('/api/v1/ai/page/generate',{描述:pd,語言:'zh-tw'},'r5')">
          生成頁面
        </button>
        <pre class="text-xs bg-base-300 p-2 rounded mt-2 max-h-64 overflow-auto" x-text="r5 || '結果會顯示在這裡'"></pre>
      </div>

      {/* MultilingualString 測試 — server-side 直接渲染 */}
      <div class="card bg-base-200 mb-4 p-4">
        <h2 class="text-xl font-semibold mb-2">6. MultilingualString.toStringAsync() 測試</h2>
        <p class="text-sm mb-2">建立只有 <code class="bg-base-300 px-1 rounded">en: "Hello, welcome to our website"</code> 的 MultilingualString，<br />
        Server-side 呼叫 <code>toStringAsync("zh-tw")</code>，觸發 TranslationAdapter（快取 → AI → Google fallback）</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-xs font-semibold">en (input)</span>
            <pre class="text-xs bg-base-300 p-2 rounded mt-1">Hello, welcome to our website</pre>
          </div>
          <div>
            <span class="text-xs font-semibold">zh-tw (toStringAsync 結果)</span>
            <pre class="text-xs bg-base-300 p-2 rounded mt-1">{mlsResult}</pre>
          </div>
        </div>
      </div>

      <div class="text-xs text-base-content/50 mt-4" x-text="status"></div>
      <script dangerouslySetInnerHTML={{ __html: scriptContent }}></script>
    </div>
  );
}
