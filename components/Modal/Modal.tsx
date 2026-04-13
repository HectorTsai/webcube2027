import type { ModalProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Modal({
  children,
  state = "modalOpen",
  store = "modals",
  closeOnBackdrop = true,
  closeOnEsc = true,
  animateIn = "fade-in zoom-in",
  animateOut = "fade-out zoom-out",
  variant = "solid",
  color = "primary",
  width = "md",
  padding = "lg",
  rounded = "lg",
  shadow = "lg",
  className,
  ...restProps
}: ModalProps) {
  const ref = `$store.${store}.${state}`;

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
    'x-transition:enter': `animate-in ${animateIn}`,
    'x-transition:leave': `animate-out ${animateOut}`,
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
