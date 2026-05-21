import type { DrawerProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import { processChildren } from "../index.ts";

export default async function Drawer({
  children,
  state = "drawerOpen",
  position = "left",
  closeOnBackdrop = true,
  closeOnEsc = true,
  variant = "solid",
  color = "primary",
  width = "320px",
  padding = "lg",
  className,
  context,
  ...restProps
}: DrawerProps) {
  const ref = `$store.drawers.${state}`;

  const backdropClasses = [
    "fixed",
    "inset-0",
    "z-50",
    "bg-gray-900/50",
  ].join(" ");

  const backdropAlpine: Record<string, string> = {
    'x-show': ref,
    'x-transition:enter': 'animate-in fade-in',
    'x-transition:leave': 'animate-out fade-out',
  };

  if (closeOnBackdrop) {
    backdropAlpine['x-on:click'] = `${ref} = false`;
  }

  if (closeOnEsc) {
    backdropAlpine['x-on:keydown.escape.window'] = `${ref} = false`;
  }

  const isHorizontal = position === "left" || position === "right";

  const positionClassesMap: Record<string, string> = {
    left: "left-0 inset-y-0",
    right: "right-0 inset-y-0",
    top: "top-0 inset-x-0",
    bottom: "bottom-0 inset-x-0",
  };

  const overflowClasses = isHorizontal
    ? "max-h-screen overflow-y-auto overflow-x-hidden"
    : "max-h-[85vh] overflow-y-auto overflow-x-hidden";

  const drawerAlpine: Record<string, string> = {
    'x-show': ref,
    'x-transition:enter': `drawer-${position}-enter`,
    'x-transition:leave': `drawer-${position}-leave`,
    'x-on:click.stop': '',
  };

  const drawerClasses = [
    "fixed",
    positionClassesMap[position],
    "z-51",
    "!m-0",
    overflowClasses,
    className,
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  // 渲染 Container 组件作为 Drawer 的内容
  const container = await Container({
    variant,
    color,
    width: isHorizontal ? width : "full",
    padding,
    rounded:"lg",
    shadow:"lg",
    direction: "column",
    align: "start",
    justify: "start",
    gap: "md",
    className: drawerClasses,
    context,
    ...drawerAlpine,
    ...restProps,
    children: processedChildren
  });

  return (
    <>
      <div
        class={backdropClasses}
        {...backdropAlpine}
      />
      {container}
    </>
  );
}
