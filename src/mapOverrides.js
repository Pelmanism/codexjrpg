const STORAGE_KEY = "asterfall-map-overrides-v1";

export const TERRAIN_TOOLS = [
  { id: "field", label: "Field", blocked: false, encounter: 0.05 },
  { id: "road", label: "Road", blocked: false, encounter: 0.03 },
  { id: "village", label: "Village", blocked: false, encounter: 0 },
  { id: "forest", label: "Forest", blocked: false, encounter: 0.13 },
  { id: "mire", label: "Mire", blocked: false, encounter: 0.15 },
  { id: "ruins", label: "Ruins", blocked: false, encounter: 0.16 },
  { id: "scar", label: "Scar", blocked: false, encounter: 0.09 },
  { id: "sanctuary", label: "Dawn", blocked: false, encounter: 0 },
  { id: "ridge", label: "Ridge", blocked: true, encounter: 0 }
];

const TERRAIN_BY_ID = Object.fromEntries(TERRAIN_TOOLS.map((tool) => [tool.id, tool]));

let overrides = loadOverrides();

function storage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function keyFor(x, y) {
  return `${x},${y}`;
}

function validKey(key) {
  return /^\d+,\d+$/.test(key);
}

function cleanEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const clean = {};
  if (TERRAIN_BY_ID[entry.terrain]) clean.terrain = entry.terrain;
  if (typeof entry.blocked === "boolean") clean.blocked = entry.blocked;
  return Object.keys(clean).length ? clean : null;
}

function cleanTiles(tiles) {
  if (!tiles || typeof tiles !== "object") return {};
  return Object.fromEntries(
    Object.entries(tiles)
      .filter(([key]) => validKey(key))
      .map(([key, entry]) => [key, cleanEntry(entry)])
      .filter(([, entry]) => entry)
  );
}

function loadOverrides() {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return cleanTiles(parsed.tiles || parsed);
  } catch {
    return {};
  }
}

function saveOverrides() {
  const store = storage();
  if (!store) return;
  store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tiles: overrides }));
}

export function terrainTool(id) {
  return TERRAIN_BY_ID[id] || TERRAIN_BY_ID.field;
}

export function getMapOverride(x, y) {
  return overrides[keyFor(x, y)] || null;
}

export function getMapOverrides() {
  return JSON.parse(JSON.stringify(overrides));
}

export function setMapOverride(x, y, patch) {
  const key = keyFor(x, y);
  const next = { ...(overrides[key] || {}) };
  if (Object.prototype.hasOwnProperty.call(patch, "terrain")) {
    if (TERRAIN_BY_ID[patch.terrain]) next.terrain = patch.terrain;
    else delete next.terrain;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "blocked")) {
    if (typeof patch.blocked === "boolean") next.blocked = patch.blocked;
    else delete next.blocked;
  }
  if (Object.keys(next).length) overrides[key] = next;
  else delete overrides[key];
  saveOverrides();
}

export function clearMapOverride(x, y) {
  delete overrides[keyFor(x, y)];
  saveOverrides();
}

export function resetMapOverrides() {
  overrides = {};
  saveOverrides();
}

export function exportMapOverrides() {
  return JSON.stringify({ version: 1, tiles: overrides }, null, 2);
}

export function importMapOverrides(text) {
  const parsed = JSON.parse(text);
  overrides = cleanTiles(parsed.tiles || parsed);
  saveOverrides();
  return Object.keys(overrides).length;
}

export function applyMapOverride(x, y, terrain) {
  const override = getMapOverride(x, y);
  if (!override) return terrain;

  let next = { ...terrain };
  if (override.terrain) {
    const tool = terrainTool(override.terrain);
    next = {
      id: tool.id,
      label: tool.label,
      blocked: tool.blocked,
      encounter: tool.encounter
    };
  }
  if (typeof override.blocked === "boolean") {
    next.blocked = override.blocked;
  }
  if (next.blocked) next.encounter = 0;
  return next;
}
