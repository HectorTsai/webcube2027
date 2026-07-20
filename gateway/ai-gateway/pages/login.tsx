// 登入頁面
import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";

const 登入頁: FC = () => (
  <Layout title="登入 — AI 中心">
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-sm bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title text-2xl justify-center mb-4">AI 中心</h1>

          <form id="loginForm" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">帳號</span></label>
              <input
                type="text"
                id="帳號"
                class="input input-bordered"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">密碼</span></label>
              <input
                type="password"
                id="密碼"
                class="input input-bordered"
                required
                autocomplete="current-password"
              />
            </div>

            <div id="errorMsg" class="alert alert-error hidden" />

            <button type="submit" class="btn btn-primary w-full">登入</button>
          </form>
        </div>
      </div>
    </div>

    <script>
      {`document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById("errorMsg");
        errorEl.classList.add("hidden");

        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            帳號: document.getElementById("帳號").value,
            密碼: document.getElementById("密碼").value,
          }),
        });

        const result = await res.json();
        if (result.success) {
          localStorage.setItem("token", result.data.token);
          window.location.href = "/system";
        } else {
          errorEl.textContent = result.error || "登入失敗";
          errorEl.classList.remove("hidden");
        }
      });`}
    </script>
  </Layout>
);

export default 登入頁;
