import Container, { ContainerProps } from '../components/Container/index.tsx';

export default async function ContainerTestPage() {
  const variants: ContainerProps['variant'][] = [
    'solid',
    'outline',
    'ghost',
    'dot',
    'dashed',
    'double',
    'glow',
    'gradient-right',
    'gradient-left',
    'gradient-up',
    'gradient-down',
    'gradient-middle',
    'gradient-diagonal',
    'gradient-center',
    'gradient-cone',
    'crystal',
    'diagonal-stripes',
    'minimalist',
  ];

  const colors: ContainerProps['color'][] = [
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ];

  const statusOptions: { hover: boolean; active: boolean; label: string }[] = [
    { hover: false, active: true, label: 'H=F A=T' },
    { hover: true, active: true, label: 'H=T A=T' },
    { hover: false, active: false, label: 'H=F A=F' },
    { hover: true, active: false, label: 'H=T A=F' },
  ];

  const sizes = [
    { width: '32px', height: '32px', label: '32px' },
    { width: '48px', height: '48px', label: '48px' },
    { width: '64px', height: '64px', label: '64px' },
    { width: '80px', height: '80px', label: '80px' },
    { width: '100px', height: '100px', label: '100px' },
    { width: '120px', height: '120px', label: '120px' },
    { width: 'full', height: 'auto', label: 'full' },
  ];

  const sizeContainers = await Promise.all(sizes.map(async ({ width, height, label }) => {
    const cells = await Promise.all(colors.map(async (color) => {
      const container = await Container({
        variant: 'solid',
        color,
        width,
        height,
        padding: 'sm',
        hover: false,
        active: true,
        children: (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.55rem',
            lineHeight: 1.1,
            textAlign: 'center'
          }}>
            {color.charAt(0).toUpperCase() + color.slice(1, 3)}
          </div>
        )
      });
      return container;
    }));

    return (
      <tr>
        <td class="p-2 font-semibold text-right whitespace-nowrap">
          {label}
        </td>
        {cells.map((cell, idx) => (
          <td key={idx} class="p-1">
            {cell}
          </td>
        ))}
      </tr>
    );
  }));

  const variantContainers = await Promise.all(variants.map(async (variant) => {
    const statusRows = await Promise.all(statusOptions.map(async ({ hover, active, label }) => {
      const colorCells = await Promise.all(colors.map(async (color) => {
        const container = await Container({
          variant,
          color,
          width: '64px',
          height: '64px',
          padding: 'sm',
          hover,
          active,
          children: (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              lineHeight: 1.1,
              textAlign: 'center'
            }}>
              {color.charAt(0).toUpperCase() + color.slice(1, 3)}
            </div>
          )
        });
        return container;
      }));

      return (
        <tr>
          <td class="p-2 font-semibold text-right whitespace-nowrap" style={{ minWidth: '70px' }}>
            {label}
          </td>
          {colorCells.map((cell, idx) => (
            <td key={idx} class="p-1">
              {cell}
            </td>
          ))}
        </tr>
      );
    }));

    return (
      <section class="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold mb-3 pb-2 border-b border-gray-300">
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </h2>
        <table class="border-collapse">
          <thead>
            <tr>
              <th class="p-2 text-right"></th>
              {colors.map((color) => (
                <th key={color} class="p-2 text-center text-xs font-semibold">
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statusRows}
          </tbody>
        </table>
      </section>
    );
  }));

  return (
    <div class="p-4 max-w-full mx-auto bg-gray-50">
      <h1 class="text-2xl font-bold mb-4 text-center">
        Container 完整測試矩陣
      </h1>

      <section class="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold mb-3 pb-2 border-b border-gray-300">
          Solid - 尺寸測試
        </h2>
        <table class="border-collapse">
          <thead>
            <tr>
              <th class="p-2 text-right"></th>
              {colors.map((color) => (
                <th key={color} class="p-2 text-center text-xs font-semibold">
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeContainers}
          </tbody>
        </table>
      </section>

      <div class="mb-4 p-3 bg-yellow-100 rounded text-sm">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span class="font-mono bg-gray-200 px-1">H=F A=T</span> = 無 hover + 原色</div>
          <div><span class="font-mono bg-gray-200 px-1">H=T A=T</span> = 有 hover + 原色</div>
          <div><span class="font-mono bg-gray-200 px-1">H=F A=F</span> = 無 hover + 灰階</div>
          <div><span class="font-mono bg-gray-200 px-1">H=T A=F</span> = 有 hover + 灰階</div>
        </div>
      </div>

      {variantContainers}
    </div>
  );
}