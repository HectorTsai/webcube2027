import { handleCreate } from '../../../../../utils/crud.ts';
export const POST = (c: any) => handleCreate(c, { layer: 'L1' });
