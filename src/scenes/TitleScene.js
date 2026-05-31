import { OverlayUI } from "../ui.js?v=baked-map-1";
import { hasSave, loadGame, resetState } from "../state.js?v=baked-map-1";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    document.body.classList.remove("battle-mode");
    this.scale.refresh();
    this.ui = new OverlayUI(document.getElementById("hud-root"));
    this.drawBackdrop();
    this.ui.showTitle({
      newGame: () => {
        resetState();
        this.ui.clear();
        this.scene.start("WorldScene");
      },
      continueGame: () => {
        if (hasSave()) loadGame();
        this.ui.clear();
        this.scene.start("WorldScene");
      }
    });
  }

  drawBackdrop() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x101419, 0x101419, 0x221820, 0x171716, 1);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 86; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 4);
      const color = Phaser.Math.RND.pick([0x69c7c0, 0xd9b86f, 0xd06d7f, 0xf5f0dc]);
      g.fillStyle(color, Phaser.Math.FloatBetween(0.15, 0.5));
      g.fillRect(x, y, size, size);
    }
    for (let i = 0; i < 9; i += 1) {
      const x = 120 + i * 96;
      g.lineStyle(2, 0xd9b86f, 0.16);
      g.beginPath();
      g.moveTo(x, height);
      g.lineTo(width / 2, height * 0.18);
      g.strokePath();
    }
  }
}
