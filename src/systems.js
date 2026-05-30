import {
  ABILITIES,
  ENCOUNTERS,
  ENEMIES,
  ENEMY_SKILLS,
  ITEMS,
  QUESTS,
  TILE_SIZE,
  WORLD
} from "./data.js";
import {
  addJournal,
  addLog,
  advanceMainQuest,
  awardXp,
  gainItem,
  harvestNode,
  patchState,
  spendItem,
  state,
  unlockCodex
} from "./state.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function chance(probability) {
  return Math.random() < probability;
}

export function gridToWorld(x, y) {
  return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
}

function inRect(x, y, rect) {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

export function terrainAt(x, y) {
  if (x < 0 || y < 0 || x >= WORLD.width || y >= WORLD.height) {
    return { id: "void", label: "Void", blocked: true, encounter: 0 };
  }

  if ((x >= 3 && x <= 14 && y >= 21 && y <= 26) || (x >= 6 && x <= 12 && y >= 18 && y <= 22)) {
    return { id: "village", label: "Asterfall Village", blocked: false, encounter: 0 };
  }

  if (WORLD.blockedRects.some((rect) => inRect(x, y, rect))) {
    return { id: "ridge", label: "Ridge", blocked: true, encounter: 0 };
  }

  if (x >= 12 && x <= 20 && y >= 10 && y <= 18) {
    return { id: "forest", label: "Glasswood", blocked: false, encounter: 0.13 };
  }

  if (x >= 21 && x <= 31 && y >= 13 && y <= 23) {
    return { id: "mire", label: "Sunken Road", blocked: false, encounter: 0.15 };
  }

  if (x >= 33 && x <= 42 && y >= 6 && y <= 16) {
    return { id: "ruins", label: "Observatory Ruin", blocked: false, encounter: 0.16 };
  }

  if ((y === 20 && x >= 8 && x <= 29) || (x === 30 && y >= 12 && y <= 20) || (y === 12 && x >= 30 && x <= 41)) {
    return { id: "road", label: "Old Mirror Road", blocked: false, encounter: 0.03 };
  }

  if (x > 33 && y > 19) {
    return { id: "scar", label: "Glass Scar", blocked: false, encounter: 0.09 };
  }

  return { id: "field", label: "Windfield", blocked: false, encounter: 0.05 };
}

export function regionForTile(x, y) {
  const terrain = terrainAt(x, y).id;
  if (terrain === "forest") return "forest";
  if (terrain === "mire") return "mire";
  if (terrain === "ruins" || terrain === "scar") return "ruins";
  if (terrain === "village") return "village";
  return "field";
}

export function isBlocked(x, y, currentState = state) {
  const terrain = terrainAt(x, y);
  if (terrain.blocked) return true;

  if (WORLD.npcs.some((candidate) => candidate.x === x && candidate.y === y)) return true;
  if (WORLD.chests.some((candidate) => candidate.x === x && candidate.y === y && !currentState.flags.openedChests.includes(candidate.id))) return true;
  if (WORLD.nodes.some((candidate) => candidate.x === x && candidate.y === y && !currentState.flags.harvestedNodes.includes(candidate.id))) return true;

  const gate = WORLD.gates.find((candidate) => candidate.x === x && candidate.y === y);
  if (gate) return true;

  return false;
}

export function interactableAt(x, y, currentState = state) {
  const npc = WORLD.npcs.find((candidate) => candidate.x === x && candidate.y === y);
  if (npc) return { type: "npc", data: npc };

  const chest = WORLD.chests.find((candidate) => candidate.x === x && candidate.y === y);
  if (chest && !currentState.flags.openedChests.includes(chest.id)) return { type: "chest", data: chest };

  const node = WORLD.nodes.find((candidate) => candidate.x === x && candidate.y === y);
  if (node && !currentState.flags.harvestedNodes.includes(node.id)) return { type: "node", data: node };

  const gate = WORLD.gates.find((candidate) => candidate.x === x && candidate.y === y);
  if (gate) return { type: "gate", data: gate };

  return null;
}

export function nearbyInteractable(x, y, facing, currentState = state) {
  const direct = interactableAt(x + facing.x, y + facing.y, currentState);
  if (direct) return direct;

  const offsets = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];
  for (const offset of offsets) {
    const hit = interactableAt(x + offset.x, y + offset.y, currentState);
    if (hit) return hit;
  }
  return null;
}

export function resolveInteraction(target) {
  if (!target) {
    addLog("Nothing answers.");
    return { kind: "toast", text: "There is nothing to inspect here." };
  }

  if (target.type === "npc") {
    return talkToNpc(target.data);
  }

  if (target.type === "chest") {
    patchState((draft) => {
      draft.flags.openedChests.push(target.data.id);
      gainItem(target.data.item, target.data.amount);
    });
    return {
      kind: "dialogue",
      name: "Cache",
      text: `Inside: ${target.data.amount} ${ITEMS[target.data.item].name}.`
    };
  }

  if (target.type === "node") {
    patchState(() => {
      harvestNode(target.data);
      unlockCodex("echoes");
    });
    return {
      kind: "dialogue",
      name: target.data.label,
      text: "Lyra hums the shard into tune. New harmonics thread through the party's arts."
    };
  }

  if (target.type === "gate") {
    if (state.quests.main.stage >= 4) {
      return {
        kind: "battle",
        group: target.data.battle,
        text: "The mirror gate opens like an eye."
      };
    }
    return {
      kind: "dialogue",
      name: "Mirror Gate",
      text: "Three empty sockets wait for echo-shards from forest, mire, and ruin."
    };
  }

  return { kind: "toast", text: "Nothing happens." };
}

function talkToNpc(npc) {
  const hasTalked = state.flags.talked.includes(npc.id);
  patchState((draft) => {
    if (!draft.flags.talked.includes(npc.id)) draft.flags.talked.push(npc.id);
    if (npc.id === "archivist") {
      unlockCodex("echoes");
      advanceMainQuest();
    }
    if (npc.id === "scout") unlockCodex("mire");
    if (npc.id === "oracle") unlockCodex("regent");
    if (npc.id === "blacksmith" && draft.flags.harvestedNodes.length >= 2 && !draft.flags.smithTuned) {
      draft.flags.smithTuned = true;
      draft.quests.smith.stage = 2;
      draft.party.forEach((hero) => {
        hero.attack += 3;
      });
      addJournal("Tovin rewired the party's weapons with echo-bright ore. Every strike now lands with cleaner force.");
      addLog("Weapons tuned: attack increased.");
    }
  });

  const index = hasTalked ? 1 : 0;
  return {
    kind: "dialogue",
    name: npc.name,
    text: npc.lines[Math.min(index, npc.lines.length - 1)]
  };
}

export function questSummary() {
  const quest = QUESTS.main;
  return {
    title: quest.title,
    text: quest.stages[state.quests.main.stage]
  };
}

function makeCombatant(base, side, index) {
  return {
    uid: `${side}-${base.id}-${index}`,
    sourceId: base.id,
    side,
    name: base.name,
    role: base.role || "",
    level: base.level || 1,
    maxHp: base.maxHp,
    maxAp: base.maxAp || 0,
    hp: base.hp ?? base.maxHp,
    ap: base.ap ?? base.maxAp ?? 0,
    attack: base.attack,
    magic: base.magic,
    defense: base.defense,
    speed: base.speed,
    element: base.element,
    weak: base.weak || [],
    resist: base.resist || [],
    abilities: base.abilities || ["attack"],
    skills: base.skills || ["attack"],
    texture: base.texture,
    xp: base.xp || 0,
    drops: base.drops || [],
    boss: Boolean(base.boss),
    statuses: [],
    guard: false,
    scanned: false,
    limit: base.limit || 0
  };
}

export class CombatEngine {
  constructor(currentState, encounterId) {
    this.sourceState = currentState;
    this.encounterId = encounterId;
    this.encounter = ENCOUNTERS[encounterId] || ENCOUNTERS.forest;
    const enemyIds = this.encounter.fixed || this.encounter.groups[Math.floor(Math.random() * this.encounter.groups.length)];
    this.party = currentState.party.map((hero, index) => makeCombatant(hero, "party", index));
    this.enemies = enemyIds.map((enemyId, index) => makeCombatant(ENEMIES[enemyId], "enemy", index));
    this.combatants = [...this.party, ...this.enemies];
    this.queue = [];
    this.activeId = null;
    this.log = [`${this.encounter.name} begins.`];
    this.finished = false;
    this.victory = false;
    this.defeat = false;
    this.beginNextTurn();
  }

  livingParty() {
    return this.party.filter((unit) => unit.hp > 0);
  }

  livingEnemies() {
    return this.enemies.filter((unit) => unit.hp > 0);
  }

  active() {
    return this.combatants.find((unit) => unit.uid === this.activeId);
  }

  getAbility(id) {
    return ABILITIES[id] || ABILITIES.attack;
  }

  availableAbilities(actor) {
    const ids = ["attack", ...actor.abilities];
    if (actor.side === "party" && actor.limit >= 100) ids.push("starfall");
    return [...new Set(ids)]
      .map((id) => this.getAbility(id))
      .filter(Boolean);
  }

  validTargets(actor, descriptor) {
    const targetType = descriptor.target || "enemy";
    if (targetType === "self") return [actor].filter((unit) => unit.hp > 0);
    if (targetType === "ally") return (actor.side === "party" ? this.party : this.enemies).filter((unit) => unit.hp > 0);
    if (targetType === "enemy") return (actor.side === "party" ? this.enemies : this.party).filter((unit) => unit.hp > 0);
    if (targetType === "all_allies") return (actor.side === "party" ? this.party : this.enemies).filter((unit) => unit.hp > 0);
    if (targetType === "all_enemies") return (actor.side === "party" ? this.enemies : this.party).filter((unit) => unit.hp > 0);
    return [];
  }

  canUse(actor, ability) {
    if (!actor || actor.hp <= 0) return false;
    if (ability.limit && actor.limit < 100) return false;
    return actor.ap >= ability.cost;
  }

  beginNextTurn(events = []) {
    if (this.finished) return events;
    this.checkEnd();
    if (this.finished) return events;

    if (!this.queue.length) {
      this.queue = this.combatants
        .filter((unit) => unit.hp > 0)
        .sort((a, b) => this.effectiveSpeed(b) - this.effectiveSpeed(a))
        .map((unit) => unit.uid);
    }

    const nextId = this.queue.shift();
    const actor = this.combatants.find((unit) => unit.uid === nextId && unit.hp > 0);
    if (!actor) return this.beginNextTurn(events);

    this.activeId = actor.uid;
    actor.guard = false;
    this.tickStatuses(actor, events);
    if (actor.hp <= 0) return this.beginNextTurn(events);

    events.push({ type: "turn", actor: actor.uid, text: `${actor.name}'s turn.` });
    this.pushLog(`${actor.name}'s turn.`);
    return events;
  }

  effectiveSpeed(unit) {
    return unit.speed + (this.hasStatus(unit, "haste") ? 5 : 0);
  }

  submit(action) {
    const actor = this.active();
    const events = [];
    if (!actor || actor.hp <= 0 || this.finished) return events;

    if (action.type === "guard") {
      actor.guard = true;
      this.addStatus(actor, { id: "guard", turns: 1 });
      events.push({ type: "status", target: actor.uid, text: `${actor.name} guards.` });
      this.pushLog(`${actor.name} guards.`);
    }

    if (action.type === "ability") {
      this.useAbility(actor, action.abilityId, action.targetId, events, action.descriptor);
    }

    if (action.type === "item") {
      this.useItem(actor, action.itemId, action.targetId, events);
    }

    this.tickStatusDurations(actor);
    this.checkEnd();
    if (!this.finished) this.beginNextTurn(events);
    return events;
  }

  useAbility(actor, abilityId, targetId, events, override = null) {
    const ability = { cost: 0, ...this.getAbility(abilityId), ...(override || {}) };
    if (!this.canUse(actor, ability)) {
      events.push({ type: "log", text: `${actor.name} cannot use ${ability.name}.` });
      return;
    }

    actor.ap -= ability.cost || 0;
    if (ability.limit) actor.limit = 0;
    const targets = this.resolveTargetList(actor, ability, targetId);
    this.applyDescriptor(actor, ability, targets, events);
  }

  useItem(actor, itemId, targetId, events) {
    const item = ITEMS[itemId];
    if (!item || actor.side !== "party") return;
    if (!spendItem(itemId, 1)) {
      events.push({ type: "log", text: `No ${item.name} remain.` });
      return;
    }
    const targets = this.resolveTargetList(actor, item, targetId);
    this.applyDescriptor(actor, item, targets, events, true);
  }

  enemyAction() {
    const actor = this.active();
    if (!actor || actor.side !== "enemy") return [];
    const skillId = actor.skills[Math.floor(Math.random() * actor.skills.length)];
    const descriptor = skillId === "attack"
      ? ABILITIES.attack
      : {
          id: skillId,
          target: "enemy",
          kind: "damage",
          ...ENEMY_SKILLS[skillId]
        };
    const target = this.chooseEnemyTarget(actor);
    return this.submit({ type: "ability", abilityId: descriptor.id, targetId: target.uid, descriptor });
  }

  chooseEnemyTarget(actor) {
    const provoker = this.livingParty().find((unit) => this.hasStatus(unit, "guard"));
    if (provoker && Math.random() < 0.62) return provoker;
    return this.livingParty().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  }

  resolveTargetList(actor, descriptor, targetId) {
    const targets = this.validTargets(actor, descriptor);
    if (descriptor.target === "all_allies" || descriptor.target === "all_enemies") return targets;
    if (descriptor.target === "self") return [actor];
    return [targets.find((target) => target.uid === targetId) || targets[0]].filter(Boolean);
  }

  applyDescriptor(actor, descriptor, targets, events, fromItem = false) {
    const name = descriptor.name || ITEMS[descriptor.id]?.name || "Action";
    if (descriptor.kind === "scan") {
      targets.forEach((target) => {
        target.scanned = true;
        this.addStatus(target, { id: "marked", turns: 3 });
        const weak = target.weak.length ? target.weak.join(", ") : "none";
        const text = `${target.name} weakness: ${weak}.`;
        events.push({ type: "scan", target: target.uid, text });
        this.pushLog(text);
      });
      return;
    }

    if (descriptor.kind === "status") {
      targets.forEach((target) => {
        this.addStatus(target, descriptor.status);
        const text = `${actor.name} uses ${name}.`;
        events.push({ type: "status", target: target.uid, text });
        this.pushLog(text);
      });
      return;
    }

    if (descriptor.kind === "heal" || descriptor.kind === "ap") {
      targets.forEach((target) => {
        const amount = Math.round((descriptor.power || 0) + (actor[descriptor.stat] || 0) * 0.8);
        if (descriptor.kind === "heal") {
          target.hp = clamp(target.hp + amount, 0, target.maxHp);
          events.push({ type: "heal", target: target.uid, amount, text: `${actor.name} uses ${name}.` });
          this.pushLog(`${target.name} recovers ${amount} HP.`);
        } else {
          target.ap = clamp(target.ap + descriptor.power, 0, target.maxAp);
          events.push({ type: "ap", target: target.uid, amount: descriptor.power, text: `${target.name} recovers AP.` });
          this.pushLog(`${target.name} recovers AP.`);
        }
      });
      return;
    }

    if (descriptor.kind === "damage") {
      targets.forEach((target) => {
        const result = this.damage(actor, target, descriptor, fromItem);
        target.hp = clamp(target.hp - result.amount, 0, target.maxHp);
        if (actor.side === "party") actor.limit = clamp(actor.limit + (result.weak ? 18 : 10), 0, 100);
        if (target.side === "party") target.limit = clamp(target.limit + 12, 0, 100);
        events.push({
          type: "damage",
          actor: actor.uid,
          target: target.uid,
          amount: result.amount,
          weak: result.weak,
          resist: result.resist,
          defeated: target.hp <= 0,
          text: `${actor.name} uses ${name}.`
        });
        this.pushLog(`${target.name} takes ${result.amount}${result.weak ? " weak" : ""} damage.`);
        if (descriptor.status && target.hp > 0 && chance(descriptor.status.chance || 1)) {
          this.addStatus(target, descriptor.status);
          events.push({ type: "status", target: target.uid, text: `${target.name} is ${descriptor.status.id}.` });
        }
      });
    }
  }

  damage(actor, target, descriptor, fromItem) {
    const stat = descriptor.stat || "attack";
    const base = descriptor.power + (fromItem ? 0 : actor[stat] * 0.95);
    const defense = target.defense * (this.hasStatus(target, "sunder") ? 0.68 : 1);
    let amount = Math.max(1, base - defense);
    let weak = false;
    let resist = false;
    if (target.weak.includes(descriptor.element)) {
      amount *= target.scanned || this.hasStatus(target, "marked") ? 1.65 : 1.35;
      weak = true;
    }
    if (target.resist.includes(descriptor.element)) {
      amount *= 0.68;
      resist = true;
    }
    if (target.guard || this.hasStatus(target, "guard") || this.hasStatus(target, "ward")) amount *= 0.58;
    amount *= 0.9 + Math.random() * 0.2;
    return { amount: Math.round(amount), weak, resist };
  }

  tickStatuses(unit, events) {
    const poison = this.status(unit, "poison");
    const burn = this.status(unit, "burn");
    const bleed = this.status(unit, "bleed");
    const dots = [poison, burn, bleed].filter(Boolean);
    dots.forEach((status) => {
      const amount = status.id === "burn" ? 9 : status.id === "bleed" ? 7 : 8;
      unit.hp = clamp(unit.hp - amount, 0, unit.maxHp);
      events.push({ type: "damage", target: unit.uid, amount, text: `${unit.name} suffers ${status.id}.` });
      this.pushLog(`${unit.name} suffers ${status.id}.`);
    });
  }

  tickStatusDurations(unit) {
    unit.statuses.forEach((status) => {
      status.turns -= 1;
    });
    unit.statuses = unit.statuses.filter((status) => status.turns > 0);
  }

  addStatus(unit, status) {
    if (!status) return;
    const existing = unit.statuses.find((entry) => entry.id === status.id);
    if (existing) {
      existing.turns = Math.max(existing.turns, status.turns || 1);
    } else {
      unit.statuses.push({ id: status.id, turns: status.turns || 1 });
    }
  }

  status(unit, id) {
    return unit.statuses.find((entry) => entry.id === id);
  }

  hasStatus(unit, id) {
    return Boolean(this.status(unit, id));
  }

  checkEnd() {
    if (this.finished) return;
    if (!this.livingEnemies().length) {
      this.finished = true;
      this.victory = true;
    }
    if (!this.livingParty().length) {
      this.finished = true;
      this.defeat = true;
    }
  }

  pushLog(text) {
    this.log.unshift(text);
    this.log = this.log.slice(0, 8);
  }

  commitVictory() {
    const xp = this.enemies.reduce((sum, enemy) => sum + enemy.xp, 0);
    patchState((draft) => {
      this.party.forEach((combatant) => {
        const hero = draft.party.find((member) => member.id === combatant.sourceId);
        if (hero) {
          hero.hp = Math.max(1, combatant.hp);
          hero.ap = combatant.ap;
          hero.limit = combatant.limit;
        }
      });

      awardXp(xp);
      this.enemies.forEach((enemy) => {
        enemy.drops.forEach((drop) => {
          if (chance(drop.chance)) gainItem(drop.item, drop.amount);
        });
      });

      if (this.encounterId === "mirror_regent") {
        draft.flags.bossDefeated = true;
        draft.quests.main.stage = 5;
        addJournal("The Mirror Regent shattered at sunrise. For the first time in a century, Asterfall heard its own bell instead of an old oath.");
      }
      addLog(`Victory. ${xp} XP gained.`);
    });
  }

  commitDefeat() {
    patchState((draft) => {
      draft.party.forEach((hero) => {
        hero.hp = Math.max(1, Math.round(hero.maxHp * 0.45));
        hero.ap = Math.max(0, Math.round(hero.maxAp * 0.35));
        hero.limit = 0;
      });
      draft.world.x = draft.world.lastSafe.x;
      draft.world.y = draft.world.lastSafe.y;
      draft.world.encounterGrace = 8;
      addLog("The party retreats to the last safe camp.");
    });
  }
}
