// 共用版面 — HTML 外殼
import type { FC } from "hono/jsx";

interface Props {
  title?: string;
  theme?: string;
  children?: unknown;
}

export const Layout: FC<Props> = (props) => (
  <html lang="zh-TW" data-theme={props.theme ?? "dark"}>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title ?? "AI 中心"}</title>
      <link rel="stylesheet" href="/static/style.css" />
    </head>
    <body>{props.children}</body>
  </html>
);
