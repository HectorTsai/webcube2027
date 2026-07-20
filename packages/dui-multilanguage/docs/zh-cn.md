# SmartMultilingual

一个智能的多语言内容库，用于处理多语言内容，并具备智能内容加载功能。

## 功能

- **多语言对象**：支持多语言字符串、二进制对象和智能内容。
- **智能内容加载**：根据内容自动获取文件或远程数据。
- **翻译服务**：提供注册和获取翻译服务的接口。
- **资源处理**：处理不同格式的文件资源。

## 安装

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

// 多语言字符串：若缺少目标语言会自动翻译并缓存（默认 Google，可自定义 registerTranslation）
const str = new MultilingualString({ en: "Hello" });
const zh = await str.toStringAsync("zh-cn");

// 智能内容：会自动判定/加载 http/https/file/data/ftp 内容并推断格式（TEXT/MARKDOWN/SVG/BINARY...）
const content = new SmartContent({ format: "TEXT", content: "# Hello" });
await content.fetchAsync();

// 多语言智能内容：文字/Markdown 会翻译并缓存；SVG/二进制不翻译但会复制
const mlContent = new MultilingualSmartContent({ en: content });
const jaText = await mlContent.toStringAsync("ja");
```

## 开发

### 测试

```bash
deno task test

# 如需验证实际 Google 翻译（需网络与 env 权限）
ALLOW_NET_TRANSLATION=1 deno test --allow-net --allow-env src/test/multilingual_string_test.ts
```

### 开发模式

```bash
deno task dev
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

Hector — hector@dui.com.tw

## 许可证

MIT
