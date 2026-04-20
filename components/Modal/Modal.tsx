import type { ModalProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Modal({
  children,
  state = "modalOpen",
  store = "modals",
  closeOnBackdrop = true,
  closeOnEsc = true,
  animateIn,
  animateOut,
  variant = "solid",
  color = "primary",
  width = "480px",
  padding = "lg",
  rounded = "lg",
  shadow = "lg",
  className,
  skeleton,
  ...restProps
}: ModalProps) {
  const ref = `$store.${store}.${state}`;

  const inClass = animateIn || 
    (skeleton?.動畫 && skeleton.動畫['視窗.開']) ||
    "animate-in fade-in zoom-in";
  
  const outClass = animateOut ||
    (skeleton?.動畫 && skeleton.動畫['視窗.關']) ||
    "animate-out fade-out zoom-out";

  const backdropClasses = [
    "fixed",
    "inset-0",
    "z-40",
    "bg-gray-900/50",
    "flex",
    "items-center",
    "justify-center",
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

  const modalAlpine: Record<string, string> = {
    'x-show': ref,
    'x-transition:enter': animateIn,
    'x-transition:leave': animateOut,
    'x-on:click.stop': '',
  };

  const modalClasses = [
    "max-h-[85vh]",
    "overflow-y-auto",
    "overflow-x-hidden",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      class={backdropClasses}
      {...backdropAlpine}
      {...restProps}
    >
      <Container
        variant={variant}
        color={color}
        width={width}
        padding={padding}
        rounded={rounded}
        shadow={shadow}
        direction="column"
        align="center"
        justify="center"
        gap="md"
        className={modalClasses}
        {...modalAlpine}
      >
        {children}
      </Container>
    </div>
  );
}