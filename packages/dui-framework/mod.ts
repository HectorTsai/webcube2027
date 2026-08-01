// @dui/framework — Application framework for WebCube2027 gateways
//
// Provides:
//   - Hono HTTP server with file-based routing
//   - Convenient gateway lifecycle (create → start)
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
//   // gw.dataDir — data/ directory path
//   gw.start();
//
// Each gateway manages its own ConfigStore and crypto key lifecycle
// via @dui/util (ConfigStore + registerKey). This package only provides
// the HTTP server + file routing.

import { Hono } from 'hono';
import { loadRoutes } from './route-loader.ts';
import { info } from '@dui/util';

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
 * 1. Data directory calculation
 * 2. Hono app with file-based routing from `{dirname}/routes/`
 *
 * Does NOT handle ConfigStore or crypto key setup — those are managed
 * by each gateway individually (see data-gateway/services/config.ts).
 *
 * @returns A `Gateway` object with `app`, `dataDir`, and `start()`.
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

  // ── Hono + file router ──
  const app = new Hono();

  // Use file:// URL so relative paths work regardless of CWD
  const routesUrl = new URL(`file://${routesDir}/`);
  try {
    await Deno.readDir(routesUrl); // probe if directory exists
    const fileRoutes = await loadRoutes(routesUrl);
    app.route('/', fileRoutes);
    await info(name, `File routes loaded from ${routesDir}`);
  } catch {
    // routes/ directory doesn't exist — that's OK
  }

  return {
    app,
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
// Re-export types from route-loader for external use
export type { MiddlewareFn } from './route-loader.ts';