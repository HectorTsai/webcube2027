import type { OptionProps } from "./index.tsx";
import ListRow from "../List/ListRow.tsx";

export default function Option({
  value,
  disabled = false,
  divider = false,
  children,
  className,
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

  return (
    <ListRow
      data-option-value={value}
      className={optionClasses}
      x-on:click={disabled ? "" : `
        const parent = $el.closest('[data-select-store]');
        const store = parent?.getAttribute('data-select-store') || 'selects';
        const state = parent?.getAttribute('data-select-state') || 'selectOpen';
        const value = '${value}';
        const label = $el.textContent.trim();
        
        if (window.Alpine && Alpine.store) {
          if (!Alpine.store(store)) Alpine.store(store, {});
          Alpine.store(store)[state] = false;
          Alpine.store(store)[state + 'SelectedValue'] = value;
          Alpine.store(store)[state + 'SelectedLabel'] = label;
          $dispatch('select-change', { value: value });
        }
      `}
      {...restProps}
    >
      {children}
    </ListRow>
  );
}