import { CombatEngine } from "../systems.js?v=map-editor-1";
import { state } from "../state.js?v=map-editor-1";
import { OverlayUI } from "../ui.js?v=map-editor-1";

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data) {
    this.encounterId = data.encounterId || "forest";
  }

  create() {
    document.body.classList.add("battle-mode");
    this.scale.refresh();
    this.ui = new OverlayUI(document.getElementById("hud-root"));
    this.engine = new CombatEngine(state, this.encounterId);
    this.sprites = new Map();
    this.drawArena();
    this.createUnits();
    this.cameras.main.fadeIn(260, 0, 0, 0);
    this.render();
    this.maybeEnemyTurn();
    this.events.once("shutdown", () => {
      document.body.classList.remove("battle-mode");
      this.scale.refresh();
    });
  }

  drawArena() {
    const { width, height } = this.scale;
    const palettes = {
      forest: [0x132724, 0x1f5a52, 0x69c7c0],
      mire: [0x17231e, 0x33453f, 0x82a96e],
      ruins: [0x161922, 0x3c3f4a, 0xd9b86f],
      regent: [0x17121a, 0x3a2636, 0xd06d7f]
    };
    const palette = palettes[this.engine.encounter.background] || palettes.forest;
    const g = this.add.graphics();
    g.fillGradientStyle(palette[0], palette[0], palette[1], palette[1], 1);
    g.fillRect(0, 0, width, height);
    g.lineStyle(2, palette[2], 0.22);
    for (let i = 0; i < 18; i += 1) {
      const y = 90 + i * 26;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(width, y + Math.sin(i) * 18);
      g.strokePath();
    }
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(width / 2, height * 0.66, width * 0.78, height * 0.24);
  }

  createUnits() {
    const { width, height } = this.scale;
    this.engine.party.forEach((unit, index) => {
      const sprite = this.add.sprite(160, height * 0.44 + index * 82, unit.texture || "hero").setScale(1.55).setDepth(20);
      this.sprites.set(unit.uid, sprite);
    });
    this.engine.enemies.forEach((unit, index) => {
      const spread = (index - (this.engine.enemies.length - 1) / 2) * 120;
      const sprite = this.add.sprite(width - 220 + spread, height * 0.47 + index * 38, unit.texture).setScale(unit.boss ? 1.25 : 1.35).setDepth(20);
      this.sprites.set(unit.uid, sprite);
      this.tweens.add({ targets: sprite, y: sprite.y - 8, duration: 1300 + index * 120, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    });
  }

  render() {
    this.updateSprites();
    this.ui.showBattle(this.engine, {
      guard: () => this.playerAction({ type: "guard" }),
      act: (selection) => {
        if (selection.type === "ability") {
          this.playerAction({ type: "ability", abilityId: selection.id, targetId: selection.targetId });
        }
        if (selection.type === "item") {
          this.playerAction({ type: "item", itemId: selection.id, targetId: selection.targetId });
        }
      }
    });
  }

  playerAction(action) {
    const events = this.engine.submit(action);
    this.playEvents(events, () => {
      this.afterTurn();
    });
  }

  maybeEnemyTurn() {
    const active = this.engine.active();
    if (!active || active.side !== "enemy" || this.engine.finished) return;
    this.render();
    this.time.delayedCall(520, () => {
      const events = this.engine.enemyAction();
      this.playEvents(events, () => this.afterTurn());
    });
  }

  afterTurn() {
    this.render();
    if (this.engine.victory) {
      this.endBattle(true);
      return;
    }
    if (this.engine.defeat) {
      this.endBattle(false);
      return;
    }
    this.maybeEnemyTurn();
  }

  playEvents(events, done) {
    let delay = 0;
    events.forEach((event) => {
      this.time.delayedCall(delay, () => this.playEvent(event));
      delay += event.type === "turn" ? 90 : 270;
    });
    this.time.delayedCall(delay + 80, done);
  }

  playEvent(event) {
    if (event.type === "damage" || event.type === "heal" || event.type === "ap") {
      const sprite = this.sprites.get(event.target);
      if (!sprite) return;
      const color = event.type === "damage" ? "#ffd2d2" : event.type === "heal" ? "#c8ffd4" : "#cbe7ff";
      const prefix = event.type === "damage" ? "-" : "+";
      this.floatText(sprite.x, sprite.y - 38, `${prefix}${event.amount}`, color);
      if (event.type === "damage") {
        this.cameras.main.shake(event.weak ? 100 : 70, event.weak ? 0.006 : 0.003);
        this.tweens.add({ targets: sprite, x: sprite.x + 10, duration: 45, yoyo: true, repeat: 1 });
      }
    }
    if (event.type === "status" || event.type === "scan") {
      const sprite = this.sprites.get(event.target);
      if (sprite) this.floatText(sprite.x, sprite.y - 50, event.type === "scan" ? "SCAN" : "STATUS", "#fff1a8");
    }
    this.updateSprites();
  }

  updateSprites() {
    this.engine.combatants.forEach((unit) => {
      const sprite = this.sprites.get(unit.uid);
      if (!sprite) return;
      sprite.setAlpha(unit.hp > 0 ? 1 : 0.28);
      sprite.setTint(unit.statuses.some((status) => status.id === "poison") ? 0x9cd47d : 0xffffff);
      if (this.engine.active()?.uid === unit.uid) {
        sprite.setScale(unit.boss ? 1.32 : unit.side === "party" ? 1.68 : 1.45);
      } else {
        sprite.setScale(unit.boss ? 1.25 : unit.side === "party" ? 1.55 : 1.35);
      }
    });
  }

  floatText(x, y, text, color) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      fontStyle: "900",
      color,
      stroke: "#111417",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
      onComplete: () => label.destroy()
    });
  }

  endBattle(victory) {
    this.time.delayedCall(520, () => {
      if (victory) {
        this.engine.commitVictory();
        this.ui.toast("Victory.");
      } else {
        this.engine.commitDefeat();
        this.ui.toast("Defeat. The party retreats.");
      }
      this.cameras.main.fadeOut(320, 0, 0, 0);
      this.time.delayedCall(340, () => {
        this.ui.clear();
        this.scene.start("WorldScene");
      });
    });
  }
}
