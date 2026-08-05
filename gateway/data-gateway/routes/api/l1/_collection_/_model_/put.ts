import { handleBatchUpdate } from '../../../../../utils/crud.ts';
export const PUT = (c: any) => handleBatchUpdate(c, { layer: 'L1' });
