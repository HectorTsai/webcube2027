import type { OptionItemProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default async function OptionItem({
  value,
  children,
  disabled = false,
  variant = 'solid',
  color = 'primary',
  padding = 'md',
  rounded = 'md',
  autoFill = true,
  name,
  mode = 'single',
  checked = false
}: OptionItemProps) {
  const inputType = mode === 'single' ? 'radio' : 'checkbox';
  const inputName = name || `option-${inputType}`;
  const stateName = name ? `${name}_${value}` : `option_${value}`;

  // 單選模式：設定所有同組 radio 的 checked 屬性；多選模式：切換 checkbox 並更新 store
  const clickAction = mode === 'single' && name
    ? `document.querySelectorAll('input[name="${inputName}"]').forEach(el=>{el.checked=(el.value==='${value}')});$store.Container.${stateName}=true;Object.keys($store.Container).filter(k=>k.startsWith('${name}_')&&k!=='${stateName}').forEach(k=>$store.Container[k]=false);$dispatch('option-change')`
    : `$el.querySelector('input').checked=!$el.querySelector('input').checked;$store.Container.${stateName}=$el.querySelector('input').checked;$dispatch('option-change')`;

  return (
    <div
      class={[
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        autoFill ? 'flex-1' : '',
        'w-full',
        'h-full'
      ].filter(Boolean).join(' ')}
      data-value={value}
      data-disabled={disabled}
      x-on:click={clickAction}
    >
      {/* 隱藏的 radio/checkbox input */}
      <input
        type={inputType}
        name={inputName}
        value={value}
        checked={checked}
        disabled={disabled}
        class="sr-only"
      />
      
      {/* 使用 Container 渲染選項外觀 */}
      <Container variant={variant}
        color={color}
        active={checked}
        activeStateName={stateName}
        hover
        padding={padding}
        rounded={rounded}
        align="center"
        justify="center"
        direction="column"
        className="w-full h-full"
      >
        {children}
      </Container>
    </div>
  );
}