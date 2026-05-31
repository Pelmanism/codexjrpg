import { BootScene } from "./scenes/BootScene.js?v=baked-map-1";
import { TitleScene } from "./scenes/TitleScene.js?v=baked-map-1";
import { WorldScene } from "./scenes/WorldScene.js?v=baked-map-1";
import { BattleScene } from "./scenes/BattleScene.js?v=baked-map-1";

const bootError = document.getElementById("boot-error");

if (!window.Phaser) {
  bootError.hidden = false;
} else {
  const Phaser = window.Phaser;
  const config = {
    type: Phaser.AUTO,
    parent: "game-root",
    backgroundColor: "#101419",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1024,
      height: 640
    },
    scene: [BootScene, TitleScene, WorldScene, BattleScene],
    input: {
      keyboard: true,
      mouse: true,
      touch: true
    },
    render: {
      antialias: false
    }
  };

  window.asterfall = new Phaser.Game(config);
}
