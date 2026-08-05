import { handleBatchDelete } from '../../../../../utils/crud.ts';
export const DELETE = (c: any) => handleBatchDelete(c, { layer: 'L1' });
