import type { DrawerProps } from "./index.tsx";
import Container from "../Container/index.tsx";

const defaultAnimateInMap: Record<string, string> = {
  left: "animate-in slide-in-from-left",
  right: "animate-in slide-in-from-right",
  top: "animate-in slide-in-from-top",
  bottom: "animate-in slide-in-from-bottom",
};

const defaultAnimateOutMap: Record<string, string> = {
  left: "animate-out slide-out-to-left",
  right: "animate-out slide-out-to-right",
  top: "animate-out slide-out-to-top",
  bottom: "animate-out slide-out-to-bottom",
};

export default async function Drawer({
  children,
  state = "drawerOpen",
  store = "drawers",
  position = "left",
  closeOnBackdrop = true,
  closeOnEsc = true,
  animateIn,
  animateOut,
  variant = "solid",
  color = "primary",
  width = "320px",
  padding = "lg",
  rounded = "none",
  shadow = "lg",
  className,
  skeleton,
  ...restProps
}: DrawerProps) {
  const ref = `$store.${store}.${state}`;

  // 優先使用傳入的動畫，其次使用骨架設定，最後使用預設值
  const positionMap: Record<string, string> = {
    left: '左',
    right: '右',
    top: '上',
    bottom: '下'
  };
  
  const inClass = animateIn || 
    (skeleton?.動畫 && skeleton.動畫[`抽屜.${positionMap[position]}.開`]) ||
    defaultAnimateInMap[position];
  
  const outClass = animateOut ||
    (skeleton?.動畫 && skeleton.動畫[`抽屜.${positionMap[position]}.關`]) ||
    defaultAnimateOutMap[position];

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
    'x-transition:enter': `${inClass}`,
    'x-transition:leave': `${outClass}`,
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

  // 渲染 Container 组件作为 Drawer 的内容
  const container = await Container({
    variant,
    color,
    width: isHorizontal ? width : "full",
    padding,
    rounded,
    shadow,
    direction: "column",
    align: "start",
    justify: "start",
    gap: "md",
    className: drawerClasses,
    ...drawerAlpine,
    ...restProps,
    children
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
