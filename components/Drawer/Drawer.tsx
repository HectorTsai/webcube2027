import type { DrawerProps } from "./index.tsx";
import Container from "../Container/index.tsx";

const defaultAnimateInMap: Record<string, string> = {
  left: "slide-in-from-left",
  right: "slide-in-from-right",
  top: "slide-in-from-top",
  bottom: "slide-in-from-bottom",
};

const defaultAnimateOutMap: Record<string, string> = {
  left: "slide-out-to-left",
  right: "slide-out-to-right",
  top: "slide-out-to-top",
  bottom: "slide-out-to-bottom",
};

export default function Drawer({
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
  width = "sm",
  padding = "lg",
  rounded = "none",
  shadow = "lg",
  className,
  ...restProps
}: DrawerProps) {
  const ref = `$store.${store}.${state}`;

  const inClass = animateIn || defaultAnimateInMap[position];
  const outClass = animateOut || defaultAnimateOutMap[position];

  const backdropClasses = [
    "fixed",
    "inset-0",
    "z-40",
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
    'x-transition:enter': `animate-in ${inClass}`,
    'x-transition:leave': `animate-out ${outClass}`,
    'x-on:click.stop': '',
  };

  const drawerClasses = [
    "fixed",
    positionClassesMap[position],
    "z-50",
    overflowClasses,
    className,
  ].filter(Boolean).join(" ");

  return (
    <>
      <div
        class={backdropClasses}
        {...backdropAlpine}
      />
      <Container
        variant={variant}
        color={color}
        width={isHorizontal ? width : "full"}
        padding={padding}
        rounded={rounded}
        shadow={shadow}
        direction="column"
        align="start"
        justify="start"
        gap="md"
        className={drawerClasses}
        {...drawerAlpine}
        {...restProps}
      >
        {children}
      </Container>
    </>
  );
}
