/**
 * GET /:lang/register — 註冊頁面
 */

import { renderToString } from 'hono/jsx/dom/server';
import { raw } from 'hono/html';
import { sign, verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';
import { resolveTenant } from '../../../utils/tenant.ts';
import { accountPool } from '../../../services/account-pool.ts';
import { checkAccess } from '@dui/framework';

/** 訪客 JWT 有效期 — 1 小時 */
const VISITOR_TTL = 3600;

const RegisterContent = ({ lang, l3Ready, notice }: { lang: string; l3Ready: boolean; notice?: string }) => {
  const prefix = `/${lang}`;
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-sm">
        <div class="card-body gap-5 py-8 px-6">
          {l3Ready ? (
          <>
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">註冊帳號</h1>
            <p class="text-base-content/50 text-sm mt-1">建立新帳號以存取服務</p>
          </div>

          <form id="register-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">帳號</span>
              <input name="帳號" type="text" class="input input-bordered w-full" placeholder="請輸入帳號" required />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">名稱</span>
              <input name="名稱" type="text" class="input input-bordered w-full" placeholder="顯示名稱（選填）" />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">密碼</span>
              <span class="text-xs text-base-content/40 ml-1">（至少 4 個字元）</span>
              <input name="密碼" type="password" class="input input-bordered w-full" placeholder="請輸入密碼" minlength={4} required />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">確認密碼</span>
              <input name="confirm密碼" type="password" class="input input-bordered w-full" placeholder="再次輸入密碼" minlength={4} required />
            </label>

            <div id="error" class="text-error text-sm hidden"></div>
            <div id="success-msg" class="text-success text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">註冊</button>
          </form>

          <p class="text-center text-xs text-base-content/40">
            已有帳號？
            <a href={`${prefix}/login`} class="link link-primary text-xs">登入</a>
          </p>
          </>
          ) : (
          <div class="text-center py-8">
            <h1 class="text-xl font-bold tracking-tight">註冊尚未開放</h1>
            <p class="text-base-content/50 text-sm mt-2">{notice || '此站台的租戶資料庫尚未啟用，暫時無法註冊新帳號。'}</p>
            <p class="text-center text-xs text-base-content/40 mt-4">
              <a href={`${prefix}/login`} class="link link-primary text-xs">返回登入</a>
            </p>
          </div>
          )}
        </div>
      </div>

      <script>{raw(`
        (async function() {
          document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('register-form');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              const errEl = document.getElementById('error');
              const successEl = document.getElementById('success-msg');
              errEl.classList.add('hidden');
              successEl.classList.add('hidden');

              // 檢查密碼一致性
              if (data['密碼'] !== data['confirm密碼']) {
                errEl.textContent = '兩次輸入的密碼不一致';
                errEl.classList.remove('hidden');
                return;
              }

              // 移除 confirm 欄位，不送出
              delete data['confirm密碼'];

              // 網頁註冊一律走 L3（租戶層級）
              data['layer'] = 'l3';

              try {
                const r = await fetch('/api/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const res = await r.json();
                if (res.success) {
                  successEl.textContent = '註冊成功！導向登入頁…';
                  successEl.classList.remove('hidden');
                  setTimeout(() => {
                    window.location.href = '${prefix}/login?redirect=${encodeURIComponent(prefix + '/')}';
                  }, 1500);
                } else {
                  errEl.textContent = res.error || '註冊失敗';
                  errEl.classList.remove('hidden');
                }
              } catch {
                errEl.textContent = '無法連線至認證服務';
                errEl.classList.remove('hidden');
              }
            });
          });
        })();
      `)}</script>
    </div>
  );
};

export const GET = async (c: any) => {
  const lang = c.get('lang') || 'zh-tw';

  // ── 1. 確保有有效 JWT cookie：無則簽發訪客 JWT（含 L1 訪客角色權限）──
  // 訪客 JWT 同時作為「是否有權限註冊」的判斷依據與 POST /api/register 的呼叫端身份。
  const cookieHeader = c.req.header('Cookie') || '';
  const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
  let payload: Record<string, unknown> | null = null;
  if (jwtMatch) {
    try {
      const { publicKey } = getKeys();
      payload = await verify(decodeURIComponent(jwtMatch[1]), publicKey, 'EdDSA') as Record<string, unknown>;
    } catch {
      payload = null; // cookie 無效 → 重新簽發訪客 token
    }
  }
  if (!payload?.type) {
    const tenant = await resolveTenant(c, undefined);
    if (tenant) {
      try {
        const { privateKey } = getKeys();
        const now = Math.floor(Date.now() / 1000);
        // 從 L1 取得訪客角色權限（訪客角色 seed 位於 L1）
        let 權限: Record<string, unknown> = {};
        try {
          const dataGatewayUrl = await getDataGatewayUrl();
          if (!dataGatewayUrl) throw new Error('data-gateway 未設定');
          const apiKey = await getDataGatewayApiKey();
          const r = await fetch(`${dataGatewayUrl}/api/l1/使用者:角色:訪客`, {
            headers: { 'X-API-Key': apiKey || '' },
          });
          const res = await r.json();
          if (res.success) 權限 = res.data?.權限 || {};
        } catch {
          // data-gateway 尚未就緒，訪客預設無權限
        }

        const visitorPayload = {
          tenant,
          sub: '使用者:使用者:訪客',
          帳號: '訪客',
          角色: ['使用者:角色:訪客'],
          type: 'visitor',
          權限,
          iat: now,
          exp: now + VISITOR_TTL,
        };
        const visitorToken = await sign(visitorPayload, privateKey, 'EdDSA');
        c.header(
          'Set-Cookie',
          `jwt=${visitorToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${VISITOR_TTL}`,
          { append: true },
        );
        payload = visitorPayload;
      } catch {
        // 簽發失敗不阻擋頁面渲染
      }
    }
  }

  // ── 2. 依呼叫端權限決定是否開放註冊 ──
  let l3Ready = false;
  let notice = '';
  if (!payload || !checkAccess(payload, 'l3', '使用者', '新增')) {
    notice = '訪客角色沒有註冊權限，暫時無法建立新帳號。';
  } else {
    const tenant = await resolveTenant(c, undefined);
    if (!tenant) {
      notice = '無法判定租戶（tenant），暫時無法註冊。';
    } else {
      const check = await accountPool.listUsers('l3', tenant, { limit: '1' });
      l3Ready = check.success;
      if (!l3Ready) {
        notice = `租戶 ${tenant} 的資料庫尚未啟用，暫時無法註冊新帳號。`;
      }
    }
  }

  const { Layout } = await import('../../_layout.tsx');
  const content = RegisterContent({ lang, l3Ready, notice });
  const layoutElement = await Layout({ title: '註冊帳號', lang, children: content });
  const html = '<!DOCTYPE html>' + renderToString(layoutElement);
  return c.html(html);
};