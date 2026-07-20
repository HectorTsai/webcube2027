import { Hono } from '@dui/framework';
import { createFileRouter } from '@dui/framework/file-router';
import { info } from '@dui/util';
import { sign, verify } from 'hono/jwt';
import { localProvider } from './providers/local.ts';

const app = new Hono();

// ── 狀態 ──
let 加密金鑰 = '';

// ── 共用 L1 設定檔（與 data-gateway 共享） ──
const L1_PATH = `${import.meta.dirname}/../data/l1.json`;

async function 讀取L1(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await Deno.readTextFile(L1_PATH));
  } catch {
    return {};
  }
}

async function 寫入L1(chaves: Record<string, string>): Promise<void> {
  const data = await 讀取L1();
  Object.assign(data, chaves);
  await Deno.writeTextFile(L1_PATH, JSON.stringify(data, null, 2));
}

// ── 登入 API ──
app.post('/api/login', async (c) => {
  const result = await localProvider.login(c);
  if (!result.success || !result.payload) {
    return c.json({ success: false, error: result.error ?? '登入失敗' }, 401);
  }

  // 簽發 JWT（24 小時有效）
  const payload = {
    ...result.payload,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = await sign(payload, 加密金鑰, 'HS256');

  // 設定 httpOnly cookie
  c.header(
    'Set-Cookie',
    `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );

  return c.json({
    success: true,
    data: { token, 帳號: result.payload.帳號, 角色: result.payload.角色 },
  });
});

// ── Token 驗證 API（供其他 gateway 調用） ──
app.post('/api/verify', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ valid: false }, 401);
    const payload = await verify(token, 加密金鑰, 'HS256');
    return c.json({ valid: true, payload });
  } catch {
    return c.json({ valid: false }, 401);
  }
});

app.get('/api/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  const cookieToken = c.req.header('Cookie')?.match(/jwt=([^;]+)/)?.[1];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) return c.json({ valid: false }, 401);
  try {
    const payload = await verify(token, 加密金鑰, 'HS256');
    return c.json({ valid: true, payload });
  } catch {
    return c.json({ valid: false }, 401);
  }
});

// ── 檔案路由 ──
const fileRoutes = await createFileRouter({
  dirPath: `${import.meta.dirname}/routes`,
});
app.route('/', fileRoutes);

// ── 健康檢查（代理 data-gateway） ──
const DATA_GATEWAY_URL = Deno.env.get('DATA_GATEWAY_URL') || 'http://localhost:8002';

app.get('/health', async (c) => {
  try {
    const r = await fetch(`${DATA_GATEWAY_URL}/health`);
    const data = await r.json();
    return c.json(data);
  } catch {
    return c.json({ status: 'error', service: 'auth-gateway', l1: 'disconnected', l2: 'disconnected' });
  }
});

// ── 啟動 ──
const PORT = Number(Deno.env.get('AUTH_GATEWAY_PORT')) || 8003;

async function main() {
  // 讀取或生成 JWT 加密金鑰（存於共用 L1）
  const L1 = await 讀取L1();
  加密金鑰 = L1.jwt_secret ?? '';
  if (!加密金鑰) {
    加密金鑰 = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await 寫入L1({ jwt_secret: 加密金鑰 });
    await info('AuthGateway', '已自動生成 JWT 加密金鑰');
  }
  Deno.env.set('SECRET_KEY', 加密金鑰);
  await info('AuthGateway', 'JWT 加密金鑰已就緒');

  Deno.serve({ port: PORT }, app.fetch);
  await info('AuthGateway', `啟動於 port ${PORT}`);
}

await main();
