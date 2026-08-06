import { handleLevelBatchDelete } from '../../../utils/crud.ts';
export const DELETE = (c: any) => handleLevelBatchDelete(c, { layer: 'L1' });