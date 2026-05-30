# Asterfall: Echoes of Glass

A zero-build browser JRPG prototype made for this workspace.

## Run

```powershell
python -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

The game uses Phaser from a pinned CDN script because Node/npm are not available in this environment.

## Current Features

- Top-down tile exploration with camera follow, collision, NPCs, caches, echo nodes, and a boss gate.
- Quest progression, journal, codex, inventory, save/load, party stats, and field log.
- Turn-based party combat with AP costs, limit meter, elemental weakness/resistance, status effects, guard, items, XP, level-ups, drops, victory, and defeat recovery.
- DOM HUD and command menus layered over a Phaser canvas.
- Procedural pixel-style textures generated at boot, so no external art files are required beyond Phaser.

## Controls

- Move: arrow keys or WASD
- Interact: Space or E
- Journal: J
- Menu: M or Escape
