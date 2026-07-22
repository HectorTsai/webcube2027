// @dui/kv — Lightweight persistent key-value store (L1)
//
// Provides a simple JSON-file-backed KV store for system configs.
// Used by @dui/database as L1, and by any gateway that needs
// local persistent settings without pulling in L2/L3 database deps.
//
// Architecture:
//   L1 — Config KV store (JSON file) for system settings + encrypted L2 connection info
//   L2 — Central database (SYSTEM) — provided by @dui/database
//   L3 — Per-site database (HOST) — provided by @dui/database

export { L1Store } from './l1-store.ts';