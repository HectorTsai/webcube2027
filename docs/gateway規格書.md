# Gateway 規格書

> 此文件定義 WebCube2027 中所有 Gateway 必須遵守的共用規範。
> **新增 Gateway 時，請依此文件逐步實作**，確保所有 Gateway 的架構與使用者體驗一致。
>
> 最後更新：2026-08-06

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
- [13. 新增 Gateway 快速步驟](#13-新增-gateway-快速步驟)

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
       ├── 中：data-gateway → 匝道列表下拉（從 /api/health 動態載入）
       │    其他 Gateway → 隱藏（只有文件 + 版本紀錄兩按鈕）
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
- 標準欄位：`{ status, service, version, uptime, ...extend }`
- 實作：使用 `createHealthHandler`，以 `extend` callback 加入專屬欄位

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

`@dui/framework` 提供角色權限的共用型別與工具函式。

### 權限資料結構

```ts
interface PermissionMap {
  l2?: LevelPermission;  // L2 權限
  l3?: LevelPermission;  // L3 權限
}

interface LevelPermission {
  default?: CollectionPermission;          // 預設權限
  [collection: string]: CollectionPermission; // 指定 collection 權限
}

interface CollectionPermission {
  讀?: boolean | 'self';  // true=允許, false=禁止, 'self'=僅限本人
  寫?: boolean | 'self';
}
```

### 權限判斷流程

1. auth-gateway 在 verify-user 流程中以 `mergePermissions()` 合併使用者的多角色權限
2. 合併後的 `PermissionMap` 寫入 JWT payload 的 `權限` 欄位
3. 各業務 Gateway 讀取 JWT 中的 `權限`，以 `checkAccess()` 判斷操作是否允許
4. data-gateway 不做權限判斷（純資料層），僅以 API Key 管控 Gateway 存取

---

## 13. 新增 Gateway 快速步驟

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