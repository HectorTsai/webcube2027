/**
 * JSX 固有元素类型：供项目内 TSX 类型检查使用。
 * 与 @dreamer/view 的 jsx.d.ts 一致，配合 deno.json compilerOptions.types 使用。
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tag: string]: Record<string, unknown>;
    }
  }
}

export {};
