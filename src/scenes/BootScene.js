import { TILE_SIZE } from "../data.js?v=map-editor-1";

function makeTile(scene, key, colors) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(colors.base, 1);
  g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.fillStyle(colors.mid, 0.55);
  for (let i = 0; i < 8; i += 1) {
    g.fillRect((i * 7 + colors.base) % TILE_SIZE, (i * 11 + colors.mid) % TILE_SIZE, 3, 3);
  }
  g.lineStyle(1, colors.line, 0.28);
  g.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  g.generateTexture(key, TILE_SIZE, TILE_SIZE);
  g.destroy();
}

function makeCharacter(scene, key, colors) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x111417, 0.35);
  g.fillEllipse(16, 27, 20, 8);
  g.fillStyle(colors.coat, 1);
  g.fillRoundedRect(8, 10, 16, 18, 4);
  g.fillStyle(colors.face, 1);
  g.fillRoundedRect(10, 5, 12, 10, 4);
  g.fillStyle(colors.hair, 1);
  g.fillRect(8, 3, 16, 5);
  g.fillStyle(colors.accent, 1);
  g.fillRect(13, 13, 6, 11);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(12, 9, 2, 2);
  g.fillRect(19, 9, 2, 2);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function makeLyra(scene, key) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x111417, 0.35);
  g.fillEllipse(16, 28, 20, 7);
  g.fillStyle(0x21324d, 1);
  g.fillRoundedRect(10, 10, 12, 17, 4);
  g.fillStyle(0x5f7fa0, 1);
  g.fillRoundedRect(8, 12, 16, 15, 5);
  g.fillStyle(0xd9b86f, 1);
  g.fillRect(13, 13, 6, 13);
  g.fillRect(9, 20, 15, 2);
  g.fillStyle(0xf0c8a4, 1);
  g.fillRoundedRect(10, 5, 12, 10, 4);
  g.fillStyle(0x243449, 1);
  g.fillRect(7, 3, 18, 4);
  g.fillRect(20, 7, 4, 12);
  g.fillStyle(0x69c7c0, 0.95);
  g.fillRect(5, 12, 3, 3);
  g.fillRect(24, 10, 2, 2);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(12, 9, 2, 2);
  g.fillRect(19, 9, 2, 2);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function makeBram(scene, key) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x111417, 0.42);
  g.fillEllipse(16, 28, 25, 8);
  g.fillStyle(0x343b43, 1);
  g.fillRoundedRect(6, 10, 20, 17, 3);
  g.fillStyle(0x7f8d99, 1);
  g.fillRect(6, 11, 20, 5);
  g.fillRect(8, 16, 16, 9);
  g.fillStyle(0x2c3238, 1);
  g.fillRect(4, 13, 6, 13);
  g.fillStyle(0xd9b86f, 1);
  g.fillRect(5, 15, 4, 9);
  g.fillRect(14, 16, 4, 9);
  g.fillStyle(0xc99770, 1);
  g.fillRoundedRect(10, 5, 12, 9, 3);
  g.fillStyle(0x211915, 1);
  g.fillRect(9, 3, 14, 4);
  g.fillRect(12, 12, 8, 3);
  g.fillStyle(0xe17d4f, 1);
  g.fillRect(24, 10, 3, 16);
  g.fillRect(23, 10, 5, 2);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(12, 8, 2, 2);
  g.fillRect(18, 8, 2, 2);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function makeSera(scene, key) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x111417, 0.35);
  g.fillEllipse(16, 28, 19, 7);
  g.fillStyle(0x1f4034, 1);
  g.fillTriangle(16, 2, 6, 14, 26, 14);
  g.fillStyle(0x2f6a52, 1);
  g.fillRoundedRect(8, 11, 16, 16, 5);
  g.fillStyle(0x82a96e, 1);
  g.fillRect(10, 18, 12, 8);
  g.fillStyle(0xe2bd91, 1);
  g.fillRoundedRect(11, 6, 10, 9, 4);
  g.fillStyle(0x6f3721, 1);
  g.fillRect(10, 5, 12, 3);
  g.fillRect(8, 9, 4, 9);
  g.fillStyle(0xd9b86f, 1);
  g.fillRect(21, 15, 5, 7);
  g.fillStyle(0x5a4631, 1);
  g.fillRect(4, 18, 5, 8);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(12, 9, 2, 2);
  g.fillRect(18, 9, 2, 2);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function makeEnemy(scene, key, colors, boss = false) {
  const size = boss ? 96 : 64;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(size / 2, size - 10, size * 0.65, 12);
  g.fillStyle(colors.body, 1);
  g.fillTriangle(size / 2, 7, size - 10, size - 18, 10, size - 18);
  g.fillStyle(colors.core, 0.9);
  g.fillCircle(size / 2, size / 2, boss ? 19 : 12);
  g.lineStyle(3, colors.line, 0.85);
  g.strokeTriangle(size / 2, 7, size - 10, size - 18, 10, size - 18);
  if (boss) {
    g.lineStyle(4, 0xfff0a6, 0.85);
    g.strokeCircle(size / 2, size / 2, 31);
    g.fillStyle(0xfff0a6, 0.9);
    g.fillRect(size / 2 - 16, 8, 32, 6);
  }
  g.generateTexture(key, size, size);
  g.destroy();
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    makeTile(this, "tile-field", { base: 0x455d45, mid: 0x6e8f5d, line: 0x253328 });
    makeTile(this, "tile-village", { base: 0x6b5847, mid: 0xa5875e, line: 0x2c221a });
    makeTile(this, "tile-road", { base: 0x615f5b, mid: 0x9d9b8d, line: 0x292a2b });
    makeTile(this, "tile-forest", { base: 0x1f5a52, mid: 0x69c7c0, line: 0x122d2b });
    makeTile(this, "tile-mire", { base: 0x33453f, mid: 0x82a96e, line: 0x18231d });
    makeTile(this, "tile-ruins", { base: 0x3c3f4a, mid: 0xd9b86f, line: 0x1f2029 });
    makeTile(this, "tile-scar", { base: 0x4a303d, mid: 0xd06d7f, line: 0x251820 });
    makeTile(this, "tile-sanctuary", { base: 0x5f6f7a, mid: 0xfff1a8, line: 0x2d3941 });
    makeTile(this, "tile-ridge", { base: 0x1b2024, mid: 0x353b40, line: 0x0d0f12 });

    makeLyra(this, "hero");
    makeLyra(this, "hero-lyra");
    makeBram(this, "hero-bram");
    makeSera(this, "hero-sera");
    makeCharacter(this, "npc-archivist", { coat: 0x74578e, face: 0xd8bb9d, hair: 0xf2e6c8, accent: 0x69c7c0 });
    makeCharacter(this, "npc-smith", { coat: 0x7e563c, face: 0xc99770, hair: 0x2d1c14, accent: 0xe17d4f });
    makeCharacter(this, "npc-scout", { coat: 0x2f6a52, face: 0xe2bd91, hair: 0x191a18, accent: 0x82a96e });
    makeCharacter(this, "npc-oracle", { coat: 0x704a64, face: 0xf0d9bd, hair: 0xffffff, accent: 0xd9b86f });
    makeCharacter(this, "npc-dawn", { coat: 0x6b7384, face: 0xf0d9bd, hair: 0xfff1a8, accent: 0x69c7c0 });
    makeCharacter(this, "npc-bell", { coat: 0x364b58, face: 0xd8bb9d, hair: 0x2a2b35, accent: 0xd9b86f });

    makeEnemy(this, "enemy-glassling", { body: 0x72c9c5, core: 0xfff1a8, line: 0xd9ffff });
    makeEnemy(this, "enemy-witch", { body: 0x526d48, core: 0xd06d7f, line: 0xa8d686 });
    makeEnemy(this, "enemy-knight", { body: 0x555c66, core: 0x69c7c0, line: 0xc9d0d8 });
    makeEnemy(this, "enemy-warden", { body: 0x6e6480, core: 0xd9b86f, line: 0xffe5a6 });
    makeEnemy(this, "enemy-regent", { body: 0x3a3947, core: 0xfff0a6, line: 0xd06d7f }, true);

    this.scene.start("TitleScene");
  }
}
