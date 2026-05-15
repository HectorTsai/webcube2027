import { Children, cloneElement } from 'hono/jsx';
import type { OptionPickerProps } from "./index.tsx";
import OptionItem from "./OptionItem.tsx";

export default async function OptionPicker({
  children,
  mode = 'single',
  name,
  variant = 'outline',
  color = 'primary',
  autoFill = true,
  gap = 'md',
  padding = 'md',
  rounded = 'md',
  className = '',
  context,
  ...restProps
}: OptionPickerProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-xs',
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
    xl: 'gap-xl'
  };

  const arrayChildren = Children.toArray(children as any);
  const optionContainers = await Promise.all(arrayChildren.map(async (child: any) => {
    const isOptionItem = child?.type === OptionItem;
    if (isOptionItem) {
      const props: Record<string, any> = {
        color: child.props.color ?? color,
        variant: child.props.variant ?? variant,
        mode: child.props.mode ?? mode,
        name: child.props.name ?? name,
        padding: child.props.padding ?? padding,
        rounded: child.props.rounded ?? rounded,
        autoFill: child.props.autoFill !== undefined ? child.props.autoFill : autoFill,
        checked: child.props.checked ?? false,
        className: child.props.className,
        context,
      };
      return await cloneElement(child, props);
    }
    return child;
  }));

  const optionValues: Array<{ value: string; checked: boolean }> = [];
  arrayChildren.forEach((child: any) => {
    if (child?.type === OptionItem) {
      optionValues.push({
        value: child.props?.value,
        checked: child.props?.checked ?? false
      });
    }
  });

  const initParts = optionValues.map(({ value, checked }) => {
    const stateName = name ? `${name}_${value}` : `option_${value}`;
    return `if($store.Container.${stateName}===undefined){$store.Container.${stateName}=${checked}}`;
  });
  const xDataValue = `(()=>{if(!Alpine.store('Container')){Alpine.store('Container',{})}${initParts.join('')}return {}})()`;

  return (
    <div 
      x-data={xDataValue}
      class={`flex flex-wrap ${gapClasses[gap]} ${className}`}
      {...restProps}
    >
      {optionContainers}
    </div>
  );
}