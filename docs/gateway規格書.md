# Gateway 規格書

> **核心規則：所有操作傳送的 id 都必須是完整的 composite id（`collection:model:id`），DataPool 不得再自行包裝一層前綴。**

> 此文件定義 WebCube2027 中所有 Gateway 必須遵守的共用規範。
> **新增 Gateway 時，請依此文件逐步實作**，確保所有 Gateway 的架構與使用者體驗一致。
>
> 最後更新：2026-08-07

---

## 目錄

- [1. 目錄結構標準](#1-目錄結構標準)
- [2. Framework 匯出一覽](#2-framework-匯出一覽)
- [3. Layout 規範](#3-layout-規範)
- [4. 首頁規範](#4-首頁規範)
- [5. API 端點標準](#5-api-端點標準)
- [6. 路由系統（檔案路由 + Pass 3）](#6-路由系統檔案路由--pass-3)
- [7. 資料庫使用規範](#7-資料庫使用規範)
- [8. Config / API Key](#8-config--api-key)
- [9. Seed 同步機制](#9-seed-同步機制)
- [10. 版本號規則](#10-版本號規則)
- [11. dui-util 工具一覽](#11-dui-util-工具一覽)
- [12. 權限系統](#12-權限系統)
- [13. DataPool — 通用資料代理層](#13-datapool--通用資料代理層)
  - [13.4.1 快取形狀一致性（重要）](#1341-快取形狀一致性重要)
- [14. 新增 Gateway 快速步驟](#14-新增-gateway-快速步驟)

---

## 1. 目錄結構標準

每個 Gateway 的 `routes/` 目錄必須包含以下結構：

```
gateway/{name}-gateway/
├── main.ts                    ← 啟動入口
├── deno.json                  ← 版本號記錄於此
├── routes/
│   ├── _layout.tsx            ← 共用版面（使用 GatewayLayout）
│   ├── _middleware.ts         ← 全域 middleware（JWT 驗證、語言偵測）
│   ├── _lang_/                ← 多語言動態路由（:lang）
│   │   ├── index.tsx          ← 首頁（使用 GatewayHero + StatusCard + FeatureGrid）
│   │   ├── doc.md             ← 文件頁面
│   │   └── history.md         ← 版本紀錄
│   ├── api/
│   │   ├── version/
│   │   │   └── get.ts         ← re-export createVersionHandler
│   │   └── (其他 API 路由)
│   ├── api/
│   │   ├── health/
│   │   │   └── get.ts         ← 使用 createHealthHandler（公開端點）
│   ├── static/                ← 靜態檔案（app.js、圖片等）
│   └── setup/                 ← 安裝設定流程（可選）
├── services/                  ← 業務邏輯層
├── utils/                     ← Gateway 專屬工具
├── database/
│   └── seeds/                 ← 種子資料
│       ├── L1/
│       ├── L2/
│       └── L3/
└── data/                      ← 執行時期資料（.crypto.key、config.json 等）
```

### 檔案路由規則

| 檔案 | 對應路由 | 說明 |
|------|---------|------|
| `get.ts` | `GET /path` | HTTP method handler（post.ts → POST、put.ts → PUT、del.ts → DELETE、patch.ts → PATCH） |
| `index.tsx` | `GET /path` | 目錄預設頁面（.tsx 優先於 .md） |
| `_name_.ts` | `GET /:name` | 動態路徑參數（底線包夾的目錄或檔名） |
| `_middleware.ts` | — | 目錄層級 middleware |
| `.md` 檔案 | `GET /path` | Markdown 自動轉 HTML（使用 _layout.tsx 的 renderPage） |
| `.css/.js/.svg` 等 | `GET /path` | 靜態檔案自動服務（MIME type 對應） |

路由優先順序：`.tsx` > `.md` > `index.tsx` > `index.md`。

---

## 2. Framework 匯出一覽

所有 Gateway 共用 `@dui/framework`，以下為完整匯出列表：

### 核心啟動

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `createGateway(options)` | `async function` | 建立 Gateway 實例，自動掛載 CORS + Trace ID middleware。`options.dirname` 為 `import.meta.dirname!`，`options.alpine` 決定是否掛載 Alpine.js runtime |
| `Gateway` | `interface` | `{ app: Hono, dataDir: string, port: number, start(): void }` |

### 檔案路由

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `loadRoutes(routesDir, app)` | `async function` | 載入檔案路由，自動處理 _middleware、動態路徑、多國語言、Pass 3 退回 |

### Layout 與首頁元件

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `GatewayLayout(props)` | `async function` | 共用 HTML 外殼（navbar + main + footer），兩段式 CSS 生成封裝在內 |
| `GatewayLayoutProps` | `interface` | `{ title, gatewayName, lang?, version, icon?, navbarRight?, children, footerText?, useAlpine?, alpineSrc?, extraScript?, cssSafelist? }` |
| `GatewayHero(props)` | `function` | Hero 區塊（Logo + 名稱 + 標語 + 三操作按鈕）。`showGatewayList` 為 true 時中間改為匝道下拉 |
| `GatewayHeroProps` | `interface` | `{ prefix, gatewayName, tagline, showGatewayList? }` |
| `StatusCard(props)` | `function` | 通用狀態卡片（標題行 + 自訂內容區） |
| `StatusCardProps` | `interface` | `{ title, subtitle?, children }` |
| `FeatureGrid(props)` | `function` | 特色卡片網格，自動適應 2/3 欄 |
| `FeatureGridProps` | `interface` | `{ features: FeatureCardItem[], columns?: 2\|3 }` |
| `FeatureCardItem` | `interface` | `{ icon, title, description, color? }` |
| `TechStackRow()` | `function` | 技術棧圖示列（Deno + Hono + UnoCSS + daisyUI） |
| `WaveBackground()` | `function` | 裝飾性波紋背景（固定於頁面底部） |

### 版本工具

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `getVersion(gatewayRoot)` | `async function` | 從 `{gatewayRoot}/deno.json` 讀取版本號（快取） |
| `createVersionHandler(gatewayRoot)` | `function` | 建立 `/api/version` 的 GET handler |
| `clearVersionCache()` | `function` | 清除版本快取（測試用） |

### 健康檢查

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `createHealthHandler(gatewayRoot, serviceName, extend?)` | `function` | 建立 `/api/health` 的 GET handler，回傳 `{ status, service, version, uptime, ...extend }` |
| `HealthBaseInfo` | `interface` | `{ version: string, uptime: number }` |
| `HealthExtend` | `type` | `(info: HealthBaseInfo) => Record<string, unknown> \| Promise<Record<string, unknown>>` |

### Seed 同步

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `loadSeeds(levelDir)` | `async function` | 載入指定層級的所有 seed 記錄 |
| `computeSeedsHash(seedsDir)` | `async function` | 以 SHA-256 計算 seed 內容 hash |
| `detectSeedLevels(seedsRoot)` | `async function` | 偵測 seeds/ 下存在的層級目錄 |
| `syncSeeds(options)` | `async function` | 比對 hash，版本不同時以批次 PUT 覆寫至 data-gateway |
| `syncAllSeeds(options)` | `async function` | 自動偵測層級，依序同步所有 seed |
| `seedHashKey` | `string` | seed hash 在 ConfigStore 中的 key |
| `SeedLevel` | `type` | `'L1' \| 'L2' \| 'L3'` |
| `SyncSeedsOptions` | `interface` | `{ seedsRoot, store, baseUrl, apiKey, level, tenant?, prepare? }` |

### 權限工具

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `mergePermissions(...maps)` | `function` | 合併多個角色的權限表 |
| `checkAccess(permissions, level, collection, action)` | `function` | 檢查指定操作是否允許 |
| `checkPermission(permissions, level, collection)` | `function` | 取得指定 collection 的權限值 |
| `extractCollection(id)` | `function` | 從 composite ID 萃取 collection 名稱 |
| `PermissionMap` | `interface` | `{ l2?: LevelPermission, l3?: LevelPermission }` |
| `LevelPermission` | `interface` | `{ default?: CollectionPermission, [collection]: CollectionPermission }` |
| `CollectionPermission` | `interface` | `{ 讀?: boolean\|'self', 寫?: boolean\|'self' }` |

### CSS / Alpine

| 匯出名稱 | 類型 | 說明 |
|---------|------|------|
| `generatePageCss(html, options?)` | `async function` | 掃描 HTML 字串中的 class，生成對應的 UnoCSS 原子 CSS |
| `UNOCSS_THEME_COLORS` | `string[]` | UnoCSS 主題色列表 |
| `COMPONENT_CSS` | `string` | 共用的 daisyUI / 元件 CSS |
| `alpineScripts` | `string` | Alpine.js runtime 完整 script 標籤（含 integrity hash） |
| `mountAlpineAssets(app)` | `async function` | 掛載 Alpine.js runtime 到 Hono app |
| `ALPINE_JS_PATH` | `string` | Alpine.js 前端路徑（`/alpine.min.js`） |

---

## 3. Layout 規範

所有 Gateway 的 `routes/_layout.tsx` 使用 `GatewayLayout` 元件產生統一外殼。

### Navbar 結構

```
[左方]  icon + Gateway 名稱（點擊連回首頁）  |  v0.x.x badge（點擊連到 /history）
[右方]  狀態 badge  +  自定義內容（auth-gateway 的登入/登出等）
```

### 標準 _layout.tsx 範本

```tsx
import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';
import { GatewayLayout, getVersion } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
const ICON_SVG = 'data:image/svg+xml,...'; // 或 <svg>...</svg>

export const Layout = async ({ title, children, lang }) => {
  const version = await getVersion(ROOT);
  return GatewayLayout({
    title,
    gatewayName: 'My Gateway',
    version,
    icon: <img src={ICON_SVG} class="h-6 w-6 text-primary" />,
    lang,
    children,
    // Navbar 右側（依 Gateway 需求自訂）
    navbarRight: (
      <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
    ),
    // 選用：啟用 Alpine.js
    useAlpine: true,
    alpineSrc: '/static/app.js',
    // 選用：動態 class safelist
    cssSafelist: ['badge-success', 'badge-error'],
  });
};

/** renderPage 供 .md 檔案自動轉 HTML 使用 */
export async function renderPage(title, content, lang) {
  const children = jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
    jsx('div', { class: 'prose max-w-none' }, raw(content)),
  );
  const layoutElement = await Layout({ title: raw(title), lang, children });
  return '<!DOCTYPE html>' + renderToString(layoutElement);
}
```

### ROOT 路徑計算原則

`ROOT` 必須使用 `import.meta.url` 計算，**不能使用 `Deno.cwd()`**，因為 deno dev server 可從任意目錄啟動。

| 檔案位置 | ROOT 計算 |
|---------|----------|
| `routes/_layout.tsx` | `new URL('..', import.meta.url)` |
| `routes/api/version/get.ts` | `new URL('../../../', import.meta.url)` |
| `routes/api/health/get.ts` | `new URL('../../../', import.meta.url)` |

> `new URL().pathname` 對中文路徑回傳 percent-encoded 字串，需用 `decodeURIComponent()` 解碼後才能給 `Deno.readTextFile()` 使用。

---

## 4. 首頁規範

所有 Gateway 的 `routes/_lang_/index.tsx` 使用 Framework 共用區塊組合首頁。

### 首頁區塊順序

```
1. WaveBackground（裝飾波紋）
2. Hero 卡片
   ├── Logo（/images/webcube_banner.svg）
   ├── Gateway 名稱 + 標語
   └── 三操作按鈕：
       ├── 左：文件（/doc）
       ├── 中：data-gateway → 匝道列表下拉
       │   ├── 從 /api/health 取得已註冊閘道
       │   └── 自動掃描本機埠號 8001-8010 的 /api/health 補上未註冊閘道
       │   其他 Gateway → 隱藏（只有文件 + 版本紀錄兩按鈕）
       └── 右：版本紀錄（/history）
3. 服務狀態卡（StatusCard）
4.（選用）連線池狀態卡（data-gateway）
5. 特色卡片網格（FeatureGrid）
6. 技術棧列（TechStackRow）
```

### 標準 index.tsx 範本

```tsx
import { WaveBackground, GatewayHero, StatusCard, FeatureGrid, TechStackRow } from '@dui/framework';

const Landing = (c) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
    <div class="relative overflow-x-hidden w-full">
      <WaveBackground />
      <div class="flex items-center justify-center px-4 py-12 relative z-1">
        <div class="max-w-2xl w-full space-y-6">
          <GatewayHero
            prefix={prefix}
            gatewayName="My Gateway"
            tagline="簡短描述"
            // data-gateway 專用：showGatewayList={true}
          />

          <StatusCard title="服務狀態" subtitle="說明">
            {/* 自訂狀態內容 */}
          </StatusCard>

          <FeatureGrid
            features={[
              { icon: 'M12...', title: '特色一', description: '說明文字', color: 'primary' },
              { icon: 'M9...', title: '特色二', description: '說明文字', color: 'secondary' },
            ]}
            columns={2}
          />

          <TechStackRow />
        </div>
      </div>
    </div>
  );
};

export default Landing;
```

---

## 5. API 端點標準

### `/api/version` — 版本查詢

- 位置：`routes/api/version/get.ts`
- 回傳：`{ "version": "0.x.y" }`
- 實作：直接 re-export framework handler

```ts
import { createVersionHandler } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));
export const GET = createVersionHandler(ROOT);
```

### `/api/health` — 健康檢查

- **位置**：`routes/api/health/get.ts`（公開端點，無需 API Key）
- **標準欄位**：`{ status, service, version, uptime, ...extend }`
- **實作**：使用 `createHealthHandler`，以 `extend` callback 加入專屬欄位

#### 通用欄位

| 欄位 | 型別 | 說明 |
|------|------|------|
| `status` | `"ok" \| "degraded" \| "error"` | **`ok`**：一切正常；**`degraded`**：部分相依不可用（如 data-gateway 未設定或無法連線）；**`error`**：發生錯誤 |
| `service` | `string` | Gateway 名稱（如 `"data-gateway"`） |
| `version` | `string` | 從 `deno.json` 讀取的語意化版本號 |
| `uptime` | `number` | 自啟動以來的毫秒數 |

#### `data_gateway` 子物件

當 Gateway 相依於 data-gateway（如 auth-gateway、site-gateway）時，回應**必須**包含 `data_gateway` 與 `data_gateway_url` 欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `data_gateway_url` | `string \| null` | 設定的 data-gateway URL，未設定則為 `null` |
| `data_gateway` | `object` | 包含 `configured`（boolean）、`reachable`（boolean），連線成功時另加 `status` / `service` / `version` |

```json
// data-gateway 已設定且可連線
{ "configured": true, "reachable": true, "status": "ok", "service": "data-gateway", "version": "0.x.y" }
// data-gateway 未設定
{ "configured": false, "reachable": false }
// data-gateway 已設定但無法連線
{ "configured": true, "reachable": false }
```

#### status 判定規則

- **data-gateway 自身**：L1 與 L2 都就緒 → `ok`，否則 → `degraded`
- **auth-gateway / site-gateway**：data-gateway 已設定且可連線 → `ok`，否則 → `degraded`
- 任何未預期的例外 → `error`（HTTP 500）

#### 使用範例

```ts
import { createHealthHandler } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));
export const GET = createHealthHandler(ROOT, 'my-gateway', async (base) => ({
  // Gateway 專屬狀態欄位
}));
```

---

## 6. 路由系統（檔案路由 + Pass 3）

### 檔案路由基本規則

詳見 [目錄結構標準](#1-目錄結構標準) 的檔案路由規則表。要點：

- 每個 `.ts`/`.tsx` 檔案的檔名決定 HTTP method 與路由路徑
- `_name_` 目錄或檔名 → 動態路徑參數 `:name`
- 多國語言：`_lang_` 目錄 → `:lang` 參數，自動從 Accept-Language 偵測
- `_middleware.ts` 支援目錄層級 middleware（可巢狀）

### Pass 3 階層降級退回機制

當請求未命中任何精確路由時，route-loader 的 `notFound` handler 會自動執行「逐層剝皮」退回：

1. **階梯式退回**：依 `/a/b/c` → `/a/b` → `/a` → `/` 逐層簡化路徑，尋找可處理的 middleware 或路由
2. **搭配 `_middleware.ts`**：每一層的 `_middleware.ts` 可決定是否接手處理（例如 data-gateway 的 `routes/api/_middleware.ts` 攔截所有 `/api/` 請求）
3. **`_lang_` 層級退回**：多語言路由的退回已內建在 route-loader 邏輯中

> 此機制使 Gateway 可以只用少量精確路由檔 + middleware 攔截模式來處理大量動態 API 請求（如 data-gateway 的統一 CRUD API）。

---

## 7. 資料庫使用規範

所有資料操作透過 data-gateway 的 HTTP API，Gateway 自身不直接存取資料庫。

### L1 / L2 / L3 角色

| 層級 | 儲存方式 | 用途 | 誰管理 |
|------|---------|------|--------|
| **L1** | SQLite（`l1.db`） | 本機 bootstrap 資料（系統初始設定、API Key 等） | data-gateway 管理，各 Gateway 透過 L1 CRUD API 讀寫 |
| **L2** | 系統資料庫（配置型） | 所有租戶共享 — 使用者帳號、角色、網站資訊（含 L3 連線設定） | data-gateway 管理，auth-gateway 寫入 seed |
| **L3** | 租戶資料庫（配置型） | 每租戶獨立 — 頁面內容、元件、多媒體等業務資料 | data-gateway 管理，依 X-Tenant header 自動路由 |

### 三層儲存的定位與存取方式

- **誰可以存取哪一層**
  - 所有 Gateway 透過 data-gateway HTTP API 存取 L1/L2/L3
  - data-gateway 是**唯一的資料層**，其他 Gateway 不直接操作資料庫

- **L2 與 L3 的資料庫類型**
  - L2 與 L3 支援 9 種 Adapter（SQLite、MongoDB、MySQL、PostgreSQL、Firestore 等），由安裝者在 setup 流程中指定
  - data-gateway 的 L2 連線設定來自安裝者填寫；每個租戶（網站）的 L3 連線設定則記錄在 L2 的 `網站資訊` collection 中

- **L3 連線管理**
  - 每個租戶（網站）的 L3 連線由 data-gateway 的 `DbManager` 管理，依 `X-Tenant` header 自動路由
  - 連線進入 AdapterPool，支援 heartbeat / cleanup / flush 機制

### CRUD API 路由

data-gateway 提供統一的 CRUD API（所有 API 需攜帶 JWT 或 API Key）：

```
# 單筆操作
GET    /api/{level}/{collection}/{model}      ← 讀取一筆
POST   /api/{level}/{collection}/{model}      ← 建立一筆（可指定 model 或自動產生）
PUT    /api/{level}/{collection}/{model}      ← 覆蓋一筆
PATCH  /api/{level}/{collection}/{model}      ← 局部更新一筆
DELETE /api/{level}/{collection}/{model}      ← 刪除一筆

# 集合操作
GET    /api/{level}/{collection}              ← 列表（支援 pagination、filter）
POST   /api/{level}/{collection}/{model}      ← 建立（collection/model 由 ID 決定）
PUT    /api/{level}/                          ← JSON Array 批次覆蓋
PATCH  /api/{level}/                          ← JSON Array 批次局部更新
DELETE /api/{level}/                          ← JSON Array 批次刪除
GET    /api/{level}/_/schema                  ← 取得 collection schema

# Public API（L1 唯讀，無需認證）
GET    /api/public/{collection}/{model}
GET    /api/public/{collection}
```

> 完整 API 定義請參考 data-gateway 的 `docs/規格書.md`。

---

## 8. Config / API Key

### ConfigStore

每個 Gateway 本機提供持久化 KV 儲存，用於存放執行時期設定。

```ts
import { ConfigStore } from '@dui/util';

// 初始化（data/ 目錄下的 config.json）
const config = new ConfigStore(`${dataDir}/config.json`);

// 讀寫
await config.get('some_key');       // → string | null
await config.set('some_key', 'value');
```

用途：
- 存放相依 Gateway 的 URL（如 `data_gateway_url`）
- 存放 API Key
- 存放 seed hash（由 seed-sync 自動使用）

### API Key 機制

每個 Gateway 安裝時向 data-gateway **註冊**，明確指定要存取的 **collection 與權限**，取得專屬 API Key。

#### 註冊流程

```http
POST /api/register-gateway
Content-Type: application/json

{
  "name": "auth-gateway",                     // Gateway 名稱
  "url": "http://localhost:8001",              // 自身服務 URL（供 data-gateway 記錄 gateway 列表）
  "master_key": "安裝時設定的 Master Key",      // 證明授權
  "權限": {
    "使用者": { "讀": true, "寫": true },       // collection → 讀/寫權限
    "角色":   { "讀": true, "寫": false },
    "系統設定": { "讀": true, "寫": false }
    // ... 需要存取的 collection 逐一列出
  }
}
```

Response：
```json
{ "success": true, "data": { "api_key": "sk-abc123..." } }
```

#### 權限格式

```ts
// 每個 collection 指定獨立的讀/寫權限
{
  "collection名稱": {
    "讀": boolean,   // true = 允許讀取
    "寫": boolean    // true = 允許寫入
  }
}
```

- **只列出該 Gateway 需要的 collection**，不需要的就不要列
- data-gateway 在每次 API 請求時，以 `X-API-Key` header 查對應權限表
- 寫入權限 (`寫: true`) 包含讀取權限，但建議兩者都明確設定

#### 註冊後的步驟

1. Gateway 將回傳的 `api_key` 存入本機 ConfigStore（如 `config.json` 的 `api_key` 欄位）
2. 後續所有對 data-gateway 的請求攜帶 `X-API-Key` header
3. data-gateway 的 L1/L2/L3 middleware 自動驗證 API Key 並檢查 collection 權限

> **重要**：註冊時必須提供 Master Key（data-gateway setup 時設定的管理金鑰），以證明 Gateway 已被授權註冊。Master Key 僅用於註冊流程，後續請求使用 API Key。

---

## 9. Seed 同步機制

### 角色

每個 Gateway 的 `database/seeds/` 目錄存放初始化所需的種子資料，分為 `L1/`、`L2/`、`L3/` 子目錄（依需求可只有其中若干層）。

### 運作流程

1. Gateway setup 完成後呼叫 `syncAllSeeds()`
2. `detectSeedLevels()` 自動偵測 `seeds/` 下存在的層級目錄
3. 對每層級：
   a. `computeSeedsHash()` 計算 seed 內容的 SHA-256 hash
   b. 從 ConfigStore 讀取上次同步的 hash
   c. 若 hash 不同 → `syncSeeds()` 以批次 PUT 覆寫至 data-gateway
   d. hash 寫回 ConfigStore（下次啟動時比對）
4. **只覆寫 seed 檔案中有定義的記錄**，不刪除資料庫中多餘的記錄（避免誤刪使用者資料）

### SyncSeedsOptions 參數

```ts
{
  seedsRoot: '/path/to/seeds',  // seeds/ 目錄絕對路徑
  store: configStore,           // ConfigStore 實例
  baseUrl: 'http://...',        // data-gateway URL
  apiKey: '...',                // 安裝時註冊的 API Key
  level: 'L2',                  // 目標層級
  tenant?: 'example.com',       // L3 專用
  prepare?: (record) => record, // 送出前轉換 hook
}
```

---

## 10. 版本號規則

所有 Gateway 與 Package 遵循以下版本號規則：

1. **語意化版本（Semantic Versioning）**：格式為 `X.Y.Z`（Major.Minor.Patch）
2. **正式版前**（v1.0.0 之前）：維持 `0.x.y` 格式
   - `x`（minor）：新增重大功能時 +1（如 0.8.0 → 0.9.0 → 0.10.0）
   - `y`（patch）：小幅修正、Bug 修復時 +1（如 0.8.0 → 0.8.1）
3. **各 Gateway 獨立編號**：每個 Gateway 的版本號獨立演進，不與其他 Gateway 同步
4. **版本號記錄位置**：各 Gateway/Package 根目錄的 `deno.json` 中的 `version` 欄位
5. **版本紀錄**：各 Gateway 的 `routes/_lang_/history.md` 記錄完整版本演進歷史
6. **自動化取得**：前端透過 `/api/version` 取得當前版本，不硬編碼

---

## 11. dui-util 工具一覽

`@dui/util` 提供跨 Gateway 共用的基礎工具：

### InnerAPI（同進程內部路由）

```ts
import { InnerAPI, 設定App, 取得域名 } from '@dui/util';

// main.ts 啟動時注入 Hono app
設定App(app);

// 在 handler 中呼叫同進程 API
const resp = await InnerAPI(c, '/api/health');
// 自動快取、自動攜帶 Context 資訊
```

### gwFetch（跨 Gateway HTTP 客戶端）

```ts
import { gwFetch } from '@dui/util';

// 自動攜帶 Context 中的語言、租戶、JWT、Trace ID
const resp = await gwFetch(c, dataGwUrl, '/api/l2/users');
```

### 加密工具

```ts
import { encrypt, decrypt, ensureKey, registerKey } from '@dui/util';

// 加密（AES-256-GCM）
const encrypted = await encrypt(plaintext);

// 解密
const decrypted = await decrypt(encrypted);

// 確保密鑰存在（自動產生 .crypto.key）
await ensureKey(dataDir);
```

### 統一 Response 型別

```ts
import { success, paginated, errorRes, Errors } from '@dui/util';
import type { SuccessResponse, ErrorResponse, ApiResponse, PaginatedData } from '@dui/util';

// 成功回應
return c.json(success(data, 'L2'));
// 分頁回應
return c.json(paginated(data, page, pageSize, total, 'L3'));
// 錯誤回應
return c.json(errorRes(Errors.NOT_FOUND('記錄不存在')), 404);
```

### ConfigStore

```ts
import { ConfigStore } from '@dui/util';

const store = new ConfigStore(`${dataDir}/config.json`);
await store.get('key');       // 讀取
await store.set('key', val);  // 寫入
await store.delete('key');    // 刪除
await store.list();           // 列出所有 key
```

### Logger

```ts
import { logger, debug, info, warn, error } from '@dui/util';

// 自動附加 Trace ID（若在請求鏈中）
info('使用者登入成功', { userId: '...' });
```

### 字串／陣列工具

```ts
import { StringUtils, ArrayUtils } from '@dui/util';

StringUtils.camelToSnake('myField');  // → 'my_field'
StringUtils.snakeToCamel('my_field'); // → 'myField'
ArrayUtils.groupBy([...], 'key');
```

### 檔案格式對應

```ts
import { 格式對應表, getFormatFromExt, getFormatFromMime } from '@dui/util';

getFormatFromExt('.jpg');  // → 'image/jpeg'
getFormatFromMime('image/png'); // → { ext: '.png', ... }
```

---

## 12. 權限系統

`@dui/framework` 提供角色權限的共用型別與工具函式。所有 Gateway 的 API 端點**必須**透過 JWT payload 中的 `權限` 欄位（PermissionMap）判斷操作是否允許，**不得**硬編碼角色名稱。

### 權限資料結構

```ts
interface PermissionMap {
  l2?: LevelPermission;  // L2（系統層）權限
  l3?: LevelPermission;  // L3（租戶層）權限
}

interface LevelPermission {
  default?: CollectionPermission;           // 預設權限（該層級未指定的 collection 使用此值）
  [collection: string]: CollectionPermission; // 指定 collection 的權限
}

interface CollectionPermission {
  讀?: boolean | 'self';  // true=允許, false=禁止, 'self'=僅限本人
  寫?: boolean | 'self';
}
```

權限值說明：

| 值 | 意義 |
|----|------|
| `true` | 允許所有操作（無限制） |
| `false` | 禁止操作 |
| `"self"` | 僅允許操作自己的資料（比對 `payload.sub` 與目標資料的作者/ID） |

### 權限記錄位置

權限定義在角色的 JSON 中（L2 seed 或 L3 執行期建立皆同此格式）：

```json
{
  "id": "使用者:角色:管理員",
  "名稱": { "zh-tw": "管理員" },
  "權限": {
    "l1": {
      "default": { "讀": false, "寫": false }
    },
    "l2": {
      "default": { "讀": false, "寫": false },
      "使用者": { "讀": true, "寫": true },
      "網站資訊": { "讀": true, "寫": "self" }
    },
    "l3": {
      "default": { "讀": true, "寫": true }
    }
  }
}
```

### 權限判斷流程

1. **auth-gateway** 在 `verify-user` 流程中以 `mergePermissions()` 合併使用者多角色的權限
2. 合併後的 `PermissionMap` 寫入 JWT payload 的 `權限` 欄位（每次登入/refresh 時重新計算）
3. 各業務 Gateway 從 JWT payload 讀取 `權限`，以 `checkAccess()` 或 `checkPermission()` 判斷操作
4. **data-gateway** 不做角色權限判斷（純資料層），僅以 API Key 管控 Gateway 層級的存取

### 核心函式

| 函式 | 用途 | 範例 |
|------|------|------|
| `checkAccess(payload, level, collection, action, authorId?)` | **完整存取檢查**（含 `self` 比對） | `checkAccess(payload, 'l2', '使用者', '寫', targetId)` |
| `checkPermission(permissions, level, collection, action)` | **查詢權限值**（回傳 `boolean \| 'self'`） | `checkPermission(payload.權限, 'l2', '使用者', '讀')` |
| `mergePermissions(roles)` | 合併多角色權限（取最寬鬆） | `mergePermissions(userRoles)` |
| `extractCollection(id)` | 從 composite ID 取 collection | `extractCollection('使用者:角色:管理員') → '使用者'` |

### `checkAccess()` 判斷邏輯

```
                 ┌──────────────┐
                 │ payload 存在? │
                 └──────┬───────┘
                    No  │  Yes
                    ┌───▼───┐
                    │ false │
                    └───────┘
                        │
           ┌────────────▼────────────┐
           │ checkPermission()       │
           │ (讀取 payload.權限)      │
           └────────────┬────────────┘
              ┌────┬────┴────┬────┐
              │    │         │    │
           true  false     'self'
              │    │         │
           ┌──▼┐ ┌▼──┐  ┌───▼────┐
           │true│ │false│ │authorId│
           └───┘ └────┘ │===     │
                        │sub?    │
                        ├──┬──┬──┤
                        │Y │  │N │
                        │  │  │  │
                      ┌─▼┐│┌─▼─┐│
                      │T │││ F ││
                      └──┘│└───┘│
                          │     │
                       ┌──▼┐ ┌─▼─┐
                       │ T │ │ F │
                       └───┘ └───┘
```

### API 端點實作模式

#### 原則

所有 API 端點的權限檢查**必須**透過 `checkAccess()` 讀取 JWT 中的 `權限` 欄位，**禁止**直接比對 `payload.角色` 陣列中的角色名稱字串。

#### ✅ 正確作法（檢查權限地圖）

```ts
// 寫操作（PUT / PATCH / DELETE）
const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
if (!payload || !checkAccess(payload, 'l2', '使用者', '寫', userId)) {
  return c.json({ success: false, error: '無權限' }, 403);
}

// 讀操作 — 決定回傳完整或公開資料
const canViewFull = payload ? checkAccess(payload, 'l2', '使用者', '讀', targetId) || payload.sub === targetId : false;
```

#### ❌ 錯誤作法（硬編碼角色名稱）

```ts
// ✗ 不要這樣做！
const roles = payload?.角色 as string[] || [];
const isAdmin = roles.includes('使用者:角色:超級管理員') || roles.includes('使用者:角色:管理員');
```

#### GET 列表端點

列表端點使用 **blanket check**（不帶 `authorId`）決定所有項目的回傳格式：

```ts
const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
const canViewFull = payload ? checkAccess(payload, 'l2', '使用者', '讀') : false;

// 逐筆過濾資料
for (const item of items) {
  if (canViewFull) {
    // 回傳完整資料（含敏感欄位）
  } else {
    // 回傳僅公開欄位
  }
}
```

#### 單筆 GET 端點

單筆查詢使用 `canViewFullUserData()` helper（定義於 model 層，內部使用 `checkAccess`）：

```ts
import { canViewFullUserData } from '../../database/models/使用者.ts';

const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
if (canViewFullUserData(payload, userId)) {
  // 回傳完整資料
} else {
  // 回傳公開使用者資料
}
```

`canViewFullUserData()` 的判斷邏輯：
1. `checkAccess(payload, 'l2', '使用者', '讀', targetUserId)` → 有讀權限則可看完整資料
2. `payload.sub === targetUserId` → 自己看自己也可看完整資料

#### PUT / PATCH / DELETE 端點

修改操作直接使用 `checkAccess()` 檢查**寫權限**：

```ts
const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
if (!payload || !checkAccess(payload, 'l2', '使用者', '寫', userId)) {
  return c.json({ success: false, error: '無權限' }, 403);
}
```

權限判定對應：

| 角色 | L2 `使用者` 寫權限 | PUT/PATCH/DELETE 結果 |
|------|-------------------|----------------------|
| 超級管理員 | `default: true`（繼承） | ✅ 可操作任何使用者 |
| 管理員 | `使用者: { 寫: true }` | ✅ 可操作任何使用者 |
| 會員 | `default: false`，無明確 `使用者` 設定 | ❌ 403（會員僅存在於 L3） |

> 會員角色僅存在於 L3（租戶層），因此對 L2 的寫操作應直接回傳 403。會員的自我管理透過 L3 端點處理。

### `requireCollectionRead` Middleware 模式

對於需要「已登入 + 特定 collection 讀權限」的 API 目錄，使用 `require-auth.ts` 提供的 middleware factory：

```ts
/**
 * require-auth.ts — 提供 requireCollectionRead middleware
 */
import { getAuthenticatedPayload } from './utils/require-auth.ts';
import { checkAccess } from '@dui/framework';

export function requireCollectionRead(collection: string, level: 'l2' | 'l3' = 'l2') {
  return async function middleware(c: Context, next: Next) {
    const payload = await getAuthenticatedPayload(c);
    if (!payload) return c.json({ success: false, error: '請先登入' }, 401);
    if (!checkAccess(payload, level, collection, '讀')) {
      return c.json({ success: false, error: '無權限存取此資源' }, 403);
    }
    c.set('jwt_payload', payload);
    await next();
  };
}
```

使用方式：

```ts
// routes/api/user/_middleware.ts
import { requireCollectionRead } from '../../../utils/require-auth.ts';
export const middleware = requireCollectionRead('使用者', 'l2');

// routes/api/role/_middleware.ts
import { requireCollectionRead } from '../../../utils/require-auth.ts';
export const middleware = requireCollectionRead('使用者', 'l2');
```

### 權限擴充原則

- **新增角色**時，只需在 seed JSON 中設定該角色的 `權限` 欄位，**不需修改任何程式碼**
- JWT 中的 `權限` 是登入時合併當下角色權限的**快照**，角色權限變更後需重新登入才能生效
- `"self"` 比對的是 JWT payload 的 `sub` 欄位（composite ID），而非 `帳號`

---

## 13. DataPool — 通用資料代理層

所有需要跟 data-gateway 通訊的 Gateway（auth-gateway、site-gateway、page-gateway、billing-gateway、ai-gateway 等）應透過 **`@dui/pool` 的 `DataPool`** 作為統一的後端資料存取層，不直接對 data-gateway 發起 HTTP 請求。

> **例外**：不需 data-gateway 的直連型 Gateway（如 data-gateway 本身、cdn-gateway）可跳過此層。

### 13.1 Pool 層級體系

`@dui/pool` 提供四個層級的 Pool，繼承關係如下：

```
PoolBase（抽象基底 — timer、lifecycle hooks、status、destroy）
 └── BasePool（抽象 — LRU Map、get/set/has/delete、dirty flush、idle eviction）
      └── CachePool（read-through 快取 — TTL、getOrFetch、prefix invalidate）
           └── DataPool（DG 通訊代理 + 泛用 CRUD）
```

| 層級 | 適用場景 | 關鍵功能 |
|------|---------|---------|
| `PoolBase` | 需要定時任務+狀態管理的自訂池 | cleanup/heartbeat timer、`getStatus()`、`destroy()`、`reconfigure()` |
| `BasePool` | LRU 快取池（純記憶體存取） | `get`/`set`/`has`/`delete`、`flushToStorage`、`getItemsOverview` |
| `CachePool` | Read-through 快取（DG 上游） | `getOrFetch(key, fetcher, ttlMs?)`、TTL 自動失效、`invalidateByPrefix` |
| `DataPool` | DG CRUD 代理（快取+寫透） | `getById`/`list`/`create`/`update`/`remove`、`request()` 通用代理 |

另外有獨立於此繼承鏈的 **`TaskPool`**（繼承 `PoolBase`），提供多優先級任務佇列與並發控制，適合 ai-gateway 的 LLM 調用排隊、schedule-gateway 的排程任務等場景。

### 13.2 建立 DataPool 實例

每個 Gateway 建立自己的 DataPool 實例時，在建構子傳入兩個 async resolver：

```ts
import { DataPool } from '@dui/pool';

class MyGatewayPool extends DataPool<MyCacheValue> {
  constructor() {
    const getDgUrl = async () => {
      // 從 ConfigStore 或環境變數讀取 data-gateway URL
      const url = await getConfig().get('data_gateway_url');
      return url ?? Deno.env.get('DATA_GATEWAY_URL') ?? null;
    };
    const getApiKey = async () => {
      return await getConfig().get('data_gateway_api_key') ?? null;
    };
    super(getDgUrl, getApiKey, { maxSize: 5000 });
  }
}
```

- `getDgUrl`：回傳 data-gateway 的 base URL（如 `http://localhost:8002`）
- `getApiKey`：回傳 data-gateway 的 API Key（安裝時註冊取得）
- 兩個 resolver 均為 `async`，可在內部實作快取避免重複 IO

### 13.3 快取 Key 設計

**一律使用 record ID（`userId`、`pageId` 等）作為 pool 的主 key**，格式為：

```
{level}:{collection}:{id}
```

- `level`：`l2`（SYSTEM）或 `l3`（tenant）
- `collection`：資料集合名稱（如 `使用者`、`頁面`）
- `id`：該記錄的唯一識別碼

範例：

```
l2:使用者:00f61f6b      ← L2 系統使用者
l3:example:頁面:首頁     ← L3 租戶頁面
```

> **為何不用帳號或 slug 當 key？**  
> 帳號、slug 等欄位可能變更（更名、轉移）。以不變的 ID 為 key 才能保證快取一致性。  
> 需要以可變欄位查詢時，直接在記憶體內掃描所有 items 比對（微秒級），不需輔助索引。

### 13.4 快取策略

DataPool 的泛用 CRUD 方法內建以下快取規則：

| 操作 | 快取策略 | 原因 |
|------|----------|------|
| 單筆讀取（`getById`） | ✅ 先檢查快取 → hit 回傳 → miss 打 DG → 寫入快取 | 降低重複查詢延遲；**回傳型別受 `T extends V` 約束**（見 13.4.1） |
| 列表查詢（`list`） | ❌ pass-through，不進快取 | 列表有分頁/篩選/即時性需求 |
| 建立（`create`） | ⚙️ **不寫入快取**，回傳 created 由呼叫端（Typed Wrapper）決定 | 快取形狀由各 Pool 的介面界定，泛型方法不裸寫（見 13.4.1） |
| 完整更新（`PUT`） | ⚙️ **不寫入快取**，回傳 updated 由呼叫端（Typed Wrapper）決定 | 同上 |
| 部分更新（`PATCH`） | 🗑️ DG 成功後失效快取（含 TTL） | PATCH 回傳資料不全，失效讓下次讀取重抓 |
| 刪除（`remove`） | 🗑️ 先清除快取，再刪除 DG | 避免髒資料殘留 |
| 通用代理（`request`） | ❌ pass-through，不進快取 | 通用請求無特定快取邏輯 |

> 自訂 Gateway Pool 可在繼承 DataPool 後 override `onFlush()` / `onEvict()` 實作專屬 flush 邏輯（如 auth-gateway 的 AccountPool flush pending login/logout events）。

### 13.4.1 快取形狀一致性（重要！避免「快取形狀不一致」錯誤）

**教訓**（2026-08-07，auth-gateway 變更密碼後「使用者不存在」）：

快取形狀不一致的根源是**泛型方法直接把 DG 回傳的裸 json 寫入快取**，而讀取端卻期待另一種形狀（例如 `{ user }` 包裝）——同一 cacheKey 兩種形狀，解包失敗。原因正是快取沒有被 model/interface 界定。

**規範**：

1. **以 model/interface 界定快取形狀**。Pool 的快取值型別 `V` 必須是明確的介面（如 `AccountCacheValue = { user: CachedUser; pendingEvents? }`），並在建構 `extends DataPool<V>` 時指定。
2. **快取值 ≠ DG 記錄時，不得用 `as unknown as V` 裸寫**。`getById` 要求回傳型別 `T extends V`（編譯期拒絕形狀不符）；`create`/`update` 不再自動寫快取，由呼叫端以 Typed Wrapper 決定。
3. **同一 cacheKey 的讀寫必須走同一組 helper**。在 Pool 內封裝 `readCachedXxx` / `writeCachedXxx` / `deleteCachedXxx`（如 AccountPool 的 `readCachedUser`/`writeCachedUser`/`deleteCachedUser`），不允許散落直接操作 `this.items`。
4. **快取層級以使用者實際 `_layer` 為準**。L3→L2 fallback 登入時，login 帶入的 tenant 可能指向 L3，但使用者實際在 L2；若用 tenant 寫層級，L2 使用者會被寫進 `l3:` 快取（改密碼時清不到）。

```ts
// ✅ 正確：Typed Wrapper 以介面組裝後寫入
private writeCachedUser(level: string, user: CachedUser, markDirty = false): void {
  this.set(this.userCacheKey(level, user.id), { user }, markDirty);
}

// ❌ 錯誤：泛型方法裸寫 DG json（解包時形狀不符）
this.set(cacheKey, created as unknown as V, false);
```

### 13.5 通用代理 `request()`

對於非常規 CRUD 的查詢（角色權限、系統設定、跨 collection 聚合等），使用 `request()` 直接發送 HTTP 請求：

```ts
const res = await myPool.request('GET', '/api/l2/角色權限/admin');
const data = await res.json();
```

- 自動攜帶 `X-API-Key`、`X-Tenant`（若有）等 header
- 不解析、不快取回應內容
- 確保所有對 data-gateway 的 HTTP 請求統一經過 pool

### 13.6 可觀測性

DataPool（繼承鏈全部）提供以下狀態檢視方法：

| 方法 | 回傳內容 |
|------|---------|
| `getStatus()` | 容量、當前大小、命中率、錯誤數、平均閒置時間、利用率等 |
| `getItemsOverview()` | 每筆 entry 的存取次數、最後存取時間、是否髒資料、剩餘閒置時間 |
| `getCurrentSize()` | 當前 entry 數量 |
| `destroy()` | 停止所有 timer、flush 髒資料、清除所有 entry |

所有 Pool 實例也繼承 `reconfigure(options)`，可在執行期動態調整部分選項（如 `maxSize`、`cleanupIntervalMs`）。

### 13.7 AccountPool（auth-gateway 專屬擴充）

auth-gateway 的 `AccountPool` 是 DataPool 的實際應用範例，在 DataPool 之上增加：

- **`getUserByAccount`**：掃描 items 比對帳號欄位（同步，微秒級）
- **`verifyPassword`**：整合快取 + bcrypt 驗證 + data-gateway 查詢
- **`recordSuccess`/`recordFailure`/`isLocked`**：登入鎖定機制（5 次失敗鎖 10 分鐘）
- **`recordLogout`**：登出事件暫存
- **`onFlush` override**：將 pending 登入/登出事件 batch 寫回 data-gateway

AccountPool 的快取形狀由介面界定：`AccountCacheValue = { user: CachedUser; pendingEvents? }`。所有使用者快取讀寫一律走 `readCachedUser` / `writeCachedUser` / `deleteCachedUser` helper（見 13.4.1），並以使用者實際 `_layer` 決定快取層級，**不**以 login 傳入的 tenant 判斷。

其他 Gateway 若需 auth-gateway 的使用者資料，應直接呼叫 auth-gateway 的 API，不自行建 AccountPool。

### 13.8 TaskPool（非同步任務佇列）

對於有併發控制需求的 Gateway（ai-gateway LLM 調用排隊、schedule-gateway 排程任務），使用 **`TaskPool`**（繼承 `PoolBase`）：

```ts
import { TaskPool } from '@dui/pool';

const taskPool = new TaskPool({
  maxConcurrency: 4,
  autoScale: true,
  queues: {
    critical: { priority: 0, concurrency: 1 },
    high:     { priority: 1, concurrency: 2 },
    default:  { priority: 2, concurrency: 4 },
    batch:    { priority: 3, concurrency: 1 },
  },
});

// 提交任務
const result = await taskPool.exec('critical', async (ctx) => {
  const data = await ctx.data.getById(...);
  return await llmCall(data);
});
```

- 支援多優先級佇列（critical / high / default / batch）
- Auto-scaling：根據 queue pressure 自動調整最大並發數
- Backpressure：佇列超過 `maxQueueSize` 時拒絕新任務
- `dataSource` 選項：可傳入 DataPool/CachePool 實例，任務透過 `ctx.data` 存取

> 注意：DataPool 與 TaskPool 是「組合（composition）」而非繼承關係。DataPool 提供資料快取與 CRUD，TaskPool 提供任務排隊與併發控制，兩者可獨立使用或透過 `dataSource` 組合使用。

---

## 14. 新增 Gateway 快速步驟

建立新 Gateway 時，依以下檢查清單逐步實作：

### 步驟 1：建立目錄結構

```
gateway/{name}-gateway/
├── main.ts                    ← (見範本)
├── deno.json                  ← 設定版本號、workspace imports
├── routes/
│   ├── _layout.tsx            ← (使用 GatewayLayout，見 §3)
│   ├── _middleware.ts         ← JWT 驗證 + 語言偵測
│   ├── _lang_/
│   │   ├── index.tsx          ← (使用 GatewayHero 等，見 §4)
│   │   ├── doc.md             ← 文件
│   │   └── history.md         ← 版本紀錄
│   ├── api/
│   │   └── version/
│   │       └── get.ts         ← (createVersionHandler, 見 §5)
│   └── api/
│       ├── health/
│       │   └── get.ts         ← (createHealthHandler, 見 §5)
├── services/
├── utils/
├── database/
│   └── seeds/                 ← (L1/ L2/ L3 視需求)
└── data/                      ← (執行時自動產生)
```

### 步驟 2：實作 main.ts

```ts
import { createGateway } from '@dui/framework';

const gateway = await createGateway({
  name: '{Name} Gateway',
  port: 8xxx,
  dirname: import.meta.dirname!,
});

gateway.start();
```

### 步驟 3：實作 _layout.tsx + index.tsx

依 [§3 Layout 規範](#3-layout-規範) 與 [§4 首頁規範](#4-首頁規範) 實作。

### 步驟 4：實作 API 端點

依 [§5 API 端點標準](#5-api-端點標準) 建立 `/api/version` 與 `/api/health`。

### 步驟 5：實作 _middleware.ts

```ts
import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  // 1. 語言偵測（從 Accept-Language 或 cookie）
  const acceptLang = c.req.header('Accept-Language') || 'zh-tw';
  // 2. JWT 驗證（若有）
  // 3. 注入 context（lang, tenant, jwt_type, 帳號, 角色, 權限）
  await next();
}
```

### 步驟 6：實作 Seed 同步（如有 seed 資料）

在 setup 流程或首次啟動時呼叫 `syncAllSeeds()`：

```ts
import { syncAllSeeds, detectSeedLevels } from '@dui/framework';
import { ConfigStore } from '@dui/util';

const seedsDir = `${import.meta.dirname}/database/seeds`;
const store = new ConfigStore(`${dataDir}/config.json`);
const apiKey = await store.get('api_key');
const dataGwUrl = await store.get('data_gateway_url');

await syncAllSeeds({
  seedsRoot: seedsDir,
  store,
  baseUrl: dataGwUrl!,
  apiKey: apiKey!,
});
```

> **注意**：註冊 API Key 時，必須在 `權限` 欄位中明確列出 seed 會用到的所有 collection。例如若 seeds/L2/ 下有 `使用者.json` 和 `角色.json`，則註冊時應包含：
> ```json
> { "使用者": { "讀": false, "寫": true }, "角色": { "讀": false, "寫": true } }
> ```

### 步驟 7：加入 workspace

在根目錄 `deno.json` 的 `workspace` 列表中加入新 Gateway。

### 步驟 8：啟動驗證

```bash
deno check gateway/{name}-gateway/main.ts                # Type check
curl http://localhost:8xxx/api/version                    # → {"version":"0.1.0"}
curl http://localhost:8xxx/api/health                      # → {"status":"ok",...}
curl http://localhost:8xxx/zh-tw/                         # → HTML（含完整頁面）
```