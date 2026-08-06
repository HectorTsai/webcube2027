import { createVersionHandler } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));

export const GET = createVersionHandler(ROOT);
