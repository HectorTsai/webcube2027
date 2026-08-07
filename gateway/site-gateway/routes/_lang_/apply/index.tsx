/**
 * GET /:lang/apply — 申請網站頁面（兩階段引導：安裝後、尚未有任何網站時自動導向）
 *
 * 網域自動取自目前瀏覽器的 hostname（無需手動輸入），
 * 表單送出後呼叫 POST /api/site/apply（SitePool 延遲寫入 L2 網站資訊 + 委託 auth-gateway 建立管理員）。
 */

export default function ApplyPage({ lang }: { lang?: string }) {
  const prefix = `/${lang || 'zh-tw'}`;
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-md">
        <div class="card-body gap-4 py-8 px-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">申請網站</h1>
            <p class="text-base-content/50 text-sm mt-1">建立第一個網站並設定管理員帳號</p>
          </div>

          <form id="apply-form" class="flex flex-col gap-4">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">網域（Domain）</span>
              <input id="domain-display" type="text" class="input input-bordered w-full" readonly tabindex={-1} />
              <span class="label-text-alt text-xs text-base-content/50 mt-1">
                自動取自目前瀏覽器的網址（hostname）
              </span>
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">網站名稱</span>
              <input name="名稱" type="text" class="input input-bordered w-full"
                placeholder="例如：我的網站" required />
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">描述（選填）</span>
              <input name="描述" type="text" class="input input-bordered w-full"
                placeholder="一句話描述這個網站" />
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">商標（選填）</span>
              <input name="商標" type="text" class="input input-bordered w-full"
                placeholder="品牌名稱或標語" />
            </label>

            <div class="divider my-1">資料庫連線</div>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">資料庫類型</span>
              <select id="l3_type" name="l3_type" class="select select-bordered w-full">
                <option value="mongodb">MongoDB（推薦）</option>
                <option value="firestore">Firestore（Google Cloud）</option>
                <option value="surrealdb">SurrealDB</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="appwrite">Appwrite</option>
                <option value="dynamodb">DynamoDB（AWS）</option>
                <option value="mssql">SQL Server（MSSQL）</option>
                <option value="sqlite">SQLite（檔案型）</option>
              </select>
            </label>

            <div class="l3-field l3-field-sqlite">
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">資料庫檔名</span>
                <input id="l3_filePath" name="l3_filePath" type="text" class="input input-bordered w-full"
                  placeholder="./data/domain.db" />
                <span class="label-text-alt text-xs text-base-content/50 mt-1">
                  儲存在 data-gateway 的資料目錄下（預設以網域為檔名）
                </span>
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
                  <span class="label-text text-sm mb-1">資料庫帳號</span>
                  <input name="l3_username" type="text" class="input input-bordered w-full" placeholder="root" />
                </label>
                <label class="form-control">
                  <span class="label-text text-sm mb-1">資料庫密碼</span>
                  <input name="l3_password" type="password" class="input input-bordered w-full" />
                </label>
              </div>
              <span class="label-text-alt text-xs text-base-content/50 mt-1 block">
                此為資料庫連線帳密，非網站管理員帳號
              </span>
            </div>

            <div class="l3-field l3-field-firestore hidden">
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">服務帳號金鑰 JSON 檔</span>
                <span class="label-text-alt text-xs text-base-content/50 mb-1">
                  Project ID 會自動從 JSON 中的 <code>project_id</code> 讀取
                </span>
                <input name="l3_credential_file" type="file" accept=".json" class="file-input file-input-bordered w-full" />
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

            <button type="button" id="test-connection" class="btn btn-outline btn-sm w-full mt-1">
              測試連線
            </button>
            <p id="test-result" class="text-xs mt-1 hidden"></p>

            {/* ── 現有使用者資料警告（連線測試成功後動態顯示） ── */}
            <div id="existing-users-warning" class="hidden">
              <div class="alert alert-warning text-xs py-2 px-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                <span id="existing-users-msg"></span>
              </div>
              <label class="label cursor-pointer justify-start gap-2 mt-1">
                <input id="clear-users" type="checkbox" class="checkbox checkbox-xs" />
                <span class="label-text text-xs">清除所有現有使用者資料</span>
              </label>
            </div>

            <div class="divider my-1">管理員帳號</div>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">帳號</span>
              <input name="admin_帳號" type="text" class="input input-bordered w-full"
                placeholder="此網站的管理員帳號" required />
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">密碼</span>
              <input name="admin_密碼" type="password" class="input input-bordered w-full"
                placeholder="請輸入密碼" required minlength={8} />
              <span class="label-text-alt text-xs text-base-content/50 mt-1">
                至少 8 個字元
              </span>
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">確認密碼</span>
              <input name="admin_確認密碼" type="password" class="input input-bordered w-full"
                placeholder="再次輸入密碼" required minlength={8} />
              <span class="label-text-alt text-xs text-base-content/50 mt-1">
                請再次輸入相同密碼（至少 8 個字元）
              </span>
            </label>

            <div id="error" class="text-error text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">建立網站</button>
          </form>

          <script dangerouslySetInnerHTML={{
            __html: `
            // 網域自動取自目前瀏覽器的 hostname（無需手動輸入）
            const domain = window.location.hostname;
            document.getElementById('domain-display').value = domain;

            // SQLite 檔名預設以網域為名（儲存在 data-gateway 的資料目錄下）
            const filePathInput = document.getElementById('l3_filePath');
            if (filePathInput) filePathInput.value = './data/' + domain + '.db';

            // 資料庫類型切換：顯示對應的連線欄位
            const l3TypeSelect = document.getElementById('l3_type');
            if (l3TypeSelect) {
              l3TypeSelect.addEventListener('change', () => {
                const t = l3TypeSelect.value;
                document.querySelectorAll('.l3-field').forEach(r => r.classList.add('hidden'));
                document.querySelector('.l3-field-' + t)?.classList.remove('hidden');
              });
              l3TypeSelect.dispatchEvent(new Event('change'));
            }

            // 依表單資料組 L3 連線設定（submit / 測試連線共用）；驗證失敗拋出 Error
            async function buildL3(data) {
              const l3Type = data['l3_type'] || 'sqlite';
              const l3 = { type: l3Type };

              if (l3Type === 'sqlite') {
                l3.filePath = data['l3_filePath'] || ('./data/' + domain + '.db');
              } else if (l3Type === 'firestore') {
                const fileInput = document.querySelector('input[name="l3_credential_file"]');
                if (!fileInput?.files?.[0]) throw new Error('請上傳服務帳號金鑰 JSON 檔');
                let credential;
                try {
                  credential = JSON.parse(await fileInput.files[0].text());
                } catch {
                  throw new Error('金鑰檔案格式錯誤：無法解析 JSON');
                }
                if (credential.type !== 'service_account') {
                  throw new Error('金鑰檔案錯誤：type 必須為 "service_account"');
                }
                l3.host = credential.project_id;
                l3.credential = credential;
                l3.database = data['l3_databaseId'] || '';
              } else if (l3Type === 'appwrite') {
                l3.host = data['l3_endpoint'] || '';
                l3.database = data['l3_project'] || '';
                l3.password = data['l3_apiKey'] || '';
                l3.namespace = data['l3_appwriteDbId'] || '';
              } else if (l3Type === 'dynamodb') {
                l3.host = data['l3_region'] || '';
                l3.username = data['l3_accessKeyId'] || '';
                l3.password = data['l3_secretAccessKey'] || '';
              } else {
                l3.host = data['l3_host'] || '';
                l3.port = data['l3_port'] ? Number(data['l3_port']) : undefined;
                l3.database = data['l3_database'] || 'webcube';
                l3.username = data['l3_username'] || '';
                l3.password = data['l3_password'] || '';
              }
              return l3;
            }

            // 測試連線：組 l3 → POST /api/site/test-connection
            document.getElementById('test-connection')?.addEventListener('click', async () => {
              const data = Object.fromEntries(new FormData(document.getElementById('apply-form')));
              const resultEl = document.getElementById('test-result');
              const warningEl = document.getElementById('existing-users-warning');
              resultEl.classList.remove('hidden', 'text-success', 'text-error');
              resultEl.textContent = '測試中…';
              if (warningEl) warningEl.classList.add('hidden');
              try {
                const l3 = await buildL3(data);
                const r = await fetch('/api/site/test-connection', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ l3 }),
                });
                const res = await r.json();
                if (res.success) {
                  resultEl.textContent = '✓ 連線成功';
                  resultEl.classList.add('text-success');

                  // 檢查是否已有使用者資料
                  if (res.existingUserCount > 0) {
                    const msgEl = document.getElementById('existing-users-msg');
                    if (msgEl) {
                      msgEl.textContent = '此資料庫已有 ' + res.existingUserCount + ' 筆使用者資料。若 _crypto_key 已變更，舊資料將無法解密。不清除則相同帳號名稱將無法建立。';
                    }
                    if (warningEl) warningEl.classList.remove('hidden');
                  }
                } else {
                  resultEl.textContent = '✗ ' + (res.error || '連線失敗');
                  resultEl.classList.add('text-error');
                }
              } catch (err) {
                resultEl.textContent = '✗ ' + (err.message || '連線測試失敗');
                resultEl.classList.add('text-error');
              }
            });

            document.getElementById('apply-form')?.addEventListener('submit', async (e) => {
              e.preventDefault();
              const form = e.target;
              const data = Object.fromEntries(new FormData(form));
              const errEl = document.getElementById('error');

              // 密碼至少 8 個字元
              if (String(data['admin_密碼'] || '').length < 8) {
                errEl.textContent = '密碼至少需要 8 個字元';
                errEl.classList.remove('hidden');
                return;
              }

              // 確認密碼與密碼必須一致，避免打錯字
              if (data['admin_密碼'] !== data['admin_確認密碼']) {
                errEl.textContent = '兩次輸入的密碼不一致';
                errEl.classList.remove('hidden');
                return;
              }

              try {
                // 依資料庫類型組 L3 連線設定（含 firestore 金鑰讀取，失敗會 throw）
                const l3 = await buildL3(data);

                // admin 欄位以巢狀物件送出；domain 自動帶入；l3 為資料庫連線設定
                const clearCheckbox = document.getElementById('clear-users');
                const payload = {
                  domain,
                  名稱: data['名稱'],
                  描述: data['描述'] || undefined,
                  商標: data['商標'] || undefined,
                  l3,
                  clearUsers: clearCheckbox ? clearCheckbox.checked : false,
                  admin: {
                    帳號: data['admin_帳號'],
                    密碼: data['admin_密碼'],
                  },
                };
                const r = await fetch('/api/site/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const res = await r.json();
                if (res.success) {
                  window.location.href = '\${prefix}/';
                } else {
                  errEl.textContent = res.error || '申請失敗';
                  errEl.classList.remove('hidden');
                }
              } catch (err) {
                errEl.textContent = err.message || '無法連線至服務';
                errEl.classList.remove('hidden');
              }
            });
            `
          }} />
        </div>
      </div>
    </div>
  );
}
