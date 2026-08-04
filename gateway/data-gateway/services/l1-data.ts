// L1 Data Service — local sqlite database for bootstrap records
//
// L1 is a local sqlite database created at first startup.
// Seed records (visitor role, visitor user) are owned by auth-gateway;
// auth-gateway writes them through the L1 CRUD API (POST /api/l1/:collection/:model)
// during setup.
//
// L1 is read-only after creation for direct operations.
// All modifications should go through CRUD APIs.

import { createAdapter } from '@dui/database';
import type { DatabaseAdapter } from '@dui/database';
import { info } from '@dui/util';

let l1Adapter: DatabaseAdapter | null = null;

export async function initL1(dataDir: string): Promise<void> {
  const l1Path = `${dataDir}/l1.db`;

  l1Adapter = await createAdapter('sqlite', {
    type: 'sqlite',
    filePath: l1Path,
    enabled: true,
  });

  if (!l1Adapter) {
    throw new Error(`Failed to create L1 adapter at ${l1Path}`);
  }

  // Initialize collection (idempotent)
  await l1Adapter.initialize('使用者');

  await info('L1', `Ready (${l1Path})`);
}

export function getL1(): DatabaseAdapter | null {
  return l1Adapter;
}