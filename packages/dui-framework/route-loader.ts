import { Hono } from 'hono';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHOD_MAP: Record<string, HttpMethod> = {
  'get': 'GET',
  'post': 'POST',
  'put': 'PUT',
  'del': 'DELETE',
  'patch': 'PATCH',
};

/** Extract the method name from a filename (e.g. `get.ts` or `get.tsx` → `GET`). */
function detectMethod(filename: string): HttpMethod | null {
  const stem = filename.replace(/\.(ts|tsx)$/, '');
  return METHOD_MAP[stem] ?? null;
}

type MiddlewareFn = (c: any, next: any) => Response | Promise<Response> | void | Promise<void>;

interface RouteEntry {
  method: HttpMethod;
  pathPattern: string;
  fileUrl: string;
  middleware: MiddlewareFn[];
}

/**
 * Convert a filesystem directory name to a Hono route path segment.
 * `_id_` → `:id`, `_param_` → `:param`, plain names stay as-is.
 */
function toRouteSegment(name: string): string {
  const m = name.match(/^_(.+)_$/);
  return m ? `:${m[1]}` : name;
}

/**
 * Recursively scan a directory, collecting route entries and applying
 * `_middleware.ts` found at each level.
 *
 * @param dirUrl          - file:// URL of the current directory
 * @param basePath        - accumulated Hono path pattern
 * @param middlewareStack - accumulated middleware from ancestor directories
 * @param routes          - output array of route entries
 */
async function collectRoutes(
  dirUrl: string,
  basePath: string,
  middlewareStack: MiddlewareFn[],
  routes: RouteEntry[],
): Promise<MiddlewareFn[]> {
  const normalizedUrl = dirUrl.endsWith('/') ? dirUrl : dirUrl + '/';
  let localMw: MiddlewareFn | null = null;

  const entries = [...Deno.readDirSync(new URL(normalizedUrl))];

  // Detect _middleware.ts in current directory
  for (const entry of entries) {
    if (entry.name === '_middleware.ts') {
      try {
        const mod = await import(normalizedUrl + entry.name);
        const fn = mod.middleware ?? mod.default;
        if (typeof fn === 'function') {
          localMw = fn;
        } else {
          console.warn(
            `[route-loader] ${normalizedUrl}_middleware.ts exports no valid middleware function`,
          );
        }
      } catch (err) {
        console.warn(
          `[route-loader] Failed to load middleware at ${normalizedUrl}_middleware.ts: ${err instanceof Error ? err.message : err}`,
        );
      }
      break;
    }
  }

  const newStack = localMw ? [...middlewareStack, localMw] : middlewareStack;

  for (const entry of entries) {
    if (entry.isDirectory) {
      await collectRoutes(
        normalizedUrl + entry.name + '/',
        basePath + '/' + toRouteSegment(entry.name),
        newStack,
        routes,
      );
    } else {
      const method = detectMethod(entry.name);
      if (method) {
        routes.push({
          method,
          pathPattern: basePath,
          fileUrl: normalizedUrl + entry.name,
          middleware: newStack,
        });
      }
    }
    // _middleware.ts and other non-method files are silently ignored
  }

  return newStack;
}

/**
 * Load all route files from a `file://` URL directory and return a Hono router.
 *
 * **Directory naming conventions:**
 * - `foo/`          → static path segment `/foo`
 * - `_name_/`       → dynamic param `/:name`
 * - `_middleware.ts` → middleware applied to all routes in that directory
 * - `get.ts` / `get.tsx`  → `GET` handler
 * - `post.ts` / `post.tsx` → `POST` handler
 * - `put.ts` / `put.tsx`   → `PUT` handler
 * - `del.ts` / `del.tsx`   → `DELETE` handler
 * - `patch.ts` / `patch.tsx` → `PATCH` handler
 *
 * @param dirUrl - A `file://` URL pointing to the routes directory root.
 * @returns A Hono instance with all discovered routes registered.
 *
 * @example
 * ```ts
 * import { loadRoutes } from '@dui/framework/route-loader';
 * const routes = await loadRoutes(new URL('./routes', import.meta.url));
 * app.route('/', routes);
 * ```
 */
export async function loadRoutes(dirUrl: URL): Promise<Hono> {
  const app = new Hono();
  const routes: RouteEntry[] = [];

  await collectRoutes(dirUrl.href, '', [], routes);

  for (const route of routes) {
    let mod;
    try {
      mod = await import(route.fileUrl);
    } catch (err) {
      console.warn(
        `[route-loader] Failed to import ${route.fileUrl}: ${err instanceof Error ? err.message : err}`,
      );
      continue;
    }

    const handler = mod[route.method];
    if (!handler) {
      console.warn(
        `[route-loader] ${route.fileUrl} does not export '${route.method}'`,
      );
      continue;
    }

    const handlers: any[] = [...route.middleware, handler];
    app.on(route.method, route.pathPattern as any, ...handlers);
  }

  return app;
}
