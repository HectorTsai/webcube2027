import { handleLevelBatchUpdate } from '../../../utils/crud.ts';
export const PUT = (c: any) => handleLevelBatchUpdate(c, { layer: 'L1' });