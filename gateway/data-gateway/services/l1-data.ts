// L1 Data Service — bootstrap sqlite seed database
//
// L1 is a local sqlite database created from seed files at first startup.
// It contains bootstrap data (visitor role, visitor user) that must be
// available before L2 is set up.
//
// L1 is read-only after creation. To modify L1 data, update the seed files
// at database/seeds/L1/ and reinstall.
//
// This solves the bootstrap problem: auth-gateway can always query
// the visitor role/user from L1, even without L2 being set up yet.

import { createAdapter } from '@dui/database';
import type { DatabaseAdapter } from '@dui/database';
import { loadSeedsRecursive } from '../database/seed-loader.ts';
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

  // Check if already seeded (by looking for the visitor user)
  const existing = await l1Adapter
    .getById('使用者:使用者:訪客')
    .catch(() => null);

  if (!existing) {
    // First startup — seed L1 from seed files
    await l1Adapter.initialize('使用者');

    const seeds = await loadSeedsRecursive('L1');
    for (const item of seeds) {
      try {
        const { id, ...data } = item;
        await l1Adapter.create('使用者', id as string, data);
      } catch {
        // skip duplicates
      }
    }
    await info('L1', `Seeded from L1 seed files (${seeds.length} records)`);
  }

  await info('L1', `Ready (${l1Path})`);
}

export function getL1(): DatabaseAdapter | null {
  return l1Adapter;
}