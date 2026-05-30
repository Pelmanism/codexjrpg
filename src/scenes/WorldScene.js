import { TILE_SIZE, WORLD } from "../data.js";
import {
  gridToWorld,
  interactableAt,
  isBlocked,
  nearbyInteractable,
  regionForTile,
  resolveInteraction,
  terrainAt
} from "../systems.js";
import {
  addLog,
  loadGame,
  patchState,
  saveGame,
  state,
  subscribe
} from "../state.js";
import { OverlayUI } from "../ui.js";

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 }
};

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
    this.facing = { x: 0, y: 1 };
    this.busy = false;
  }

  create() {
    this.ui = new OverlayUI(document.getElementById("hud-root"));
    this.busy = false;
    this.facing = { x: 0, y: 1 };
    this.drawMap();
    this.drawObjects();
    const pos = gridToWorld(state.world.x, state.world.y);
    this.player = this.add.sprite(pos.x, pos.y, "hero").setDepth(50);
    this.cameras.main.setBounds(0, 0, WORLD.width * TILE_SIZE, WORLD.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.85);
    this.keys = this.input.keyboard.addKeys("SPACE,E,J,M,ESC");
    this.unsub = subscribe(() => this.refreshHud());
    this.refreshHud();
    this.input.keyboard.on("keydown", this.handleKey, this);
    this.events.once("shutdown", () => {
      this.unsub?.();
      this.input.keyboard.off("keydown", this.handleKey, this);
    });
  }

  drawMap() {
    for (let y = 0; y < WORLD.height; y += 1) {
      for (let x = 0; x < WORLD.width; x += 1) {
        const terrain = terrainAt(x, y);
        const texture = `tile-${terrain.id === "void" ? "ridge" : terrain.id}`;
        const pos = gridToWorld(x, y);
        this.add.image(pos.x, pos.y, this.textures.exists(texture) ? texture : "tile-field").setDepth(0);
      }
    }

    const g = this.add.graphics().setDepth(2);
    WORLD.safeTiles.forEach((tile) => {
      const pos = gridToWorld(tile.x, tile.y);
      g.lineStyle(2, 0xd9b86f, 0.45);
      g.strokeCircle(pos.x, pos.y, 12);
    });
  }

  drawObjects() {
    this.objectLayer?.destroy(true);
    this.objectLayer = this.add.container(0, 0);
    WORLD.npcs.forEach((npc) => {
      const pos = gridToWorld(npc.x, npc.y);
      const sprite = this.add.sprite(pos.x, pos.y, npc.texture).setDepth(42);
      this.objectLayer.add(sprite);
      this.addFloatingLabel(npc.name, pos.x, pos.y - 25, 45);
    });

    WORLD.chests.forEach((chest) => {
      if (state.flags.openedChests.includes(chest.id)) return;
      const pos = gridToWorld(chest.x, chest.y);
      const g = this.add.graphics().setDepth(30);
      g.fillStyle(0x6b4328, 1).fillRect(pos.x - 10, pos.y - 8, 20, 16);
      g.fillStyle(0xd9b86f, 1).fillRect(pos.x - 8, pos.y - 12, 16, 5);
      g.lineStyle(1, 0x1d120a, 1).strokeRect(pos.x - 10, pos.y - 8, 20, 16);
      this.objectLayer.add(g);
    });

    WORLD.nodes.forEach((node) => {
      if (state.flags.harvestedNodes.includes(node.id)) return;
      const pos = gridToWorld(node.x, node.y);
      const crystal = this.add.polygon(pos.x, pos.y, [0, -18, 11, -4, 7, 15, -8, 16, -12, -4], 0x69c7c0, 0.78).setDepth(31);
      crystal.setStrokeStyle(2, 0xfff1a8, 0.65);
      this.tweens.add({ targets: crystal, y: pos.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.objectLayer.add(crystal);
      this.addFloatingLabel(node.label, pos.x, pos.y - 30, 46);
    });

    WORLD.gates.forEach((gate) => {
      const pos = gridToWorld(gate.x, gate.y);
      const g = this.add.graphics().setDepth(29);
      g.lineStyle(4, state.quests.main.stage >= 4 ? 0xfff1a8 : 0x5b5664, 0.9);
      g.strokeCircle(pos.x, pos.y, 21);
      g.strokeCircle(pos.x, pos.y, 12);
      this.objectLayer.add(g);
    });
  }

  addFloatingLabel(text, x, y, depth) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Inter, sans-serif",
      fontSize: "9px",
      color: "#fff4d2",
      backgroundColor: "rgba(0,0,0,0.36)",
      padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setDepth(depth);
    this.objectLayer?.add(label);
  }

  handleKey(event) {
    if (this.busy) return;
    if (DIRS[event.code]) {
      this.tryMove(DIRS[event.code]);
      return;
    }
    if (event.code === "Space" || event.code === "KeyE") this.interact();
    if (event.code === "KeyJ") this.openJournal();
    if (event.code === "KeyM" || event.code === "Escape") this.openMenu();
  }

  tryMove(dir) {
    this.facing = dir;
    const nx = state.world.x + dir.x;
    const ny = state.world.y + dir.y;
    if (isBlocked(nx, ny, state)) {
      this.bump(dir);
      return;
    }
    this.busy = true;
    const pos = gridToWorld(nx, ny);
    this.tweens.add({
      targets: this.player,
      x: pos.x,
      y: pos.y,
      duration: 145,
      ease: "Sine.easeOut",
      onComplete: () => {
        patchState((draft) => {
          draft.world.x = nx;
          draft.world.y = ny;
          draft.world.steps += 1;
          draft.world.region = regionForTile(nx, ny);
          if (terrainAt(nx, ny).id === "village" || WORLD.safeTiles.some((tile) => tile.x === nx && tile.y === ny)) {
            draft.world.lastSafe = { x: nx, y: ny };
          }
          if (draft.world.encounterGrace > 0) draft.world.encounterGrace -= 1;
        });
        this.busy = false;
        this.maybeEncounter();
      }
    });
  }

  bump(dir) {
    const ox = dir.x * 4;
    const oy = dir.y * 4;
    this.tweens.add({
      targets: this.player,
      x: this.player.x + ox,
      y: this.player.y + oy,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut"
    });
  }

  interact() {
    const target = nearbyInteractable(state.world.x, state.world.y, this.facing, state);
    const result = resolveInteraction(target);
    this.drawObjects();
    this.refreshHud();
    if (result.kind === "dialogue") {
      this.busy = true;
      this.ui.showDialogue(result, () => {
        this.busy = false;
        this.refreshHud();
      });
    }
    if (result.kind === "battle") {
      this.ui.toast(result.text);
      this.startBattle(result.group);
    }
    if (result.kind === "toast") this.ui.toast(result.text);
  }

  maybeEncounter() {
    const terrain = terrainAt(state.world.x, state.world.y);
    if (!terrain.encounter || state.world.encounterGrace > 0) return;
    if (Math.random() < terrain.encounter) {
      const region = regionForTile(state.world.x, state.world.y);
      this.startBattle(region === "field" ? "forest" : region);
    }
  }

  startBattle(group) {
    this.busy = true;
    patchState((draft) => {
      draft.world.encounterGrace = 6;
    });
    this.cameras.main.fadeOut(240, 0, 0, 0);
    this.time.delayedCall(250, () => {
      this.ui.clear();
      this.scene.start("BattleScene", { encounterId: group });
    });
  }

  refreshHud() {
    const target = nearbyInteractable(state.world.x, state.world.y, this.facing, state);
    const prompt = target ? this.promptFor(target) : `${terrainAt(state.world.x, state.world.y).label} | Space/E interact`;
    this.ui.showWorld(state, {
      prompt,
      journal: () => this.openJournal(),
      party: () => this.openParty(),
      save: () => {
        saveGame();
        this.ui.toast("Saved.");
      },
      load: () => {
        loadGame();
        const pos = gridToWorld(state.world.x, state.world.y);
        this.player.setPosition(pos.x, pos.y);
        this.drawObjects();
        this.ui.toast("Loaded.");
      }
    });
  }

  promptFor(target) {
    if (target.type === "npc") return `Talk: ${target.data.name}`;
    if (target.type === "chest") return "Open cache";
    if (target.type === "node") return `Tune: ${target.data.label}`;
    if (target.type === "gate") return state.quests.main.stage >= 4 ? "Enter the Mirror Gate" : "Mirror Gate sealed";
    return "Interact";
  }

  openJournal() {
    this.busy = true;
    this.ui.showJournal(() => {
      this.busy = false;
      this.refreshHud();
    });
  }

  openParty() {
    this.busy = true;
    this.ui.showParty(() => {
      this.busy = false;
      this.refreshHud();
    });
  }

  openMenu() {
    this.busy = true;
    this.ui.showMenu(() => {
      this.busy = false;
      this.refreshHud();
    }, {
      journal: () => this.openJournal(),
      party: () => this.openParty(),
      save: () => {
        saveGame();
        this.ui.toast("Saved.");
      },
      load: () => {
        loadGame();
        this.scene.restart();
      }
    });
  }
}
