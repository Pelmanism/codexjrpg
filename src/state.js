import { CODEX, ITEMS, PARTY, QUESTS, WORLD } from "./data.js";

const SAVE_KEY = "asterfall-echoes-save-v1";
const listeners = new Set();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialParty() {
  return PARTY.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    level: 1,
    xp: 0,
    maxHp: member.maxHp,
    maxAp: member.maxAp,
    hp: member.maxHp,
    ap: member.maxAp,
    attack: member.attack,
    magic: member.magic,
    defense: member.defense,
    speed: member.speed,
    element: member.element,
    abilities: [...member.abilities],
    limit: 0
  }));
}

export function createInitialState() {
  return {
    version: 1,
    world: {
      x: WORLD.start.x,
      y: WORLD.start.y,
      lastSafe: clone(WORLD.start),
      steps: 0,
      encounterGrace: 7,
      region: "village"
    },
    party: initialParty(),
    inventory: {
      salve: 5,
      ether: 2,
      star_bomb: 1
    },
    quests: {
      main: { stage: 0 },
      smith: { stage: 0 }
    },
    flags: {
      openedChests: [],
      harvestedNodes: [],
      codex: ["village"],
      talked: [],
      smithTuned: false,
      bossDefeated: false
    },
    journal: [
      "Lyra, Bram, and Sera reached Asterfall at dusk. The observatory bell rang without a hand."
    ],
    log: [
      "Arrow keys or WASD move. Space or E interacts. J opens the journal."
    ],
    battleSeed: Date.now()
  };
}

export let state = createInitialState();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify() {
  listeners.forEach((listener) => listener(state));
}

export function patchState(mutator) {
  mutator(state);
  notify();
}

export function resetState() {
  state = createInitialState();
  notify();
  return state;
}

export function replaceState(next) {
  state = next;
  notify();
  return state;
}

export function addLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 7);
}

export function addJournal(text) {
  if (!state.journal.includes(text)) {
    state.journal.unshift(text);
    state.journal = state.journal.slice(0, 20);
  }
}

export function unlockCodex(id) {
  if (CODEX[id] && !state.flags.codex.includes(id)) {
    state.flags.codex.push(id);
    addLog(`Codex updated: ${CODEX[id].title}.`);
  }
}

export function gainItem(itemId, amount = 1) {
  if (!ITEMS[itemId]) return;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + amount;
  addLog(`Gained ${amount} ${ITEMS[itemId].name}.`);
}

export function spendItem(itemId, amount = 1) {
  const current = state.inventory[itemId] || 0;
  if (current < amount) return false;
  state.inventory[itemId] = current - amount;
  return true;
}

export function harvestNode(node) {
  if (state.flags.harvestedNodes.includes(node.id)) return false;
  state.flags.harvestedNodes.push(node.id);
  addJournal(`${node.label} was tuned into Lyra's prism. The mirror road grows quieter.`);
  addLog(`${node.label} harvested.`);
  if (node.shard === "verdant") unlockAbility("lyra", "lumen_chorus");
  if (node.shard === "mire") unlockAbility("bram", "bulwark");
  advanceMainQuest();
  return true;
}

export function unlockAbility(memberId, abilityId) {
  const member = state.party.find((hero) => hero.id === memberId);
  if (member && !member.abilities.includes(abilityId)) {
    member.abilities.push(abilityId);
    addLog(`${member.name} learned a new art.`);
  }
}

export function advanceMainQuest() {
  const harvested = state.flags.harvestedNodes.length;
  if (state.quests.main.stage === 0 && state.flags.talked.includes("archivist")) {
    state.quests.main.stage = 1;
  }
  if (harvested >= 1 && state.quests.main.stage < 2) state.quests.main.stage = 2;
  if (harvested >= 2 && state.quests.main.stage < 3) state.quests.main.stage = 3;
  if (harvested >= 3 && state.quests.main.stage < 4) {
    state.quests.main.stage = 4;
    unlockCodex("regent");
  }
}

export function objectiveText() {
  const quest = QUESTS.main;
  return quest.stages[state.quests.main.stage] || quest.stages[0];
}

export function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  addLog("Game saved.");
  notify();
}

export function hasSave() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return replaceState(parsed);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function awardXp(totalXp) {
  const leveled = [];
  state.party.forEach((hero) => {
    hero.xp += totalXp;
    const needed = hero.level * 80;
    if (hero.xp >= needed) {
      hero.xp -= needed;
      hero.level += 1;
      hero.maxHp += 12;
      hero.maxAp += 4;
      hero.attack += 2;
      hero.magic += 2;
      hero.defense += 1;
      hero.speed += hero.level % 2 === 0 ? 1 : 0;
      hero.hp = hero.maxHp;
      hero.ap = hero.maxAp;
      leveled.push(hero.name);
    }
  });
  if (leveled.length) {
    addLog(`Level up: ${leveled.join(", ")}.`);
  }
}
