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
const PROMOTED_OVERRIDES = {
  "45,10": { blocked: true, terrain: "ridge" },
  "45,11": { blocked: true, terrain: "ridge" },
  "45,12": { blocked: true, terrain: "ridge" },
  "46,12": { blocked: true, terrain: "ridge" },
  "46,11": { blocked: true, terrain: "ridge" },
  "33,12": { terrain: "road" },
  "34,12": { terrain: "road" },
  "35,12": { terrain: "road" },
  "36,12": { terrain: "road" },
  "37,12": { terrain: "road" },
  "38,12": { terrain: "road" },
  "39,12": { terrain: "road" },
  "40,12": { terrain: "road" },
  "41,12": { terrain: "road" },
  "42,12": { terrain: "road" },
  "42,11": { terrain: "road" },
  "41,11": { terrain: "road" },
  "39,11": { terrain: "road" },
  "40,11": { terrain: "road" },
  "37,11": { terrain: "road" },
  "36,11": { terrain: "road" },
  "35,11": { terrain: "road" },
  "34,11": { terrain: "road" },
  "33,11": { terrain: "road" },
  "32,11": { terrain: "road" },
  "31,11": { terrain: "road" },
  "30,11": { terrain: "road" },
  "38,11": { terrain: "road" },
  "29,11": { terrain: "road" },
  "28,11": { terrain: "road" },
  "27,11": { terrain: "road" },
  "26,11": { terrain: "road" },
  "26,12": { terrain: "road" },
  "25,12": { terrain: "road" },
  "25,11": { terrain: "road" },
  "28,12": { terrain: "road" },
  "29,12": { terrain: "road" },
  "27,12": { terrain: "road" },
  "25,13": { terrain: "road" },
  "25,14": { terrain: "road" },
  "25,15": { terrain: "road" },
  "25,16": { terrain: "road" },
  "25,17": { terrain: "road" },
  "25,18": { terrain: "road" },
  "25,19": { terrain: "road" },
  "25,20": { terrain: "road" },
  "24,20": { terrain: "road" },
  "23,20": { terrain: "road" },
  "22,20": { terrain: "road" },
  "21,20": { terrain: "road" }
};

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

function sameEntry(left, right) {
  return left?.terrain === right?.terrain && left?.blocked === right?.blocked;
}

function cleanTiles(tiles) {
  if (!tiles || typeof tiles !== "object") return {};
  return Object.fromEntries(
    Object.entries(tiles)
      .filter(([key]) => validKey(key))
      .map(([key, entry]) => [key, cleanEntry(entry)])
      .filter(([, entry]) => entry)
      .filter(([key, entry]) => !sameEntry(entry, PROMOTED_OVERRIDES[key]))
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
