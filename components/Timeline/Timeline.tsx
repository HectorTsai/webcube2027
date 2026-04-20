import type { TimelineProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Icon from "../Icon.tsx";

export default async function Timeline({
  children,
  vertical = false,
  className,
  color = "primary",
  variant = "solid",
}: TimelineProps) {
  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  if (vertical) {
    const items = await Promise.all(childArray.map(async (child, index) => {
      const childProps = (child as any).props || {};
      return child;
    }));

    return (
      <ul class={`flex flex-col list-none p-0 m-0 ${className || ""}`}>
        {items}
      </ul>
    );
  }

  const items = await Promise.all(childArray.map(async (child, index) => {
    const childProps = (child as any).props || {};
    return child;
  }));

  return (
    <ul class={`flex flex-row list-none p-0 m-0 ${className || ""}`}>
      {items}
    </ul>
  );
}