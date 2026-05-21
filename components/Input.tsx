import { ComponentProps } from "./classes.ts";
import Container from "./Container/index.tsx";
import { processChildren } from "./index.ts";

export interface InputProps extends ComponentProps {
  /** 前端标签 */
  frontLabel?: string;
  /** 后端标签 */
  endLabel?: string;
  /** 浮动标签 */
  floatLabel?: string;
  /** 任何额外属性 */
  [key: string]: any;
}

export default function Input({
  className,
  variant,
  color="primary",
  frontLabel,
  endLabel,
  floatLabel,
  type = "text",
  placeholder,
  value,
  context,
  children,
  ...restProps
}: InputProps) {
  const inputAlpine: Record<string, string> = {
    '@focus': 'focused = true',
    '@blur': 'focused = false',
    '@input': "hasValue = $event.target.value !== ''"
  };

  if (floatLabel) {
    const labelAlpine: Record<string, string> = {
      ':class': `{ 'scale-75 -translate-y-4 -translate-x-1 text-base-content bg-base px-1': focused || hasValue }`
    };

    const processedChildren = processChildren(children, { color, variant, context });

    return (
      <Container
        variant={variant}
        color={color}
        padding="none"
        rounded="sm"
        className={className}
        x-data={`{ focused: false, hasValue: ${value ? 'true' : 'false'} }`}
        context={context}
      >
        <div class="flex items-center w-full">
          {frontLabel && (
            <div class={`px-3 py-2 text-sm text-${color}-content border-r border-gray-300`}>
              {frontLabel}
            </div>
          )}
          <div class="relative flex-1">
            <input
              type={type}
              placeholder=" "
              value={value}
              class="w-full px-3 py-2 border-0 text-sm text-current outline-none bg-transparent"
              {...inputAlpine}
              {...restProps}
            />
            <label
              class="absolute top-2 left-3 text-sm text-base-70 transition-all duration-200 pointer-events-none"
              {...labelAlpine}
            >
              {floatLabel}
            </label>
          </div>
          {endLabel && (
            <div class={`px-3 py-2 text-sm text-${color}-content border-l border-gray-300`}>
              {endLabel}
            </div>
          )}
          {processedChildren}
        </div>
      </Container>
    );
  }

  if (placeholder) {
    const labelAlpine: Record<string, string> = {
      'x-show': '!hasValue'
    };

    const processedChildren = processChildren(children, { color, variant, context });

    return (
      <Container
        variant={variant}
        color={color}
        padding="none"
        rounded="sm"
        className={className}
        x-data={`{ focused: false, hasValue: ${value ? 'true' : 'false'} }`}
        context={context}
      >
        <div class="flex items-center w-full">
          {frontLabel && (
            <div class={`px-3 py-2 text-sm border-r border-gray-300`}>
              {frontLabel}
            </div>
          )}
          <div class="relative flex-1">
            <input
              type={type}
              placeholder=" "
              value={value}
              class="w-full px-3 py-2 border-0 text-sm text-current outline-none bg-transparent"
              {...inputAlpine}
              {...restProps}
            />
            <label
              class="absolute top-2 left-3 text-sm text-base-50 pointer-events-none"
              {...labelAlpine}
            >
              {placeholder}
            </label>
          </div>
          {endLabel && (
            <div class={`px-3 py-2 text-sm text-${color}-content border-l border-gray-300`}>
              {endLabel}
            </div>
          )}
          {processedChildren}
        </div>
      </Container>
    );
  }

  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <Container
      variant={variant}
      color={color}
      padding="none"
      rounded="sm"
      className={className}
      context={context}
    >
      <div class="flex items-center w-full">
        {frontLabel && (
          <div class={`px-3 py-2 text-sm text-${color}-content border-r border-gray-300`}>
            {frontLabel}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          class="flex-1 px-3 py-2 border-0 text-sm text-current outline-none bg-transparent"
          {...restProps}
        />
        {endLabel && (
          <div class={`px-3 py-2 text-sm text-${color}-content border-l border-gray-300`}>
            {endLabel}
          </div>
        )}
        {processedChildren}
      </div>
    </Container>
  );
}