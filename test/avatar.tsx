import Avatar, { AvatarProps } from '../components/Avatar/index.tsx';

export default async function AvatarTestPage() {
  const testSvgs = {
    user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>',
    star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  };

  const variants: AvatarProps['variant'][] = [
    'solid',
    'outline',
    'ghost',
    'dot',
    'dashed',
    'double',
    'glow',
    'crystal',
    'diagonal-stripes',
    'gradient-right',
    'gradient-left',
    'gradient-up',
    'gradient-down',
    'gradient-middle',
    'gradient-diagonal',
    'gradient-center',
    'gradient-cone',
    'minimalist'
  ];

  const colors: AvatarProps['color'][] = [
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ];

  const sizes: AvatarProps['size'][] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl'
  ];

  const variantAvatars = await Promise.all(variants.map(async (variant) => {
    const avatars = await Promise.all(colors.map((color) => {
      return Avatar({ variant, color, svg: testSvgs.user });
    }));
    return { variant, avatars };
  }));

  const svgAvatars = await Promise.all([
    Avatar({ svg: testSvgs.star, size: "md", variant: "solid", color: "primary" }),
    Avatar({ svg: testSvgs.heart, size: "md", variant: "solid", color: "secondary" }),
    Avatar({ svg: testSvgs.check, size: "md", variant: "solid", color: "accent" }),
    Avatar({ svg: testSvgs.user, size: "md", variant: "solid", color: "info" }),
    Avatar({ svg: testSvgs.user, size: "md", variant: "solid", color: "success" }),
    Avatar({ svg: testSvgs.user, size: "md", variant: "solid", color: "warning" }),
    Avatar({ svg: testSvgs.user, size: "md", variant: "solid", color: "error" }),
  ]);

  const imageAvatars = await Promise.all([
    Avatar({ image: "影像:影像:hono", size: "md", variant: "solid", color: "primary" }),
    Avatar({ image: "影像:影像:surrealDB", size: "md", variant: "solid", color: "secondary" }),
    Avatar({ image: "影像:影像:deno2", size: "md", variant: "solid", color: "accent" }),
    Avatar({ image: "影像:影像:hono", size: "md", variant: "solid", color: "info" }),
    Avatar({ image: "影像:影像:surrealDB", size: "md", variant: "solid", color: "success" }),
    Avatar({ image: "影像:影像:deno2", size: "md", variant: "solid", color: "warning" }),
    Avatar({ image: "影像:影像:hono", size: "md", variant: "solid", color: "error" }),
  ]);

  const sizeAvatars = await Promise.all(sizes.map(size =>
    Avatar({ svg: testSvgs.user, variant: "solid", size, color: "primary" })
  ));

  return (
    <div class="p-4 max-w-full mx-auto bg-gray-50">
      <h1 class="text-2xl font-bold mb-6 text-center">Avatar 測試</h1>

      <section class="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold mb-4">SVG / Image 來源</h2>
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
            <tr>
              <td class="p-2 font-semibold text-right">SVG</td>
              {svgAvatars.map((avatar, i) => (
                <td key={i} class="p-2 text-center">
                  <div class="flex justify-center">{avatar}</div>
                </td>
              ))}
            </tr>
            <tr>
              <td class="p-2 font-semibold text-right">Image</td>
              {imageAvatars.map((avatar, i) => (
                <td key={i} class="p-2 text-center">
                  <div class="flex justify-center">{avatar}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section class="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold mb-4">尺寸變化</h2>
        <table class="border-collapse">
          <thead>
            <tr>
              <th class="p-2 text-right"></th>
              {sizes.map((size) => (
                <th key={size} class="p-2 text-center text-xs font-semibold">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2 font-semibold text-right">Solid</td>
              {sizeAvatars.map((avatar, i) => (
                <td key={i} class="p-2 text-center">
                  <div class="flex justify-center">{avatar}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {variantAvatars.map(({ variant, avatars }) => (
        <section class="mb-6 p-4 bg-white rounded-lg shadow">
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
              <tr>
                <td class="p-2 font-semibold text-right"></td>
                {avatars.map((avatar, i) => (
                  <td key={i} class="p-2 text-center">
                    <div class="flex justify-center">{avatar}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}