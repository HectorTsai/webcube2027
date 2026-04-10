const sizeMap: Record<string, { width: number; height: number; thumb: number }> = {
  xs: { width: 48, height: 24, thumb: 18 },
  sm: { width: 56, height: 28, thumb: 22 },
  md: { width: 64, height: 32, thumb: 26 },
  lg: { width: 74, height: 36, thumb: 30 },
  xl: { width: 96, height: 44, thumb: 36 },
};

export interface ToggleProps {
  name?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  size?: keyof typeof sizeMap;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
}

export default async function Toggle({
  size = 'md',
  color = 'primary',
  name,
  value,
  checked,
  defaultChecked,
  disabled,
  label,
}: ToggleProps) {
  const config = sizeMap[size] || sizeMap.md;
  const initial = typeof checked === 'boolean' ? checked : (defaultChecked ?? false);
  const onTrackClass = `bg-${color} border-${color}`;
  const offTrackClass = 'bg-gray-300 border-gray-300';
  const onBlockClass = `bg-${color}-content`;
  const offBlockClass = 'bg-gray-400';
  const translateX = config.width - config.thumb - 4;

  return (
    <label
      class={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      x-data={`{ on: ${initial}, trackOn: '${onTrackClass}', trackOff: '${offTrackClass}', blockOn: '${onBlockClass}', blockOff: '${offBlockClass}' }`}
    >
      {/* 隱藏元素確保 UnoCSS 能掃描到所有動態類名 */}
      <div class="hidden bg-primary border-primary bg-secondary border-secondary bg-accent border-accent bg-info border-info bg-success border-success bg-warning border-warning bg-error border-error bg-primary-content bg-secondary-content bg-accent-content bg-info-content bg-success-content bg-warning-content bg-error-content bg-gray-300 border-gray-300 bg-gray-400"></div>
      <input
        type="checkbox"
        class="sr-only"
        name={name}
        value={value}
        disabled={disabled}
        x-model="on"
      />

      <div
        class="relative rounded-full border transition duration-200 shadow-inner"
        style={`width: ${config.width}px; height: ${config.height}px;`}
        x-bind:class="on ? trackOn : trackOff"
      >
        <div
          class="absolute rounded-full shadow-lg border border-gray-300 transition-all duration-200"
          style={`width: ${config.thumb}px; height: ${config.thumb}px; top: calc(50% - ${config.thumb / 2}px); left: 4px;`}
          x-bind:class="on ? blockOn : blockOff"
          x-bind:style={`{ transform: on ? 'translateX(${translateX-4}px)' : 'translateX(0)' }`}
        />
      </div>

      {label && <span class="text-sm font-medium text-gray-900">{label}</span>}
    </label>
  );
}
