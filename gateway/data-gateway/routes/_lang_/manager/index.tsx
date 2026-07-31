import { raw } from 'hono/html';
import { API_CONSOLE_SCRIPT } from '@dui/framework/api-console';

const Page = (c: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
    <>
      <div class="space-y-6 p-6 max-w-5xl mx-auto">

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">管理功能</h2>
            <p class="text-sm text-base-content/50">管理員可操作租戶（L3）層級的資料</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">服務狀態</h2>
            <div class="stats stats-vertical sm:stats-horizontal shadow-sm">
              <div class="stat">
                <div class="stat-title">L1 (KV Store)</div>
                <div id="l1-status" class="stat-value text-lg">-</div>
              </div>
              <div class="stat">
                <div class="stat-title">L2 (System DB)</div>
                <div id="l2-status" class="stat-value text-lg">-</div>
              </div>
              <div class="stat">
                <div class="stat-title">L3 (Tenant DB)</div>
                <div id="l3-status" class="stat-value text-lg">-</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">API 測試工具</h2>

            <div class="flex gap-2 items-end flex-wrap">
              <select id="api-method" class="select select-bordered select-sm w-24">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
              <input id="api-path" type="text" class="input input-bordered input-sm flex-1 min-w-[200px]" placeholder="/api/:collection/:model" />
              <button onclick="sendApiRequest()" class="btn btn-primary btn-sm">發送</button>
            </div>

            <div id="api-body-wrapper" class="hidden mt-2">
              <textarea id="api-body" class="textarea textarea-bordered w-full font-mono text-sm" rows={4} placeholder='請求主體 JSON，例如：&#10;{&#9;"名稱": "範例"}'></textarea>
            </div>

            <div id="api-result" class="hidden mt-3">
              <div class="flex items-center gap-2 mb-1">
                <span id="api-status" class="badge"></span>
                <span id="api-timing" class="text-xs text-base-content/50"></span>
              </div>
              <pre id="api-response" class="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto whitespace-pre-wrap"></pre>
            </div>
          </div>
        </div>
      </div>

      <script>{raw(API_CONSOLE_SCRIPT)}</script>
    </>
  );
};

export default Page;