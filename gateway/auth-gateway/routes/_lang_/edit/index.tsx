/**
 * GET /:lang/edit — 編輯個人資料頁面
 *
 * 功能：
 *   - 已登入使用者可編輯自己的名稱等基本資料
 *   - 非管理員／超級管理員的角色顯示「註銷帳號」按鈕
 */

import { renderToString } from 'hono/jsx/dom/server';
import { raw } from 'hono/html';

const ROLE_SUPER_ADMIN = '使用者:角色:超級管理員';
const ROLE_ADMIN = '使用者:角色:管理員';

const EditContent = ({ lang, prefix }: { lang: string; prefix: string }) => {
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-sm">
        <div class="card-body gap-5 py-8 px-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">編輯資料</h1>
            <p class="text-base-content/50 text-sm mt-1" id="user-subtitle">載入中…</p>
          </div>

          <div id="loading" class="flex items-center justify-center gap-2 text-xs text-base-content/50 py-8">
            <span class="loading loading-spinner loading-xs"></span>
            載入使用者資料…
          </div>

          <form id="edit-form" class="flex flex-col gap-3 hidden">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">帳號</span>
              <input name="帳號" type="text" class="input input-bordered w-full" disabled />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">名稱</span>
              <input name="名稱" type="text" class="input input-bordered w-full" placeholder="顯示名稱" />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">圖示</span>
              <input name="圖示" type="text" class="input input-bordered w-full" placeholder="圖示 ID（選填）" />
            </label>

            <div id="error" class="text-error text-sm hidden"></div>
            <div id="success-msg" class="text-success text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">儲存</button>
          </form>

          <div id="password-section" class="hidden">
            <div class="divider my-2"></div>
            <h2 class="text-lg font-bold mb-3">變更密碼</h2>
            <form id="password-form" class="flex flex-col gap-3">
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">目前密碼</span>
                <input name="目前密碼" type="password" class="input input-bordered w-full" placeholder="請輸入目前密碼" required />
              </label>
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">新密碼</span>
                <span class="text-xs text-base-content/40 ml-1">（至少 4 個字元）</span>
                <input name="新密碼" type="password" class="input input-bordered w-full" placeholder="請輸入新密碼" minlength={4} required />
              </label>
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">確認新密碼</span>
                <input name="confirm新密碼" type="password" class="input input-bordered w-full" placeholder="再次輸入新密碼" minlength={4} required />
              </label>
              <div id="pw-error" class="text-error text-sm hidden"></div>
              <div id="pw-success" class="text-success text-sm hidden"></div>
              <button type="submit" class="btn btn-outline btn-sm">變更密碼</button>
            </form>
          </div>

          <div id="delete-section" class="hidden">
            <div class="divider my-2"></div>
            <button id="btn-delete" class="btn btn-error btn-outline btn-sm w-full">
              註銷帳號
            </button>
            <p class="text-xs text-base-content/40 text-center mt-2">
              此操作無法復原，將永久刪除您的帳號及相關資料
            </p>
          </div>

          <p class="text-center text-xs text-base-content/40">
            <a href={`${prefix}/`} class="link link-primary text-xs">回首頁</a>
          </p>
        </div>
      </div>

      <script>{raw(`
        (async function() {
          // ── 1. 檢查是否已登入 ──
          let me;
          try {
            const r = await fetch('/api/me').then(r => r.json());
            if (!r.authenticated) throw new Error('未登入');
            me = r;
          } catch {
            window.location.href = '${prefix}/login?redirect=${encodeURIComponent(prefix + '/edit')}';
            return;
          }

          // ── 2. 載入使用者完整資料 ──
          const userId = me.id;
          const subtitle = document.getElementById('user-subtitle');
          const loading = document.getElementById('loading');
          const form = document.getElementById('edit-form');
          const errorEl = document.getElementById('error');
          const successEl = document.getElementById('success-msg');
          const deleteSection = document.getElementById('delete-section');

          let userData;
          try {
            const r = await fetch('/api/user/' + encodeURIComponent(userId)).then(r => r.json());
            if (!r.success) throw new Error(r.error || '無法載入使用者資料');
            userData = r.data;
          } catch (err) {
            loading.innerHTML = '<span class="text-error text-sm">' + (err.message || '載入失敗') + '</span>';
            return;
          }

          // ── 3. 填入表單 ──
          const 名稱 = (userData.名稱 && typeof userData.名稱 === 'object')
            ? (userData.名稱['zh-tw'] || userData.名稱['en'] || '')
            : (userData.名稱 || '');
          form.querySelector('[name="帳號"]').value = userData.帳號 || '';
          form.querySelector('[name="名稱"]').value = 名稱 || '';
          form.querySelector('[name="圖示"]').value = userData.圖示 || '';
          subtitle.textContent = userData.帳號 || '';
          loading.classList.add('hidden');
          form.classList.remove('hidden');
          document.getElementById('password-section').classList.remove('hidden');

          // ── 4. 判斷角色：非管理員才顯示註銷 ──
          const roles = me.角色 || userData.角色 || [];
          const isAdmin = roles.includes('${ROLE_SUPER_ADMIN}') || roles.includes('${ROLE_ADMIN}');
          if (!isAdmin) {
            deleteSection.classList.remove('hidden');
          }

          // ── 5. 儲存表單 ──
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.classList.add('hidden');
            successEl.classList.add('hidden');

            const data = Object.fromEntries(new FormData(e.target));
            // 只送出非空值
            const patchBody = {};
            if (data['名稱'] && data['名稱'] !== 名稱) {
              patchBody['名稱'] = { 'zh-tw': data['名稱'] };
            }
            if (data['圖示'] && data['圖示'] !== userData['圖示']) {
              patchBody['圖示'] = data['圖示'];
            }

            if (Object.keys(patchBody).length === 0) {
              successEl.textContent = '沒有需要變更的資料';
              successEl.classList.remove('hidden');
              return;
            }

            try {
              const r = await fetch('/api/user/' + encodeURIComponent(userId), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patchBody),
              });
              const res = await r.json();
              if (res.success) {
                successEl.textContent = '資料已更新';
                successEl.classList.remove('hidden');
                // 更新本地 名稱 變數供後續比對
                if (patchBody['名稱']) Object.assign(名稱, patchBody['名稱']['zh-tw']);
              } else {
                errorEl.textContent = res.error || '更新失敗';
                errorEl.classList.remove('hidden');
              }
            } catch {
              errorEl.textContent = '無法連線至認證服務';
              errorEl.classList.remove('hidden');
            }
          });

          // ── 6. 註銷帳號 ──
          const btnDelete = document.getElementById('btn-delete');
          if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
              if (!confirm('確定要註銷您的帳號？此操作無法復原！')) return;
              if (!confirm('再次確認：您確定要永久刪除此帳號？')) return;

              try {
                const r = await fetch('/api/user/' + encodeURIComponent(userId), {
                  method: 'DELETE',
                });
                const res = await r.json();
                if (res.success) {
                  alert('帳號已刪除。');
                  window.location.href = '/api/logout?redirect=${encodeURIComponent(prefix + '/')}';
                } else {
                  alert(res.error || '刪除失敗');
                }
              } catch {
                alert('無法連線至認證服務');
              }
            });
          }

          // ── 7. 變更密碼 ──
          const pwForm = document.getElementById('password-form');
          if (pwForm) {
            pwForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              const pwError = document.getElementById('pw-error');
              const pwSuccess = document.getElementById('pw-success');
              pwError.classList.add('hidden');
              pwSuccess.classList.add('hidden');

              const data = Object.fromEntries(new FormData(e.target));
              if (data['新密碼'] !== data['confirm新密碼']) {
                pwError.textContent = '兩次輸入的新密碼不一致';
                pwError.classList.remove('hidden');
                return;
              }

              try {
                const r = await fetch('/api/user/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const res = await r.json();
                if (res.success) {
                  pwSuccess.textContent = '密碼已變更，即將重新導向登入頁…';
                  pwSuccess.classList.remove('hidden');
                  setTimeout(() => {
                    window.location.href = '${prefix}/login?redirect=${encodeURIComponent(prefix + '/edit')}';
                  }, 1500);
                } else {
                  pwError.textContent = res.error || '變更密碼失敗';
                  pwError.classList.remove('hidden');
                }
              } catch {
                pwError.textContent = '無法連線至認證服務';
                pwError.classList.remove('hidden');
              }
            });
          }
        })();
      `)}</script>
    </div>
  );
};

export const GET = async (c: any) => {
  const lang = c.get('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  const { Layout } = await import('../../_layout.tsx');
  const content = EditContent({ lang, prefix });
  const layoutElement = await Layout({ title: '編輯資料', lang, children: content });
  const html = '<!DOCTYPE html>' + renderToString(layoutElement);
  return c.html(html);
};