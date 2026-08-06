import { handleLevelBatchPatch } from '../../../utils/crud.ts';
export const PATCH = (c: any) => handleLevelBatchPatch(c, { layer: 'L1' });