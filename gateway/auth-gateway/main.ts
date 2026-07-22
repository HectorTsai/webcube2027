import { createGateway } from '@dui/framework';
import { info } from '@dui/util';
import { sign, verify } from 'hono/jwt';
import { localProvider } from './providers/local.ts';

// ── Hex helpers ──

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ── Gateway bootstrap (L1, crypto, file routes, Hono) ──

const gw = await createGateway({
  name: 'auth-gateway',
  port: Number(Deno.env.get('AUTH_GATEWAY_PORT')) || 8003,
  dirname: import.meta.dirname!,
});

const app = gw.app;

// ── Ed25519 Key Management ──

/**
 * Get or create an Ed25519 key pair.
 * Keys are stored in L1 as hex-encoded PKCS#8 / SPKI.
 * On subsequent starts, keys are re-imported from L1.
 *
 * Private key stays in auth-gateway only. Other gateways fetch
 * the public key via GET /api/jwt-public-key for local verification.
 */
async function getOrCreateKeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  const storedPrivateHex = await gw.l1.get('_jwt_private_key');

  if (storedPrivateHex) {
    const privateKeyBytes = hexToBytes(storedPrivateHex);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8', privateKeyBytes, { name: 'Ed25519' }, false, ['sign'],
    );

    const storedPublicHex = await gw.l1.get('_jwt_public_key');
    const publicKeyBytes = hexToBytes(storedPublicHex!);
    const publicKey = await crypto.subtle.importKey(
      'spki', publicKeyBytes, { name: 'Ed25519' }, false, ['verify'],
    );

    return { privateKey, publicKey };
  }

  // Generate new key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  ) as CryptoKeyPair;

  // Export and store in L1
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));

  await gw.l1.set('_jwt_private_key', bytesToHex(pkcs8));
  await gw.l1.set('_jwt_public_key', bytesToHex(spki));

  await info('AuthGateway', 'Ed25519 key pair generated and stored in L1');

  return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey };
}

const { privateKey, publicKey } = await getOrCreateKeyPair();
const publicKeyHex = (await gw.l1.get('_jwt_public_key'))!;

await info('AuthGateway', 'JWT Ed25519 key pair ready');

// ── Login API ──

app.post('/api/login', async (c) => {
  const result = await localProvider.login(c);
  if (!result.success || !result.payload) {
    return c.json({ success: false, error: result.error ?? '登入失敗' }, 401);
  }

  // Sign JWT with Ed25519 (24h expiry)
  const payload = {
    ...result.payload,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = await sign(payload, privateKey, 'EdDSA');

  // Set httpOnly cookie
  c.header(
    'Set-Cookie',
    `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );

  return c.json({
    success: true,
    data: { token, 帳號: result.payload.帳號, 角色: result.payload.角色 },
  });
});

// ── Public Key Endpoint (for other gateways to verify locally) ──

app.get('/api/jwt-public-key', async (c) => {
  return c.json({ publicKey: publicKeyHex, algorithm: 'EdDSA' });
});

// ── Token Verification API (for gateways that call via HTTP) ──

app.post('/api/verify', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ valid: false }, 401);

    const payload = await verify(token, publicKey, 'EdDSA');
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
    const payload = await verify(token, publicKey, 'EdDSA');
    return c.json({ valid: true, payload });
  } catch {
    return c.json({ valid: false }, 401);
  }
});

// ── Health check (proxy to data-gateway) ──

const DATA_GATEWAY_URL = Deno.env.get('DATA_GATEWAY_URL') || 'http://localhost:8002';

app.get('/health', async (c) => {
  try {
    const r = await fetch(`${DATA_GATEWAY_URL}/health`);
    const data = await r.json();
    return c.json(data);
  } catch {
    return c.json({
      status: 'error',
      service: 'auth-gateway',
      l1: 'disconnected',
      l2: 'disconnected',
    });
  }
});

// ── Startup ──

gw.start();