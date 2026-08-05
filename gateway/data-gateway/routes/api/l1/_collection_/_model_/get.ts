import { handleList } from '../../../../../utils/crud.ts';
export const GET = (c: any) => handleList(c, { layer: 'L1' });
