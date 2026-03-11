import { Hono, Context } from 'hono'

// 路由項目介面
interface RouteItem {
  path: string          // URL 路徑
  filePath: string      // 檔案路徑
  handler: Function     // 處理函式
  params?: string[]     // 參數名稱
}

// 特殊檔案集合
interface SpecialFiles {
  layout?: (Component: () => unknown, ctx: Context) => unknown
  middleware?: ((ctx: Context, next: () => Promise<void>) => Promise<void>)[]
  app?: (Component: () => unknown, ctx: Context) => unknown
  notFound?: (ctx: Context) => Response
  error?: (error: Error, ctx: Context) => Response
  serverError?: (ctx: Context, error?: Error) => Response
}

// 路由器選項
interface RouterOptions {
  routesDir?: string
  debug?: boolean
}

// Context 擴展
declare module 'hono' {
  interface Context {
    /** 內部重導向（高效能，避免重新 request） */
    internalRedirect(path: string): Promise<Response>
    /** 重導向鏈追蹤（防止循環） */
    _redirectChain?: string[]
  }
}

// 檔案路由器類
class FileRouter {
  private routes = new Map<string, RouteItem>()
  private specialFiles = new Map<string, SpecialFiles>()
  private options: Required<RouterOptions>

  constructor(options: RouterOptions = {}) {
    this.options = {
      routesDir: options.routesDir || 'src/routes',
      debug: options.debug || false
    }
  }

  // 初始化路由器
  async init(): Promise<void> {
    await this.scanRoutes()
    if (this.options.debug) {
      console.log(`[Router] Loaded ${this.routes.size} routes, ${this.specialFiles.size} special file directories`)
    }
  }

  // 掃描路由檔案
  private async scanRoutes(): Promise<void> {
    this.routes.clear()
    this.specialFiles.clear()

    const scan = async (dir: string, basePath = ''): Promise<void> => {
      for await (const entry of Deno.readDir(dir)) {
        const fullPath = `${dir}/${entry.name}`
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

        if (entry.isDirectory) {
          await scan(fullPath, relativePath)
        } else if (entry.isFile && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          await this.processFile(fullPath, relativePath)
        }
      }
    }

    await scan(this.options.routesDir)
  }

  // 處理單個檔案
  private async processFile(filePath: string, relativePath: string): Promise<void> {
    const fileName = relativePath.split('/').pop()?.replace(/\.(tsx?|ts)$/, '') || ''
    const dirPath = relativePath.substring(0, relativePath.lastIndexOf('/'))
    const urlDir = dirPath ? `/${dirPath.replace(/\\/g, '/')}` : '/'

    // 動態匯入模組
    const absolutePath = await Deno.realPath(filePath)
    const module = await import(`file://${absolutePath}`)
    const handler = module.default

    if (!handler) return

    // 處理特殊檔案
    if (fileName.startsWith('_')) {
      let specialFiles = this.specialFiles.get(urlDir) || {}
      
      switch (fileName) {
        case '_middleware':
          specialFiles.middleware = specialFiles.middleware || []
          specialFiles.middleware.push(handler)
          break
        case '_layout':
          specialFiles.layout = handler
          break
        case '_app':
          specialFiles.app = handler
          break
        case '_404':
          specialFiles.notFound = handler
          break
        case '_error':
          specialFiles.error = handler
          break
        case '_500':
          specialFiles.serverError = handler
          break
      }
      
      this.specialFiles.set(urlDir, specialFiles)
      return
    }

    // 處理普通路由
    const urlPath = this.filePathToUrl(relativePath)
    const params = this.extractParams(relativePath)

    this.routes.set(urlPath, {
      path: urlPath,
      filePath,
      handler,
      params
    })
  }

  // 檔案路徑轉 URL 路徑
  private filePathToUrl(filePath: string): string {
    let path = filePath
      .replace(/\.(tsx?|ts)$/, '')  // 移除副檔名
      .replace(/\\/g, '/')          // 統一斜線

    // index 轉為根路徑
    if (path.endsWith('/index')) {
      path = path.slice(0, -6) // 移除 '/index'
      if (path === '') path = '/'
    } else if (path === 'index') {
      path = '/'
    }

    // [id] 轉為 :id
    path = path.replace(/\[([^\]]+)\]/g, ':$1')

    if (!path.startsWith('/')) path = '/' + path
    return path
  }

  // 提取參數名稱
  private extractParams(filePath: string): string[] {
    const params: string[] = []
    const matches = filePath.matchAll(/\[([^\]]+)\]/g)
    for (const [, name] of matches) {
      params.push(name)
    }
    return params
  }

  // 查找路由
  findRoute(path: string): RouteItem | null {
    // 精確匹配
    if (this.routes.has(path)) {
      return this.routes.get(path)!
    }

    // 動態路由匹配
    for (const [pattern, route] of this.routes) {
      const regex = new RegExp('^' + pattern.replace(/:[^\/]+/g, '([^/]+)') + '$')
      if (regex.test(path)) {
        return route
      }
    }

    return null
  }

  // 取得特殊檔案集合（從根到目標路徑）
  getSpecialFilesChain(path: string): SpecialFiles[] {
    const chain: SpecialFiles[] = []
    const parts = path.split('/').filter(Boolean)
    
    // 從根開始收集
    chain.push(this.specialFiles.get('/') || {})
    
    // 逐層收集
    let currentPath = ''
    for (const part of parts) {
      currentPath += '/' + part
      chain.push(this.specialFiles.get(currentPath) || {})
    }

    return chain
  }

  // 執行中間件鏈
  async executeMiddleware(ctx: Context, path: string, finalHandler: () => Promise<Response>): Promise<Response> {
    const chain = this.getSpecialFilesChain(path)
    const middlewares: ((ctx: Context, next: () => Promise<void>) => Promise<void>)[] = []

    // 收集所有中間件
    for (const specialFiles of chain) {
      if (specialFiles.middleware) {
        middlewares.push(...specialFiles.middleware)
      }
    }

    // 執行中間件鏈
    const execute = async (index: number): Promise<Response> => {
      if (index >= middlewares.length) {
        return await finalHandler()
      }
      await middlewares[index](ctx, async () => {
        // Hono middleware 不返回值，直接繼續
      })
      return await execute(index + 1)
    }

    return await execute(0)
  }

  // 包裝頁面組件
  async wrapComponent(handler: Function, ctx: Context, path: string): Promise<unknown> {
    // 先執行原始處理器
    const result = await handler(ctx)
    
    // 如果結果是 Response，直接返回（可能是重導向）
    if (result instanceof Response) {
      return result
    }
    
    // 檢查是否為 Partial 請求
    const isPartial = ctx.req.header('X-Partial') === 'true'
    
    if (isPartial) {
      // Partial 請求只返回原始內容，不包裝特殊檔案
      console.log(`[Router] Partial 請求: ${path}`)
      return result
    }
    
    // 否則進行 Layout 和 App 包裝
    const chain = this.getSpecialFilesChain(path).reverse() // 從內到外包裝

    // 基礎渲染器
    let renderer = () => result

    // 依序包裝 Layout 和 App
    for (const specialFiles of chain) {
      if (specialFiles.layout) {
        const Layout = specialFiles.layout
        const prev = renderer
        renderer = () => Layout(prev, ctx)
      }
      if (specialFiles.app) {
        const App = specialFiles.app
        const prev = renderer
        renderer = () => App(prev, ctx)
      }
    }

    return await renderer()
  }

  // 處理錯誤
  handleError(error: Error, ctx: Context, path: string): Response {
    const chain = this.getSpecialFilesChain(path)

    // 尋找錯誤處理器
    for (const specialFiles of chain) {
      if (specialFiles.error) {
        return specialFiles.error(error, ctx)
      }
    }

    // 預設錯誤處理
    return ctx.html(`<h1>Error: ${error.message}</h1>`, 500)
  }

  // 處理 404
  handle404(ctx: Context, path: string): Response {
    const chain = this.getSpecialFilesChain(path)

    // 尋找 404 處理器
    for (const specialFiles of chain) {
      if (specialFiles.notFound) {
        return specialFiles.notFound(ctx)
      }
    }

    // 預設 404 處理
    return ctx.html('<h1>404 Not Found</h1>', 404)
  }

  // 處理 500
  handle500(ctx: Context, error?: Error): Response {
    // 尋找最近的 500 處理器
    for (const specialFiles of this.getSpecialFilesChain(ctx.req.path)) {
      if (specialFiles.serverError) {
        return specialFiles.serverError(ctx, error)
      }
    }

    // 預設 500 處理
    return ctx.html('<h1>Internal Server Error</h1>', 500)
  }

  // 取得所有路由（除錯用）
  getAllRoutes(): RouteItem[] {
    return Array.from(this.routes.values())
  }
}

// 設定檔案路由器
export async function setupFileRouter(app: Hono, options: RouterOptions = {}): Promise<FileRouter> {
  const router = new FileRouter(options)
  await router.init()

  // 註冊全域中間件處理所有請求
  app.use('*', async (ctx, next) => {
    // 初始化重導向鏈
    ctx._redirectChain = ctx._redirectChain || []
    
    const path = ctx.req.path

    try {
      const route = router.findRoute(path)
      
      if (!route) {
        return await next()
      }

      // 設定內部重導向方法
      ctx.internalRedirect = async (targetPath: string): Promise<Response> => {
        // 檢查循環
        if (ctx._redirectChain!.includes(targetPath)) {
          console.warn(`[Router] 檢測到重導向循環: ${ctx._redirectChain!.join(' -> ')} -> ${targetPath}`)
          // 降級為外部重導向
          return ctx.redirect(targetPath)
        }

        // 添加到重導向鏈
        ctx._redirectChain!.push(targetPath)

        try {
          // 查找目標路由
          const targetRoute = router.findRoute(targetPath)
          if (!targetRoute) {
            return router.handle404(ctx, targetPath)
          }

          // 執行目標路由（不重新執行中間件）
          const content = await router.wrapComponent(targetRoute.handler, ctx, targetPath)
          
          if (content instanceof Response) {
            return content
          }
          
          return ctx.html(String(content))
        } finally {
          // 清理重導向鏈
          ctx._redirectChain!.pop()
        }
      }

      // 執行中間件鏈並渲染頁面
      const response = await router.executeMiddleware(ctx, path, async () => {
        console.log(`[Router] 執行頁面組件: ${route.filePath}`)
        const content = await router.wrapComponent(route.handler, ctx, path)
        console.log(`[Router] 頁面組件結果類型: ${typeof content}`)
        console.log(`[Router] 是否為 Response: ${content instanceof Response}`)
        
        // 如果已經是 Response，直接返回
        if (content instanceof Response) {
          console.log(`[Router] 直接返回 Response`)
          return content
        }
        
        // 否則轉換為 HTML 回應
        console.log(`[Router] 轉換為 HTML`)
        return ctx.html(String(content))
      })

      return response
    } catch (error) {
      return router.handleError(error as Error, ctx, path)
    }
  })

  // 設定錯誤處理器
  app.notFound((ctx) => router.handle404(ctx, ctx.req.path))
  app.onError((err, ctx) => router.handleError(err, ctx, ctx.req.path))

  // 除錯端點
  if (options.debug) {
    app.get('/_routes', (ctx) => {
      const routes = router.getAllRoutes()
      const specialFiles = Array.from(router['specialFiles'].entries()).map(([dir, files]) => ({
        dir,
        hasMiddleware: !!files.middleware,
        hasLayout: !!files.layout,
        hasApp: !!files.app,
        hasNotFound: !!files.notFound,
        hasError: !!files.error,
        hasServerError: !!files.serverError
      }))
      
      return ctx.json({ routes, specialFiles })
    })
  }

  return router
}
