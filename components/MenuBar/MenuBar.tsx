import type { MenuBarProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Drawer from "../Drawer/index.tsx";
import { List } from "../List/index.tsx";
import Button from "../Button.tsx";
import { processChildren } from "../index.ts";
import { Children } from "hono/jsx";

export default async function MenuBar({
  children,
  variant = "solid",
  color = "primary",
  width = "full",
  padding = "sm",
  sticky = false,
  responsive = false,
  drawerState = "menuDrawer",
  className,
  context,
  ...restProps
}: MenuBarProps) {
  const stickyClasses = sticky ? "fixed top-0 left-0 right-0 z-50" : "";

  const processedChildren = processChildren(children, { color, variant, context });
  const childArray = Children.toArray(processedChildren);

  let menuHead = null;
  let menuFoot = null;
  const menuItems: any[] = [];
  const drawerItems: any[] = [];

  for (const child of childArray) {
    const childType = (child as any).type;
    const childTypeName = typeof childType === 'function' ? childType.name : childType;
    const typeNameStr = typeof childTypeName === 'string' ? childTypeName : '';

    if (typeNameStr === 'Head' || typeNameStr.endsWith('Head')) {
      menuHead = child;
    } else if (typeNameStr === 'Foot' || typeNameStr.endsWith('Foot')) {
      menuFoot = child;
    } else if (typeNameStr === 'Item' || typeNameStr.endsWith('Item')) {
      menuItems.push(child);
      drawerItems.push(child);
    }
  }

  const menuBarContent = (
    <div class="hidden md:flex w-full items-center">
      {menuHead && <div class="flex items-center mr-4">{menuHead}</div>}
      <div class="flex items-center flex-1">
        {menuItems.length > 0 && menuItems}
      </div>
      {menuFoot && <div class="flex items-center ml-4">{menuFoot}</div>}
    </div>
  );

  const mobileContent = responsive ? (
    <div class="md:hidden flex items-center justify-between w-full">
      {menuHead && <div class="flex items-center">{menuHead}</div>}
      <div class="flex items-center gap-2">
        {menuFoot && <div class="flex items-center">{menuFoot}</div>}
        <Button
          variant={variant}
          size="xs"
          color={color}
          {...{ '@click': `$store.drawers.${drawerState} = true` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </Button>
      </div>
    </div>
  ) : null;

  const container = await Container({
    variant,
    color,
    width,
    padding,
    rounded: "none",
    shadow: "none",
    direction: "row",
    align: "center",
    justify: "between",
    gap: "md",
    className: `${stickyClasses} ${className || ''}`.trim(),
    ...restProps,
    children: (
      <>
        {menuBarContent}
        {mobileContent}
      </>
    )
  });

  const drawer = responsive && drawerItems.length > 0 ? await Drawer({
    state: drawerState,
    position: "right",
    color,
    variant,
    width: "sm",
    padding,
    className: "min-w-64",
    children: (
      <List divider>
        {drawerItems}
      </List>
    )
  }) : null;

  return (
    <>
      {container}
      {drawer}
    </>
  );
}