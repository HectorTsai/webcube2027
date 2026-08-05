import 'hono/jsx'

declare module 'hono/jsx' {
  interface HTMLAttributes {
    'x-data'?: string | object;
    'x-text'?: string;
    'x-on:click'?: string;
    'x-bind:class'?: string;
    // 根據需要自由增加 Alpine 的屬性
  }
}