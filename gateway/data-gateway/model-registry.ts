// Model Registry — allows package consumers to register custom Model classes
//
// Usage:
//   import { registerModel } from "@dui/database";
//   import MyModel from "./MyModel.ts";
//   registerModel("MyModel", MyModel);

import type { BaseModel } from "./base-model.ts";

/** Model constructor type — accepts record data and optional deletable flag */
type ModelConstructor = new (
  data: Record<string, unknown>,
  deletable?: boolean,
) => BaseModel;

const registry = new Map<string, ModelConstructor>();

/**
 * Register a Model class for use by the data pool and seed loader.
 * The model name is used as the table/collection identifier.
 */
export function registerModel(name: string, modelClass: ModelConstructor): void {
  registry.set(name, modelClass);
}

/**
 * Retrieve a registered Model class by name.
 * Returns `undefined` if the model has not been registered.
 */
export function getModel(name: string): ModelConstructor | undefined {
  return registry.get(name);
}

/** Get the names of all registered models. */
export function listModels(): string[] {
  return Array.from(registry.keys());
}

/**
 * Convert raw record data into a Model instance via the registry.
 * Returns `null` if the model is not registered or instantiation fails.
 */
export function toModelInstance<T extends BaseModel>(
  modelName: string,
  data: Record<string, unknown>,
): T | null {
  const ModelClass = registry.get(modelName);
  if (!ModelClass) return null;

  try {
    const deletable = (data.deletable as boolean) ?? (data.可刪除 as boolean) ?? true;
    const instance = new ModelClass(data, deletable) as T;
    // 確保 ID 遵循 CollectionName:ModelName:nanoid 規則
    // ModelName 一律使用註冊名稱，而非 constructor.name
    instance.setIdentity(modelName, modelName);
    return instance;
  } catch {
    return null;
  }
}
