# 關於 AI 中心

AI 中心提供統一的 OpenAI 相容 API，後端串接多種 AI Provider：

## 支援的 Provider

- **OpenAI** — GPT-4o, GPT-4o-mini
- **Anthropic** — Claude 3.5 Sonnet, Claude 3 Opus
- **Gemini** — Gemini 2.0 Flash, Gemini 2.0 Pro
- **Ollama** — 本地部署的開源模型

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天完成 |
| `/v1/models` | GET | 模型列表 |

## 架構

```
Request → _middleware.ts (JWT 驗證)
         → AI Resource Pool (動態路由)
         → Provider Adapter (統一介面)
         → AI 伺服器
```

> 詳細規格請參閱各 Provider 文件。