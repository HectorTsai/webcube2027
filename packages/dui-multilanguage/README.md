# SmartMultilingual

An intelligent multilingual content library for Deno. It handles multilingual strings, smart content loading, and translation with sensible defaults.

- Chinese docs: see [docs/zh-tw.md](./docs/zh-tw.md)
- 繁體中文文件：請見 [docs/zh-tw.md](./docs/zh-tw.md)
- 简体中文文档：请见 [docs/zh-cn.md](./docs/zh-cn.md)

## Features

- **Multilingual objects**: strings, binaries, and smart content.
- **Smart content loading**: auto-fetch and format inference for http/https/file/data/ftp URLs.
- **Translation service**: pluggable; defaults to Google Translate when none is registered.
- **Resource handling**: basic file format utilities.

## Installation

```bash
deno add @dui/smartmultilingual
```

## Usage

```typescript
import {
  MultilingualString,
  MultilingualSmartContent,
  SmartContent,
} from "@dui/smartmultilingual";

// Multilingual string: auto-translate missing target language (default Google, or registerTranslation to override)
const str = new MultilingualString({ en: "Hello" });
const zh = await str.toStringAsync("zh-tw");

// Smart content: auto-detect and fetch content, infer format (TEXT / MARKDOWN / SVG / BINARY ...)
const content = new SmartContent({ format: "TEXT", content: "# Hello" });
await content.fetchAsync();

// Multilingual smart content: text/markdown will be translated & cached; SVG/binary are not translated but cloned
const mlContent = new MultilingualSmartContent({ en: content });
const jaText = await mlContent.toStringAsync("ja");
```

## Development

### Tests

```bash
deno task test

# Optional: run real Google translation integration (needs net + env)
ALLOW_NET_TRANSLATION=1 deno test --allow-net --allow-env src/test/multilingual_string_test.ts
```

### Dev mode

```bash
deno task dev
```

## Contributing

PRs and issues are welcome!

## Author

Hector — hector@dui.com.tw

## License

MIT
