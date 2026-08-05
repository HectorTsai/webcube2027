import { handleCollection } from '../../../../utils/crud.ts';
export const GET = (c: any) => handleCollection(c, { layer: 'L1' });
