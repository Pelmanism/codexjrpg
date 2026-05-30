export const TILE_SIZE = 32;

export const WORLD = {
  width: 46,
  height: 34,
  start: { x: 6, y: 24 },
  safeTiles: [
    { x: 6, y: 24 },
    { x: 12, y: 20 },
    { x: 27, y: 14 }
  ],
  blockedRects: [
    { x: 0, y: 0, w: 46, h: 1 },
    { x: 0, y: 33, w: 46, h: 1 },
    { x: 0, y: 0, w: 1, h: 34 },
    { x: 45, y: 0, w: 1, h: 34 },
    { x: 2, y: 2, w: 8, h: 4 },
    { x: 15, y: 2, w: 4, h: 8 },
    { x: 31, y: 1, w: 2, h: 10 },
    { x: 36, y: 20, w: 6, h: 7 },
    { x: 4, y: 29, w: 14, h: 2 },
    { x: 23, y: 28, w: 10, h: 2 }
  ],
  npcs: [
    {
      id: "archivist",
      name: "Archivist Mave",
      x: 8,
      y: 23,
      texture: "npc-archivist",
      role: "Quest",
      lines: [
        "The observatory bell is awake again. Three glass echoes are feeding it from the wilds.",
        "Bring back shard readings from forest, mire, and ruin. The mirror road will open when the chorus is tuned."
      ]
    },
    {
      id: "blacksmith",
      name: "Tovin the Wire-Smith",
      x: 12,
      y: 26,
      texture: "npc-smith",
      role: "Craft",
      lines: [
        "Crystal does not break like iron. It remembers the hand that struck it.",
        "I can tune your blade if you bring me bright ore from the old waystones."
      ]
    },
    {
      id: "scout",
      name: "Scout Eno",
      x: 20,
      y: 17,
      texture: "npc-scout",
      role: "Warning",
      lines: [
        "The mire eats footsteps. If the reeds shimmer, expect a drowned knight.",
        "Guard before a heavy swing. A patient turn saves more lives than a brave one."
      ]
    },
    {
      id: "oracle",
      name: "Oracle Iri",
      x: 35,
      y: 10,
      texture: "npc-oracle",
      role: "Lore",
      lines: [
        "The Mirror Regent is not a king. It is every oath the city failed to keep.",
        "Carry mercy and fire. One opens the gate. The other survives it."
      ]
    }
  ],
  chests: [
    { id: "village-cache", x: 10, y: 21, item: "salve", amount: 3 },
    { id: "mire-lockbox", x: 24, y: 12, item: "ether", amount: 2 },
    { id: "ruin-reliquary", x: 38, y: 8, item: "star_bomb", amount: 1 }
  ],
  nodes: [
    { id: "forest-echo", x: 14, y: 14, shard: "verdant", label: "Verdant Echo" },
    { id: "mire-echo", x: 27, y: 19, shard: "mire", label: "Mire Echo" },
    { id: "ruin-echo", x: 38, y: 13, shard: "glass", label: "Glass Echo" }
  ],
  gates: [
    { id: "mirror-gate", x: 41, y: 11, battle: "mirror_regent" }
  ]
};

export const PARTY = [
  {
    id: "lyra",
    name: "Lyra",
    role: "Aether Soprano",
    maxHp: 112,
    maxAp: 42,
    attack: 18,
    magic: 24,
    defense: 7,
    speed: 13,
    element: "aether",
    abilities: ["spark", "mend"]
  },
  {
    id: "bram",
    name: "Bram",
    role: "Oathbreaker Guard",
    maxHp: 148,
    maxAp: 28,
    attack: 25,
    magic: 8,
    defense: 12,
    speed: 8,
    element: "iron",
    abilities: ["fracture", "provoke"]
  },
  {
    id: "sera",
    name: "Sera",
    role: "Mire Cartographer",
    maxHp: 96,
    maxAp: 48,
    attack: 15,
    magic: 22,
    defense: 6,
    speed: 16,
    element: "mire",
    abilities: ["venom_lace", "analyze", "quickstep"]
  }
];

export const ABILITIES = {
  attack: {
    id: "attack",
    name: "Strike",
    cost: 0,
    target: "enemy",
    kind: "damage",
    power: 18,
    stat: "attack",
    element: "weapon",
    text: "Reliable weapon damage."
  },
  spark: {
    id: "spark",
    name: "Glass Spark",
    cost: 7,
    target: "enemy",
    kind: "damage",
    power: 31,
    stat: "magic",
    element: "aether",
    status: { id: "burn", chance: 0.28, turns: 2 },
    text: "Aether damage with a chance to burn."
  },
  mend: {
    id: "mend",
    name: "Mend Motif",
    cost: 9,
    target: "ally",
    kind: "heal",
    power: 38,
    stat: "magic",
    element: "aether",
    text: "Restore one ally's HP."
  },
  lumen_chorus: {
    id: "lumen_chorus",
    name: "Lumen Chorus",
    cost: 14,
    target: "all_allies",
    kind: "heal",
    power: 23,
    stat: "magic",
    element: "aether",
    requiresShard: "verdant",
    text: "Heal the whole party. Unlocked by the Verdant Echo."
  },
  fracture: {
    id: "fracture",
    name: "Fracture",
    cost: 6,
    target: "enemy",
    kind: "damage",
    power: 29,
    stat: "attack",
    element: "iron",
    status: { id: "sunder", chance: 0.7, turns: 3 },
    text: "Damage and lower defense."
  },
  provoke: {
    id: "provoke",
    name: "Provoke",
    cost: 4,
    target: "self",
    kind: "status",
    status: { id: "guard", turns: 2 },
    text: "Guard and draw enemy attacks."
  },
  bulwark: {
    id: "bulwark",
    name: "Bulwark Bell",
    cost: 10,
    target: "all_allies",
    kind: "status",
    status: { id: "ward", turns: 2 },
    requiresShard: "mire",
    text: "Reduce incoming damage for the party."
  },
  venom_lace: {
    id: "venom_lace",
    name: "Venom Lace",
    cost: 7,
    target: "enemy",
    kind: "damage",
    power: 19,
    stat: "magic",
    element: "mire",
    status: { id: "poison", chance: 0.78, turns: 3 },
    text: "Light damage with strong poison chance."
  },
  analyze: {
    id: "analyze",
    name: "Analyze",
    cost: 3,
    target: "enemy",
    kind: "scan",
    text: "Reveal weakness and improve stagger gain."
  },
  quickstep: {
    id: "quickstep",
    name: "Quickstep",
    cost: 8,
    target: "self",
    kind: "status",
    status: { id: "haste", turns: 3 },
    text: "Raise speed for several turns."
  },
  starfall: {
    id: "starfall",
    name: "Starfall Limit",
    cost: 0,
    target: "all_enemies",
    kind: "damage",
    power: 54,
    stat: "magic",
    element: "aether",
    limit: true,
    text: "Spend full limit to strike all enemies."
  }
};

export const ITEMS = {
  salve: {
    id: "salve",
    name: "Field Salve",
    target: "ally",
    kind: "heal",
    power: 46,
    text: "Restores HP."
  },
  ether: {
    id: "ether",
    name: "Blue Ether",
    target: "ally",
    kind: "ap",
    power: 18,
    text: "Restores AP."
  },
  star_bomb: {
    id: "star_bomb",
    name: "Star Bomb",
    target: "all_enemies",
    kind: "damage",
    power: 38,
    element: "aether",
    text: "Deals aether damage to all enemies."
  }
};

export const ENEMIES = {
  glassling: {
    id: "glassling",
    name: "Glassling",
    maxHp: 64,
    maxAp: 10,
    attack: 17,
    magic: 10,
    defense: 5,
    speed: 11,
    element: "glass",
    weak: ["iron"],
    resist: ["aether"],
    xp: 18,
    drops: [{ item: "salve", chance: 0.22, amount: 1 }],
    skills: ["attack", "shard_bite"],
    texture: "enemy-glassling"
  },
  reed_witch: {
    id: "reed_witch",
    name: "Reed Witch",
    maxHp: 88,
    maxAp: 26,
    attack: 10,
    magic: 22,
    defense: 4,
    speed: 12,
    element: "mire",
    weak: ["aether"],
    resist: ["mire"],
    xp: 25,
    drops: [{ item: "ether", chance: 0.25, amount: 1 }],
    skills: ["attack", "mire_hex"],
    texture: "enemy-witch"
  },
  drowned_knight: {
    id: "drowned_knight",
    name: "Drowned Knight",
    maxHp: 118,
    maxAp: 14,
    attack: 24,
    magic: 8,
    defense: 10,
    speed: 7,
    element: "iron",
    weak: ["mire"],
    resist: ["iron"],
    xp: 34,
    drops: [{ item: "salve", chance: 0.35, amount: 1 }],
    skills: ["attack", "heavy_cleave"],
    texture: "enemy-knight"
  },
  relic_warden: {
    id: "relic_warden",
    name: "Relic Warden",
    maxHp: 132,
    maxAp: 18,
    attack: 22,
    magic: 18,
    defense: 11,
    speed: 9,
    element: "glass",
    weak: ["aether", "iron"],
    resist: ["mire"],
    xp: 42,
    drops: [{ item: "star_bomb", chance: 0.14, amount: 1 }],
    skills: ["attack", "mirror_lance"],
    texture: "enemy-warden"
  },
  mirror_regent: {
    id: "mirror_regent",
    name: "Mirror Regent",
    maxHp: 390,
    maxAp: 60,
    attack: 28,
    magic: 28,
    defense: 13,
    speed: 10,
    element: "aether",
    weak: ["mire"],
    resist: ["aether"],
    xp: 120,
    drops: [{ item: "ether", chance: 1, amount: 3 }],
    skills: ["attack", "mirror_lance", "heavy_cleave", "mire_hex"],
    texture: "enemy-regent",
    boss: true
  }
};

export const ENEMY_SKILLS = {
  shard_bite: { name: "Shard Bite", power: 24, stat: "attack", element: "glass", status: { id: "bleed", chance: 0.2, turns: 2 } },
  mire_hex: { name: "Mire Hex", power: 22, stat: "magic", element: "mire", status: { id: "poison", chance: 0.42, turns: 3 } },
  heavy_cleave: { name: "Heavy Cleave", power: 32, stat: "attack", element: "iron", status: { id: "sunder", chance: 0.34, turns: 2 } },
  mirror_lance: { name: "Mirror Lance", power: 30, stat: "magic", element: "aether", status: { id: "burn", chance: 0.32, turns: 2 } }
};

export const ENCOUNTERS = {
  forest: {
    name: "Glasswood Ambush",
    background: "forest",
    groups: [
      ["glassling", "glassling"],
      ["glassling", "reed_witch"]
    ]
  },
  mire: {
    name: "Sunken Road",
    background: "mire",
    groups: [
      ["reed_witch", "drowned_knight"],
      ["drowned_knight"]
    ]
  },
  ruins: {
    name: "Observatory Ruin",
    background: "ruins",
    groups: [
      ["relic_warden", "glassling"],
      ["relic_warden", "reed_witch"]
    ]
  },
  mirror_regent: {
    name: "The Mirror Regent",
    background: "regent",
    fixed: ["mirror_regent"]
  }
};

export const QUESTS = {
  main: {
    title: "Tune the Mirror Road",
    stages: [
      "Speak with Archivist Mave in Asterfall Village.",
      "Harvest the Verdant Echo in the north glasswood.",
      "Harvest the Mire Echo along the sunken road.",
      "Harvest the Glass Echo near the observatory ruin.",
      "Challenge the Mirror Regent beyond the eastern gate.",
      "Asterfall is free of the mirror oath."
    ]
  },
  smith: {
    title: "Wire-Smith's Favor",
    stages: [
      "Find bright ore from two waystones.",
      "Return to Tovin for a permanent attack tuning.",
      "The party's weapons hum with a cleaner edge."
    ]
  }
};

export const CODEX = {
  village: {
    title: "Asterfall Village",
    text: "A bell-town built around a fallen observatory lens. Its people track weather by the color of glass dust at dawn."
  },
  echoes: {
    title: "Glass Echoes",
    text: "Living resonances left by vows, battles, and unfinished songs. Lyra can tune them into spells."
  },
  mire: {
    title: "The Sunken Road",
    text: "Once a trade causeway. The regent's mirror taxes turned it into a marsh of unpaid names."
  },
  regent: {
    title: "Mirror Regent",
    text: "A crown-shaped oath construct. It survives by reflecting guilt back into the living."
  }
};
