// Seed loader — load initial data from seeds/ directory
// Usage: after registering a Model, call loadSeeds("ModelName") to load corresponding JSON seed data
// Seeds path: configured via SEEDS_PATH env var, defaults to "./seeds/" (relative to project root)
import type { BaseModel } from './base-model.ts';
import { getModel } from './model-registry.ts';
import SecretString from './secretstring.ts';

/** Get seeds base path from env var or default */
function getSeedsBasePath(): string {
  return Deno.env.get('SEEDS_PATH') || './seeds';
}

/** Load a single seed file — returns parsed records */
async function loadSingleSeed(filePath: string): Promise<Record<string, unknown>[]> {
  try {
    const text = await Deno.readTextFile(filePath);
    const raw = JSON.parse(text) as Record<string, unknown>[];
    return Array.isArray(raw) ? raw : [raw];
  } catch (_err) {
    return [];
  }
}

/** Load seed directory — recursively read all JSON files in the directory */
async function loadSeedDirectory(
  dirPath: string,
  allData: Record<string, unknown>[]
): Promise<void> {
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile && entry.name.endsWith('.json')) {
        const fileData = await loadSingleSeed(`${dirPath}/${entry.name}`);
        allData.push(...fileData);
      } else if (entry.isDirectory) {
        await loadSeedDirectory(`${dirPath}/${entry.name}`, allData);
      }
    }
  } catch {
    // directory doesn't exist or is inaccessible
  }
}

/**
 * Load seed data for a specific model from the seeds/ directory.
 *
 * Looks for:
 * 1. A single file: `seeds/<ModelName>.json`
 * 2. Individual files: `seeds/<ModelName>/*.json`
 *
 * The seeds base path can be configured via the `SEEDS_PATH` environment variable
 * (defaults to `./seeds` relative to the project root).
 *
 * @param model - The registered model name to load seeds for.
 * @returns An array of model instances, or `null` if no seed data is found.
 */
export async function loadSeeds<T extends BaseModel>(model: string): Promise<T[] | null> {
  try {
    const seedsBase = getSeedsBasePath();
    const allData: Record<string, unknown>[] = [];

    // 1. Check single file: seeds/<ModelName>.json
    const singleFilePath = `${seedsBase}/${model}.json`;
    const singleFileData = await loadSingleSeed(singleFilePath);
    allData.push(...singleFileData);

    // 2. Check directory: seeds/<ModelName>/*.json
    const dirPath = `${seedsBase}/${model}`;
    await loadSeedDirectory(dirPath, allData);

    if (allData.length === 0) return null;

    // Get Model class from Registry and instantiate
    const Model = getModel(model);
    if (!Model) {
      console.error(`[loadSeeds] Model not registered: ${model}, call registerModel() first`);
      return null;
    }

    const result = allData.map((item) => new Model(item));

    // Trigger encryption for all SecretString fields
    for (const instance of result) {
      for (const value of Object.values(instance as unknown as Record<string, unknown>)) {
        if (value instanceof SecretString) {
          await value.process();
        }
      }
    }

    return result as T[];
  } catch (err) {
    console.error(`Load seeds failed: ${model}`, err);
    return null;
  }
}
