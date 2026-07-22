// @dui/framework — Application framework for WebCube2027 gateways
//
// Provides:
//   - Hono HTTP server with file-based routing
//   - L1 KV store (config persistence via @dui/kv)
//   - Crypto key lifecycle management (via @dui/util)
//   - Bootstrapping guard middleware
//
// Usage (in each gateway's main.ts):
//
//   import { createGateway } from '@dui/framework';
//
//   const gw = await createGateway({
//     name: 'my-gateway',
//     port: 8000,
//     dirname: import.meta.dirname!,   // ← your gateway's directory
//   });
//
//   // gw.app  — Hono instance (file routes already loaded)
//   // gw.l1   — L1Store (initialized, crypto key registered)
//   // gw.dataDir — data/ directory path
//   gw.start();

import { Hono } from 'hono';
import { createFileRouter } from './fileRouter.ts';
import { L1Store } from '@dui/kv';
import { registerKey, info } from '@dui/util';

// ── Types ──

export interface CreateGatewayOptions {
  /** Gateway name (used in logs) */
  name: string;
  /** HTTP port (default: 8000) */
  port?: number;
  /** `import.meta.dirname` from the calling gateway's main.ts */
  dirname: string;
}

export interface Gateway {
  /** Hono app instance (file routes already loaded) */
  app: Hono;
  /** L1 config store (initialized, with crypto key) */
  l1: L1Store;
  /** Absolute path to the data directory */
  dataDir: string;
  /** HTTP port the gateway listens on */
  port: number;
  /** Start the HTTP server */
  start(): void;
}

// ── Gateway Bootstrap ──

/**
 * Create a fully-initialized gateway.
 *
 * Handles:
 * 1. L1 KV store initialization at `{dirname}/data/`
 * 2. Crypto key generation and registration (stored in L1 as `_crypto_key`)
 * 3. Hono app with file-based routing from `{dirname}/routes/`
 *
 * @returns A `Gateway` object with `app`, `l1`, `dataDir`, and `start()`.
 */
export async function createGateway(opts: CreateGatewayOptions): Promise<Gateway> {
  const { name, dirname } = opts;
  const port = opts.port ?? 8000;

  if (!dirname) {
    throw new Error(
      'createGateway: dirname is required. Pass `import.meta.dirname!` from your main.ts.',
    );
  }

  const dataDir = `${dirname}/data`;
  const routesDir = `${dirname}/routes`;

  // ── 1. L1 initialization ──
  const l1 = new L1Store(`${dataDir}/l1.json`);
  await l1.init();
  await info(name, `L1 ready (${dataDir})`);

  // ── 2. Crypto key (stored in L1 as `_crypto_key`) ──
  let cryptoKey = await l1.get('_crypto_key');
  if (!cryptoKey) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    cryptoKey = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    await l1.set('_crypto_key', cryptoKey);
    await info(name, 'Crypto key auto-generated');
  }
  registerKey(cryptoKey);

  // ── 3. Hono + file router ──
  const app = new Hono();

  // Use file:// URL so relative paths work regardless of CWD
  const routesUrl = new URL(`file://${routesDir}/`);
  try {
    await Deno.readDir(routesUrl); // probe if directory exists
    const fileRoutes = await createFileRouter({ dirPath: routesDir });
    app.route('/', fileRoutes);
    await info(name, `File routes loaded from ${routesDir}`);
  } catch {
    // routes/ directory doesn't exist — that's OK
  }

  return {
    app,
    l1,
    dataDir,
    port,
    start() {
      Deno.serve({ port }, app.fetch);
      info(name, `Listening on port ${port}`);
    },
  };
}

// Re-export Hono for convenience
export { Hono } from 'hono';