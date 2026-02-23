/**
 * App root component
 */

import type { VNode } from "@dreamer/view";

interface AppProps {
  children?: VNode | VNode[];
  title?: string;
  description?: string;
}

export default function App({
  children,
  title = "webcube2027",
  description = "Built with @dreamer/dweb",
}: AppProps) {
  const theme = (globalThis as any).currentTheme;
  let themeCSS = "";
  if (theme) {
    themeCSS = `:root {
      --p: ${theme.主色};
      --pc: oklch(from ${theme.主色} calc(l + 0.3) c h);
      --s: ${theme.次色};
      --sc: oklch(from ${theme.次色} calc(l + 0.3) c h);
      --a: ${theme.強調色};
      --ac: oklch(from ${theme.強調色} calc(l + 0.3) c h);
      --n: ${theme.中性色};
      --nc: oklch(from ${theme.中性色} calc(l + 0.3) c h);
      --b1: ${theme.背景1};
      --b2: ${theme.背景2};
      --b3: ${theme.背景3};
      --bc: ${theme.背景內容};
      --in: ${theme.資訊色};
      --inc: oklch(from ${theme.資訊色} calc(l + 0.3) c h);
      --su: ${theme.成功色};
      --suc: oklch(from ${theme.成功色} calc(l + 0.3) c h);
      --wa: ${theme.警告色};
      --wac: oklch(from ${theme.警告色} calc(l + 0.3) c h);
      --er: ${theme.錯誤色};
      --erc: oklch(from ${theme.錯誤色} calc(l + 0.3) c h);
    }`;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <title>{title}</title>
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased">
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
