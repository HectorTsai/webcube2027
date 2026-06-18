// Slot.tsx — 命名插槽元件
// 在 <Cube> 內使用 <Slot name="xxx">...</Slot> 指定具名 slot 內容
// 或 <Slot template="xxx" /> 引用 Template 樣板（由方塊.tsx 解構引擎處理）
// 本身不渲染，由 Cube 掃描並注入到對應的 definition.slots
export default function Slot(_props: { name?: string; template?: string; children?: unknown }) {
  return null;
}
