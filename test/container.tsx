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

  const variantContainers = await Promise.all(variants.map(async (variant) => {
    const colorContainers = await Promise.all(colors.map(async (color) => {
      const container = await Container({
        variant,
        color,
        padding: 'md',
        children: `${color.charAt(0).toUpperCase() + color.slice(1)}`
      });
      return (
        <div class="flex flex-col gap-2 items-center">
          {container}
        </div>
      );
    }));

    return (
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">{variant.charAt(0).toUpperCase() + variant.slice(1)}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {colorContainers}
        </div>
      </section>
    );
  }));

  return (
    <div class="p-8 max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Container 測試</h1>
      {variantContainers}
    </div>
  );
}
