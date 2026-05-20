import type { MenuBarProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Drawer from "../Drawer/index.tsx";
import Button from "../Button.tsx";

export default async function MenuBar({
  children,
  logo,
  menuItems,
  footer,
  variant = "solid",
  color = "primary",
  width = "full",
  padding = "sm",
  sticky = false,
  responsive = false,
  drawerState = "menuOpen",
  className,
  context,
  ...restProps
}: MenuBarProps) {
  const stickyClasses = sticky ? "fixed top-0 left-0 right-0 z-50" : "";

  // 渲染 Container 组件
  const container = await Container({
    variant,
    color,
    width,
    padding,
    rounded:"none",
    shadow:"none",
    direction: "row",
    align: "center",
    justify: "space-between",
    gap: "md",
    className: `${stickyClasses} ${className || ''}`.trim(),
    ...restProps,
    children: (
      <>
        {/* 桌面端菜单 - 水平排列 */}
        <div class="hidden md:flex w-full items-center">
          {/* Logo 最左边 */}
          {logo && <div class="flex items-center mr-auto">{logo}</div>}
          
          {/* MenuItem 菜单 */}
          <div class="flex items-center">
            <ul class="flex m-0 p-0 gap-1">
              {menuItems ? menuItems : children}
            </ul>
          </div>
          
          {/* Footer 最右边 */}
          {footer && <div class="flex items-center ml-auto">{footer}</div>}
        </div>
        
        {/* 移动端 - 只显示 logo 和汉堡按钮 */}
        <div class="md:hidden flex items-center justify-between w-full">
          {logo ? logo : <div class="font-bold text-lg">Menu</div>}
          {await Button({
            variant,
            size: "xs",
            color,
            onClick: `$store.drawers.${drawerState} = true`,
            children: (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )
          })}
        </div>
      </>
    )
  });

  // 渲染 Drawer 组件
  const drawer = responsive ? await Drawer({
    state: drawerState,
    position: "left",
    color,
    variant,
    width: "sm",
    padding,
    className:"min-w-64",
    children: (
      <div class="flex flex-col h-full w-full">
        {/* Drawer 头部 */}
        <div class="flex justify-between items-center mb-8">
          {logo ? logo : <div class="font-bold text-lg">Menu</div>}
          {await Button({
            variant,
            color,
            size: "xs",
            rounded: "full",
            onClick: `$store.drawers.${drawerState} = false`,
            children: (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )
          })}
        </div>
        {/* Drawer 内容 - 垂直排列菜单 */}
        <ul class="flex flex-col space-y-2 flex-grow m-0 p-0">
          {menuItems ? menuItems : children}
        </ul>
        {/* Drawer 底部 - Footer */}
        {footer && (
          <div class="mt-auto pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    )
  }) : null;

  return (
    <>
      {container}
      {drawer}
    </>
  );
}
