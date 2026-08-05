import { handleBatchPatch } from '../../../../../utils/crud.ts';
export const PATCH = (c: any) => handleBatchPatch(c, { layer: 'L1' });
