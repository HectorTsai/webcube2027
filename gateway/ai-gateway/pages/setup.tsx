// 系統安裝頁
import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";

const 安裝頁: FC = () => (
  <Layout title="系統安裝 — AI 中心">
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title text-3xl justify-center mb-2">AI 中心 — 系統安裝</h1>
          <p class="text-center text-base-content/60 mb-6">首次啟動，請設定系統參數</p>

          <form id="setupForm" class="space-y-6">
            {/* 管理員帳號 */}
            <fieldset class="border border-base-300 rounded-box p-4">
              <legend class="font-bold text-lg px-2">管理員帳號</legend>
              <div class="form-control">
                <label class="label"><span class="label-text">帳號</span></label>
                <input type="text" name="admin帳號" class="input input-bordered" value="admin" required />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">密碼</span></label>
                <input type="password" name="admin密碼" class="input input-bordered" required minlength={6} />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">確認密碼</span></label>
                <input type="password" name="admin密碼確認" class="input input-bordered" required minlength={6} />
              </div>
            </fieldset>

            {/* L2 資料庫連線 */}
            <fieldset class="border border-base-300 rounded-box p-4">
              <legend class="font-bold text-lg px-2">L2 資料庫連線</legend>
              <div class="form-control">
                <label class="label"><span class="label-text">資料庫類型</span></label>
                <select name="L2資料庫類型" class="select select-bordered">
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label"><span class="label-text">主機</span></label>
                  <input type="text" name="L2主機" class="input input-bordered" placeholder="127.0.0.1" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">端口</span></label>
                  <input type="number" name="L2端口" class="input input-bordered" placeholder="3306" value="3306" />
                </div>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">資料庫名稱</span></label>
                <input type="text" name="L2資料庫名稱" class="input input-bordered" placeholder="dui_ai_gateway" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label"><span class="label-text">使用者</span></label>
                  <input type="text" name="L2使用者" class="input input-bordered" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">密碼</span></label>
                  <input type="password" name="L2密碼" class="input input-bordered" />
                </div>
              </div>
            </fieldset>

            {/* 系統基本設定 */}
            <fieldset class="border border-base-300 rounded-box p-4">
              <legend class="font-bold text-lg px-2">系統基本設定</legend>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label"><span class="label-text">服務端口</span></label>
                  <input type="number" name="伺服器端口" class="input input-bordered" value="8000" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">日誌等級</span></label>
                  <select name="日誌等級" class="select select-bordered">
                    <option value="debug">Debug</option>
                    <option value="info" selected>Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">外部排程器 URL（選填，留空使用內建）</span></label>
                <input type="text" name="外部排程器URL" class="input input-bordered" placeholder="留空 = 使用內建排程器" />
              </div>
            </fieldset>

            <div id="errorMsg" class="alert alert-error hidden" />

            <button type="submit" class="btn btn-primary w-full">完成安裝</button>
          </form>
        </div>
      </div>
    </div>

    <script>
      {`document.getElementById("setupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = new FormData(form);
        const errorEl = document.getElementById("errorMsg");

        if (data.get("admin密碼") !== data.get("admin密碼確認")) {
          errorEl.textContent = "密碼與確認密碼不符";
          errorEl.classList.remove("hidden");
          return;
        }

        errorEl.classList.add("hidden");

        const res = await fetch("/api/v1/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin帳號: data.get("admin帳號"),
            admin密碼: data.get("admin密碼"),
            L2資料庫類型: data.get("L2資料庫類型"),
            L2主機: data.get("L2主機"),
            L2端口: parseInt(data.get("L2端口")) || 0,
            L2資料庫名稱: data.get("L2資料庫名稱"),
            L2使用者: data.get("L2使用者"),
            L2密碼: data.get("L2密碼"),
            伺服器端口: parseInt(data.get("伺服器端口")) || 8000,
            日誌等級: data.get("日誌等級"),
            外部排程器URL: data.get("外部排程器URL") || "",
          }),
        });

        const result = await res.json();
        if (result.success) {
          document.querySelector(".card-body").innerHTML = \`
            <div class="text-center py-8">
              <h2 class="text-2xl font-bold mb-4">\u2705 安裝完成</h2>
              <p class="mb-4">系統設定已儲存，請重新啟動伺服器。</p>
              <button onclick="location.reload()" class="btn btn-primary">重新載入</button>
            </div>
          \`;
        } else {
          errorEl.textContent = result.error || "安裝失敗";
          errorEl.classList.remove("hidden");
        }
      });`}
    </script>
  </Layout>
);

export default 安裝頁;
