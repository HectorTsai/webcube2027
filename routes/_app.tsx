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
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <title>{title}</title>
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased">
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
