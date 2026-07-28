import { raw } from 'hono/html';

const SCRIPT = `
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('site-form');
  if (!form) return;

  // L3 類型切換
  const l3Type = document.getElementById('l3_type');
  if (l3Type) {
    l3Type.addEventListener('change', () => {
      const type = l3Type.value;
      document.querySelectorAll('.l3-field').forEach(r => r.classList.add('hidden'));
      document.querySelector('.l3-field-' + type)?.classList.remove('hidden');
    });
  }

  // 語言輸入
  const addLangBtn = document.getElementById('add-lang');
  const langContainer = document.getElementById('lang-container');
  if (addLangBtn && langContainer) {
    addLangBtn.addEventListener('click', () => {
      const code = prompt('請輸入語言代碼（如 en、ja、ko）：');
      if (!code) return;
      const row = document.createElement('div');
      row.className = 'flex gap-2 items-center';
      row.innerHTML = '<input type="text" class="input input-bordered input-sm w-20 font-mono" value="' + code + '" readonly /> <input name="lang_' + code + '" type="text" class="input input-bordered input-sm flex-1" placeholder="網站名稱（' + code + '）" /> <button type="button" class="btn btn-ghost btn-xs text-error" onclick="this.parentElement.remove()">移除</button>';
      langContainer.appendChild(row);
    });
  }

  // 表單送出
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('error');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> 申請中…';

    // 收集多語言名稱
    const 名稱 = {};
    if (langContainer) {
      const langRows = langContainer.querySelectorAll('div.flex.gap-2');
      langRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
          const code = inputs[0].value;
          const val = inputs[1].value.trim();
          if (val) 名稱[code] = val;
        }
      });
    }
    const mainName = document.querySelector('[name="name_zh-tw"]');
    if (mainName && mainName.value.trim()) {
      名稱['zh-tw'] = mainName.value.trim();
    }

    const data = {
      網址: document.querySelector('[name="url"]').value.trim(),
      名稱,
      描述: { 'zh-tw': document.querySelector('[name="desc"]')?.value?.trim() || '' },
      商標: document.querySelector('[name="brand"]')?.value?.trim() || '',
      模式: document.querySelector('[name="mode"]')?.value || 'PUBLIC',
      語言: Object.keys(名稱),
      預設語言: document.querySelector('[name="defaultLang"]')?.value || 'zh-tw',
      管理員帳號: document.querySelector('[name="adminAccount"]')?.value?.trim() || '',
      管理員密碼: document.querySelector('[name="adminPassword"]')?.value?.trim() || '',
      l3: {}
    };

    // 收集 L3 連線資訊
    const type = l3Type?.value || 'mongodb';
    const l3 = { type };

    if (type === 'sqlite') {
      l3.filePath = document.querySelector('[name="l3_filePath"]')?.value?.trim() || 'tenant.db';
    } else if (type === 'firestore') {
      const fileInput = document.querySelector('input[name="l3_credential_file"]');
      if (!fileInput?.files?.[0]) {
        errEl.textContent = '請上傳服務帳號金鑰 JSON 檔';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '送出申請';
        return;
      }
      const text = await fileInput.files[0].text();
      let credential;
      try {
        credential = JSON.parse(text);
      } catch {
        errEl.textContent = '金鑰檔案格式錯誤：無法解析 JSON';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '送出申請';
        return;
      }
      if (credential.type !== 'service_account') {
        errEl.textContent = '金鑰檔案錯誤：type 必須為 "service_account"';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '送出申請';
        return;
      }
      if (!credential.project_id || !credential.private_key_id || !credential.private_key) {
        errEl.textContent = '金鑰檔案缺少必要欄位（project_id / private_key_id / private_key）';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '送出申請';
        return;
      }
      l3.host = credential.project_id;
      l3.credential = credential;
      l3.database = document.querySelector('[name="l3_databaseId"]')?.value?.trim() || '';
    } else if (type === 'appwrite') {
      l3.host = document.querySelector('[name="l3_endpoint"]')?.value?.trim() || '';
      l3.database = document.querySelector('[name="l3_project"]')?.value?.trim() || '';
      l3.password = document.querySelector('[name="l3_apiKey"]')?.value?.trim() || '';
      l3.namespace = document.querySelector('[name="l3_appwriteDbId"]')?.value?.trim() || '';
    } else if (type === 'dynamodb') {
      l3.host = document.querySelector('[name="l3_region"]')?.value?.trim() || '';
      l3.username = document.querySelector('[name="l3_accessKeyId"]')?.value?.trim() || '';
      l3.password = document.querySelector('[name="l3_secretAccessKey"]')?.value?.trim() || '';
    } else {
      // server type: mongodb, surrealdb, postgresql, mysql, mssql
      const hostEl = document.querySelector('[name="l3_host"]');
      if (hostEl) l3.host = hostEl.value.trim();
      const portEl = document.querySelector('[name="l3_port"]');
      if (portEl && portEl.value) l3.port = Number(portEl.value);
      const dbEl = document.querySelector('[name="l3_database"]');
      if (dbEl) l3.database = dbEl.value.trim();
      const userEl = document.querySelector('[name="l3_username"]');
      if (userEl) l3.username = userEl.value.trim();
      const passEl = document.querySelector('[name="l3_password"]');
      if (passEl) l3.password = passEl.value.trim();
    }

    data.l3 = l3;

    try {
      const r = await fetch('/api/site/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const res = await r.json();
      if (res.success) {
        document.getElementById('form-card').classList.add('hidden');
        document.getElementById('done').classList.remove('hidden');
      } else {
        errEl.textContent = res.error || '申請失敗';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '送出申請';
      }
    } catch {
      errEl.textContent = '無法連線至伺服器';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = '送出申請';
    }
  });

  // 觸發初始 L3 類型顯示
  if (l3Type) l3Type.dispatchEvent(new Event('change'));

  // 測試連線按鈕
  const testBtn = document.getElementById('test-connection');
  const testResult = document.getElementById('test-result');
  if (testBtn && testResult) {
    testBtn.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> 測試中…';
      testResult.textContent = '';
      testResult.className = 'text-sm';

      const type = l3Type?.value || 'mongodb';
      const l3 = { type };

      if (type === 'sqlite') {
        l3.filePath = document.querySelector('[name="l3_filePath"]')?.value?.trim() || 'tenant.db';
      } else if (type === 'firestore') {
        const fileInput = document.querySelector('input[name="l3_credential_file"]');
        if (!fileInput?.files?.[0]) {
          testResult.textContent = '請上傳服務帳號金鑰 JSON 檔';
          testResult.className = 'text-sm text-error';
          testBtn.disabled = false;
          testBtn.innerHTML = '測試連線';
          return;
        }
        const text = await fileInput.files[0].text();
        let credential;
        try { credential = JSON.parse(text); } catch {
          testResult.textContent = '金鑰檔案格式錯誤';
          testResult.className = 'text-sm text-error';
          testBtn.disabled = false;
          testBtn.innerHTML = '測試連線';
          return;
        }
        l3.host = credential.project_id;
        l3.credential = credential;
        l3.database = document.querySelector('[name="l3_databaseId"]')?.value?.trim() || '';
      } else if (type === 'appwrite') {
        l3.host = document.querySelector('[name="l3_endpoint"]')?.value?.trim() || '';
        l3.database = document.querySelector('[name="l3_project"]')?.value?.trim() || '';
        l3.password = document.querySelector('[name="l3_apiKey"]')?.value?.trim() || '';
        l3.namespace = document.querySelector('[name="l3_appwriteDbId"]')?.value?.trim() || '';
      } else if (type === 'dynamodb') {
        l3.host = document.querySelector('[name="l3_region"]')?.value?.trim() || '';
        l3.username = document.querySelector('[name="l3_accessKeyId"]')?.value?.trim() || '';
        l3.password = document.querySelector('[name="l3_secretAccessKey"]')?.value?.trim() || '';
      } else {
        const hostEl = document.querySelector('[name="l3_host"]');
        if (hostEl) l3.host = hostEl.value.trim();
        const portEl = document.querySelector('[name="l3_port"]');
        if (portEl && portEl.value) l3.port = Number(portEl.value);
        const dbEl = document.querySelector('[name="l3_database"]');
        if (dbEl) l3.database = dbEl.value.trim();
        const userEl = document.querySelector('[name="l3_username"]');
        if (userEl) l3.username = userEl.value.trim();
        const passEl = document.querySelector('[name="l3_password"]');
        if (passEl) l3.password = passEl.value.trim();
      }

      try {
        const r = await fetch('/api/site/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ l3 }),
        });
        const res = await r.json();
        if (res.success && res.data) {
          if (res.data.ok) {
            testResult.innerHTML = '&#10003; 連線成功';
            testResult.className = 'text-sm text-success';
          } else {
            testResult.innerHTML = '&#10007; ' + (res.data.message || '連線失敗');
            testResult.className = 'text-sm text-error';
          }
        } else {
          testResult.textContent = res.error || '連線測試失敗';
          testResult.className = 'text-sm text-error';
        }
      } catch {
        testResult.textContent = '無法連線至伺服器';
        testResult.className = 'text-sm text-error';
      }

      testBtn.disabled = false;
      testBtn.innerHTML = '測試連線';
    });
  }
});
`;

const Page = (c: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
    <>
      <div class="max-w-2xl w-full mx-auto px-4 py-8">

        {/* 導覽連結 */}
        <div class="text-sm breadcrumbs mb-4">
          <ul>
            <li><a href={`${prefix}/l2`}>管理後台</a></li>
            <li class="text-base-content/50">申請網站</li>
          </ul>
        </div>

        <div id="form-card" class="card bg-base-100 shadow-md">
          <div class="card-body gap-5 py-8 px-6">
            <div class="text-center">
              <h1 class="text-2xl font-bold tracking-tight">申請新網站</h1>
              <p class="text-base-content/50 text-sm mt-1">
                建立租戶網站並設定 L3 資料庫連線
              </p>
            </div>

            <form id="site-form" class="flex flex-col gap-4">

              <div class="divider text-xs text-base-content/40">網站資訊</div>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">網站網址</span>
                <input name="url" type="url" class="input input-bordered w-full" placeholder="https://example.com" required />
                <span class="label-text-alt text-xs text-base-content/40 mt-1">用於產生 tenant host 識別</span>
              </label>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">網站名稱（主要，zh-tw）</span>
                <input name="name_zh-tw" type="text" class="input input-bordered w-full" placeholder="我的網站" required />
              </label>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="label-text text-sm">其他語言名稱</span>
                  <button id="add-lang" type="button" class="btn btn-soft btn-xs">+ 新增語言</button>
                </div>
                <div id="lang-container" class="space-y-2"></div>
              </div>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">描述</span>
                <textarea name="desc" class="textarea textarea-bordered w-full" rows={2} placeholder="網站簡短描述"></textarea>
              </label>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">商標文字</span>
                <input name="brand" type="text" class="input input-bordered w-full" placeholder="MySite" />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="form-control">
                  <span class="label-text text-sm mb-1">運作模式</span>
                  <select name="mode" class="select select-bordered w-full">
                    <option value="PUBLIC">PUBLIC（公開）</option>
                    <option value="PRIVATE">PRIVATE（私有）</option>
                  </select>
                </label>
                <label class="form-control">
                  <span class="label-text text-sm mb-1">預設語言</span>
                  <select name="defaultLang" class="select select-bordered w-full">
                    <option value="zh-tw">zh-tw（繁體中文）</option>
                    <option value="en">en（English）</option>
                    <option value="ja">ja（日本語）</option>
                    <option value="ko">ko（한국어）</option>
                  </select>
                </label>
              </div>

              <div class="divider text-xs text-base-content/40">管理員帳號</div>

              <div class="grid grid-cols-2 gap-3">
                <label class="form-control">
                  <span class="label-text text-sm mb-1">管理員帳號</span>
                  <input name="adminAccount" type="text" class="input input-bordered w-full" placeholder="admin" required />
                </label>
                <label class="form-control">
                  <span class="label-text text-sm mb-1">管理員密碼</span>
                  <input name="adminPassword" type="password" class="input input-bordered w-full" required />
                </label>
              </div>

              <div class="divider text-xs text-base-content/40">L3 資料庫連線</div>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">資料庫類型</span>
                <select id="l3_type" class="select select-bordered w-full">
                  <option value="mongodb">MongoDB（推薦）</option>
                  <option value="firestore">Firestore（Google Cloud）</option>
                  <option value="surrealdb">SurrealDB</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="appwrite">Appwrite</option>
                  <option value="dynamodb">DynamoDB（AWS）</option>
                  <option value="mssql">SQL Server（MSSQL）</option>
                  <option value="sqlite">SQLite（檔案型，速度慢，不建議使用）</option>
                </select>
              </label>

              <div class="l3-field l3-field-sqlite hidden">
                <label class="form-control w-full">
                  <span class="label-text text-sm mb-1">資料庫檔名</span>
                  <input name="l3_filePath" type="text" class="input input-bordered w-full" placeholder="tenant.db" value="tenant.db" />
                  <span class="label-text-alt text-xs text-base-content/40 mt-1">存放於 data/ 目錄下</span>
                </label>
              </div>

              <div class="l3-field l3-field-server l3-field-surrealdb l3-field-postgresql l3-field-mysql l3-field-mongodb l3-field-mssql hidden">
                <div class="grid grid-cols-2 gap-3">
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">主機</span>
                    <input name="l3_host" type="text" class="input input-bordered w-full" placeholder="localhost" />
                  </label>
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">埠號</span>
                    <input name="l3_port" type="number" class="input input-bordered w-full" placeholder="3306" />
                  </label>
                </div>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">資料庫名稱</span>
                  <input name="l3_database" type="text" class="input input-bordered w-full" placeholder="webcube" />
                </label>
                <div class="grid grid-cols-2 gap-3 mt-3">
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">使用者</span>
                    <input name="l3_username" type="text" class="input input-bordered w-full" placeholder="root" />
                  </label>
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">密碼</span>
                    <input name="l3_password" type="password" class="input input-bordered w-full" />
                  </label>
                </div>
              </div>

              <div class="l3-field l3-field-firestore hidden">
                <label class="form-control w-full">
                  <span class="label-text text-sm mb-1">服務帳號金鑰 JSON 檔</span>
                  <span class="label-text-alt text-xs text-base-content/40 mb-1">Project ID 會自動從 JSON 中的 <code>project_id</code> 讀取</span>
                  <input name="l3_credential_file" type="file" accept=".json" class="file-input file-input-bordered w-full" required />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">Database ID（選填，預設為 (default)）</span>
                  <input name="l3_databaseId" type="text" class="input input-bordered w-full" placeholder="(default)" />
                </label>
              </div>

              <div class="l3-field l3-field-appwrite hidden">
                <label class="form-control w-full">
                  <span class="label-text text-sm mb-1">Endpoint</span>
                  <input name="l3_endpoint" type="url" class="input input-bordered w-full" placeholder="https://cloud.appwrite.io/v1" />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">Project ID</span>
                  <input name="l3_project" type="text" class="input input-bordered w-full" placeholder="67a..." />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">API Key</span>
                  <input name="l3_apiKey" type="password" class="input input-bordered w-full" />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">Database ID</span>
                  <input name="l3_appwriteDbId" type="text" class="input input-bordered w-full" placeholder="webcube" />
                </label>
              </div>

              <div class="l3-field l3-field-dynamodb hidden">
                <label class="form-control w-full">
                  <span class="label-text text-sm mb-1">Region</span>
                  <input name="l3_region" type="text" class="input input-bordered w-full" placeholder="us-east-1" />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">Access Key ID</span>
                  <input name="l3_accessKeyId" type="text" class="input input-bordered w-full" />
                </label>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">Secret Access Key</span>
                  <input name="l3_secretAccessKey" type="password" class="input input-bordered w-full" />
                </label>
              </div>

              <div class="flex items-center gap-3 mt-4">
                <button id="test-connection" type="button" class="btn btn-outline btn-sm">測試連線</button>
                <span id="test-result" class="text-sm"></span>
              </div>

              <div id="error" class="text-error text-sm hidden mt-1"></div>

              <button type="submit" class="btn btn-primary mt-2">送出申請</button>
            </form>
          </div>
        </div>

        <div id="done" class="card bg-base-100 shadow-md hidden">
          <div class="card-body items-center text-center gap-4 py-10">
            <div class="text-5xl text-success">&#10003;</div>
            <h2 class="text-xl font-bold">申請完成</h2>
            <p class="text-base-content/50 text-sm">網站已建立，L3 資料庫設定已加密儲存</p>
            <a href={`${prefix}/l2`} class="btn btn-primary btn-sm mt-2">返回管理後台</a>
          </div>
        </div>

      </div>

      <script>{raw(SCRIPT)}</script>
    </>
  );
};

export default Page;