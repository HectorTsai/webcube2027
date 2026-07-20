import type { OptionProps } from "./index.tsx";
import ListRow from "../List/ListRow.tsx";
import { processChildren } from "../index.ts";

export default function Option({
  value,
  disabled = false,
  divider = false,
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: OptionProps) {
  if (divider) {
    return (
      <li 
        class="list-none border-t border-base-50 border-solid my-1"
        {...restProps}
      />
    );
  }

  const optionClasses = [
    "px-3",
    "py-2",
    disabled
      ? "opacity-30 cursor-not-allowed pointer-events-none"
      : "cursor-pointer hover:bg-base-200 active:bg-base-300",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <ListRow
      color={color}
      data-option-value={value}
      className={optionClasses}
      x-on:click={disabled ? "" : `
        const parent = $el.closest('[data-select-state]');
        const state = parent?.getAttribute('data-select-state') || 'selectOpen';
        const value = '${value}';
        const label = $el.textContent.trim();

        if (window.Alpine && Alpine.store) {
          Alpine.store('popups')[state] = false;
          Alpine.store('popups')[state + 'SelectedValue'] = value;
          Alpine.store('popups')[state + 'SelectedLabel'] = label;
          $dispatch('select-change', { value: value });
        }
      `}
      {...restProps}
    >
      {processedChildren}
    </ListRow>
  );
}