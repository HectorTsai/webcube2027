# SmartMultilingual

一個智慧的多語言內容庫，用於處理多語言內容，並具備智慧內容載入功能。

## 功能

- **多國語言物件**：支援多語言字串、二進位物件和智慧內容。
- **智慧內容載入**：根據內容自動擷取檔案或遠端資料。
- **翻譯服務**：提供註冊和獲取翻譯服務的介面。
- **資源處理**：處理不同格式的檔案資源。

## 安裝

使用 Deno：

```bash
deno add @dui/smartmultilingual
```

## 用法

```typescript
import {
  MultilingualString,
  MultilingualSmartContent,
  SmartContent,
} from "@dui/smartmultilingual";

// 多國語言字串：若缺少目標語言會自動翻譯並快取（預設 Google，可自訂 registerTranslation）
const str = new MultilingualString({ en: "Hello" });
const zh = await str.toStringAsync("zh-tw");

// 智慧內容：會自動判定/載入 http/https/file/data/ftp 內容並推斷格式（TEXT/MARKDOWN/SVG/BINARY...）
const content = new SmartContent({ format: "TEXT", content: "# Hello" });
await content.fetchAsync();

// 多國語言智慧內容：文字/Markdown 會翻譯並快取；SVG/二進位不翻譯但會複製
const mlContent = new MultilingualSmartContent({ en: content });
const jaText = await mlContent.toStringAsync("ja");
```

## 開發

### 測試

```bash
deno task test

# 若要驗證實際 Google 翻譯（需網路與 env 權限）
ALLOW_NET_TRANSLATION=1 deno test --allow-net --allow-env src/test/multilingual_string_test.ts
```

### 開發模式

```bash
deno task dev
```

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 作者

Hector — hector@dui.com.tw

## 許可證

MIT
