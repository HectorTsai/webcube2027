// Template.tsx — 範本元件（宣告載體）
// <Template name="xxx">...</Template> 定義可複用的範本
// <Slot template="xxx" /> 或 <Slot name="xxx" template="xxx" /> 引用該範本
//
// 所有收集／解構邏輯位於 方塊.tsx 的「區域範疇圖紙解構引擎」。
// Template 設為 async 阻止 Hono streaming SSR 預先渲染內部 native 子節點。

import type { HtmlEscapedString } from "hono/utils/html";

export default async function Template(_props: { name: string; children?: unknown }): Promise<HtmlEscapedString> {
  return null as unknown as HtmlEscapedString;
}
