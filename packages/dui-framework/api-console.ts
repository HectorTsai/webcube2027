/**
 * API Console — 共用前端 JavaScript
 *
 * 提供服務狀態監控（loadStatus）與 API 測試工具（sendApiRequest），
 * 供各 Gateway 的管理後台嵌入使用。
 *
 * 使用方式（在 JSX 頁面中）：
 *
 *   import { raw } from 'hono/html';
 *   import { API_CONSOLE_SCRIPT } from '@dui/framework/api-console';
 *
 *   // ... JSX ...
 *   <script>{raw(API_CONSOLE_SCRIPT)}</script>
 */

export const API_CONSOLE_SCRIPT = `
function setEl(id, text, cls) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    el.className = cls;
  }
}

async function loadStatus() {
  try {
    const health = await fetch('/api/health').then(r => r.json());

    ['l1', 'l2'].forEach(key => {
      const ok = health[key] === 'connected';
      setEl(key + '-status', ok ? '✓ 已就緒' : '✗ 離線', 'stat-value text-lg ' + (ok ? 'text-success' : 'text-error'));
    });

    let l3Cls = 'text-base-content/50';
    if (health.l3?.includes('✓')) l3Cls = 'text-success';
    else if (health.l3?.includes('✗')) l3Cls = 'text-error';
    setEl('l3-status', health.l3 || '未設定', 'stat-value text-lg ' + l3Cls);

    const allOk = health.l1 === 'connected' && health.l2 === 'connected';
    setEl('status-badge', allOk ? '運作中' : '降級', 'badge badge-soft ' + (allOk ? 'badge-success' : 'badge-warning'));
  } catch (e) {
    ['l1', 'l2', 'l3'].forEach(k => setEl(k + '-status', '✗ 無法連線', 'stat-value text-lg text-error'));
    setEl('status-badge', '離線', 'badge badge-soft badge-error');
  }
}

async function sendApiRequest() {
  const methodEl = document.getElementById('api-method');
  const pathEl = document.getElementById('api-path');
  if (!methodEl || !pathEl) return;

  const method = methodEl.value;
  const path = pathEl.value.trim();
  const resultEl = document.getElementById('api-result');
  const statusEl = document.getElementById('api-status');
  const timingEl = document.getElementById('api-timing');
  const responseEl = document.getElementById('api-response');

  if (!path) { pathEl.focus(); return; }

  if (resultEl) resultEl.classList.remove('hidden');
  if (responseEl) responseEl.textContent = '傳送中…';
  if (statusEl) statusEl.textContent = '';
  if (timingEl) timingEl.textContent = '';

  const options = { method };

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const bodyEl = document.getElementById('api-body');
    const bodyVal = bodyEl ? bodyEl.value.trim() : '';
    if (bodyVal) {
      try {
        JSON.parse(bodyVal);
        options.headers = { 'Content-Type': 'application/json' };
        options.body = bodyVal;
      } catch {
        if (statusEl) { statusEl.textContent = '400 JSON 格式錯誤'; statusEl.className = 'badge badge-soft badge-error'; }
        if (responseEl) responseEl.textContent = '請求主體的 JSON 格式不正確';
        return;
      }
    }
  }

  const start = performance.now();
  try {
    const res = await fetch(path, options);
    const elapsed = Math.round(performance.now() - start);
    const text = await res.text();

    if (statusEl) { statusEl.textContent = res.status + ' ' + res.statusText; statusEl.className = 'badge badge-soft ' + (res.ok ? 'badge-success' : 'badge-error'); }
    if (timingEl) timingEl.textContent = elapsed + 'ms';

    if (responseEl) {
      try {
        responseEl.textContent = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        responseEl.textContent = text || '（無回傳內容）';
      }
    }
  } catch (e) {
    if (statusEl) { statusEl.textContent = '無法連線'; statusEl.className = 'badge badge-soft badge-error'; }
    if (responseEl) responseEl.textContent = e.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const methodEl = document.getElementById('api-method');
  if (methodEl) {
    methodEl.addEventListener('change', () => {
      const m = methodEl.value;
      const wrapper = document.getElementById('api-body-wrapper');
      if (wrapper) wrapper.classList.toggle('hidden', m === 'GET' || m === 'DELETE');
    });
  }

  loadStatus();
});
`;