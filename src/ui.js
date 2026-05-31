import { ABILITIES, CODEX, ITEMS, PARTY, QUESTS } from "./data.js?v=map-editor-1";
import { TERRAIN_TOOLS } from "./mapOverrides.js?v=map-editor-1";
import { hasSave, objectiveText, state } from "./state.js?v=map-editor-1";

function pct(value, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function memberCard(member) {
  return `
    <section class="hud-panel member-card">
      <div class="member-top">
        <div>
          <div class="member-name">${escapeHtml(member.name)} Lv ${member.level}</div>
          <div class="member-role">${escapeHtml(member.role)}</div>
        </div>
        <div class="small-label">${member.hp}/${member.maxHp}</div>
      </div>
      <div class="bar" aria-label="HP"><div class="bar-fill hp" style="width:${pct(member.hp, member.maxHp)}%"></div></div>
      <div class="bar" aria-label="AP"><div class="bar-fill ap" style="width:${pct(member.ap, member.maxAp)}%"></div></div>
      <div class="bar" aria-label="Limit"><div class="bar-fill limit" style="width:${pct(member.limit, 100)}%"></div></div>
    </section>
  `;
}

export class OverlayUI {
  constructor(root) {
    this.root = root;
    this.toastTimer = null;
    this.battleSelection = null;
  }

  clear() {
    this.root.innerHTML = "";
    this.battleSelection = null;
  }

  showTitle(actions) {
    this.root.innerHTML = `
      <section class="title-screen">
        <div class="title-mark">
          <h1>Asterfall:<br />Echoes of Glass</h1>
          <p>A tactical top-down JRPG prototype with exploration, quests, party growth, status-driven combat, field saves, and a boss route.</p>
        </div>
        <div class="title-actions">
          <button data-action="new">New Game</button>
          <button data-action="continue" ${hasSave() ? "" : "disabled"}>Continue</button>
          <button data-action="credits">Credits</button>
        </div>
      </section>
    `;
    this.bind("[data-action='new']", "click", actions.newGame);
    this.bind("[data-action='continue']", "click", actions.continueGame);
    this.bind("[data-action='credits']", "click", () => {
      this.toast("Design, code, systems, and procedural art are bundled locally in this folder.");
    });
  }

  showWorld(currentState, actions) {
    this.battleSelection = null;
    const quest = QUESTS.main;
    const codexCount = currentState.flags.codex.length;
    const encountersOff = Boolean(currentState.flags.encountersDisabled);
    this.root.innerHTML = `
      <section class="world-hud">
        <div class="party-stack">${currentState.party.map(memberCard).join("")}</div>
        <section class="hud-panel objective-panel">
          <div class="objective-top">
            <strong>${escapeHtml(quest.title)}</strong>
            <span class="small-label">Codex ${codexCount}/${Object.keys(CODEX).length}</span>
          </div>
          <p class="objective-text">${escapeHtml(objectiveText())}</p>
        </section>
        <section class="hud-panel feed-panel">
          ${currentState.log.slice(0, 5).map((entry) => `<div class="log-row">${escapeHtml(entry)}</div>`).join("")}
        </section>
        <div class="prompt-chip">${escapeHtml(actions.prompt || "Explore Asterfall. Interact with people, caches, echoes, and gates.")}</div>
        <div class="quick-actions">
          <button data-action="journal">Journal</button>
          <button data-action="party">Party</button>
          <button data-action="save">Save</button>
          <button data-action="load" ${hasSave() ? "" : "disabled"}>Load</button>
          <button data-action="map-editor">Map Edit</button>
          <button
            class="debug-toggle ${encountersOff ? "active" : ""}"
            data-action="debug-encounters"
            aria-pressed="${encountersOff}"
            aria-label="Debug encounters ${encountersOff ? "disabled" : "enabled"}"
          >${encountersOff ? "Enc. Off" : "Enc. On"}</button>
        </div>
      </section>
    `;
    this.bind("[data-action='journal']", "click", actions.journal);
    this.bind("[data-action='party']", "click", actions.party);
    this.bind("[data-action='save']", "click", actions.save);
    this.bind("[data-action='load']", "click", actions.load);
    this.bind("[data-action='map-editor']", "click", actions.mapEditor);
    this.bind("[data-action='debug-encounters']", "click", actions.debugEncounters);
  }

  showDialogue(dialogue, onClose) {
    const layer = document.createElement("section");
    layer.className = "dialogue-layer";
    layer.innerHTML = `
      <div class="dialogue-panel">
        <div class="dialogue-name">${escapeHtml(dialogue.name || "Asterfall")}</div>
        <p class="dialogue-text">${escapeHtml(dialogue.text)}</p>
        <div class="dialogue-actions">
          <button data-close>Continue</button>
        </div>
      </div>
    `;
    this.root.appendChild(layer);
    const close = () => {
      layer.remove();
      onClose?.();
    };
    layer.querySelector("[data-close]").addEventListener("click", close, { once: true });
  }

  showJournal(onClose) {
    const entries = state.journal.map((entry) => `
      <article class="journal-entry">
        <div class="journal-title">Field Note</div>
        <p>${escapeHtml(entry)}</p>
      </article>
    `);
    const codex = state.flags.codex.map((id) => `
      <article class="journal-entry">
        <div class="journal-title">${escapeHtml(CODEX[id].title)}</div>
        <p>${escapeHtml(CODEX[id].text)}</p>
      </article>
    `);
    this.showPanel("Journal", `
      <div class="journal-grid">${[...entries, ...codex].join("")}</div>
    `, onClose);
  }

  showParty(onClose) {
    const rows = state.party.map((member) => `
      <article class="journal-entry">
        <div class="journal-title">${escapeHtml(member.name)} - ${escapeHtml(member.role)}</div>
        <p>HP ${member.hp}/${member.maxHp} | AP ${member.ap}/${member.maxAp} | ATK ${member.attack} | MAG ${member.magic} | DEF ${member.defense} | SPD ${member.speed}</p>
        <p>Arts: ${member.abilities.map((id) => ABILITIES[id]?.name || id).join(", ")}</p>
      </article>
    `);
    const items = Object.entries(state.inventory)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => `${ITEMS[id]?.name || id} x${amount}`)
      .join(", ") || "No items";
    this.showPanel("Party", `
      <div class="journal-grid">${rows.join("")}</div>
      <article class="journal-entry" style="margin-top:.7rem">
        <div class="journal-title">Inventory</div>
        <p>${escapeHtml(items)}</p>
      </article>
    `, onClose);
  }

  showMenu(onClose, actions) {
    const encountersOff = Boolean(state.flags.encountersDisabled);
    this.showPanel("Camp Menu", `
      <div class="menu-grid">
        <button data-menu="journal">Journal</button>
        <button data-menu="party">Party</button>
        <button data-menu="save">Save</button>
        <button data-menu="load" ${hasSave() ? "" : "disabled"}>Load</button>
        <button data-menu="map-editor">Map Edit</button>
        <button
          class="debug-toggle ${encountersOff ? "active" : ""}"
          data-menu="debug-encounters"
          aria-pressed="${encountersOff}"
        >${encountersOff ? "Encounters Off" : "Encounters On"}</button>
        <button data-menu="close">Close</button>
      </div>
    `, onClose, (panel) => {
      panel.querySelector("[data-menu='journal']").addEventListener("click", actions.journal);
      panel.querySelector("[data-menu='party']").addEventListener("click", actions.party);
      panel.querySelector("[data-menu='save']").addEventListener("click", actions.save);
      panel.querySelector("[data-menu='load']").addEventListener("click", actions.load);
      panel.querySelector("[data-menu='map-editor']").addEventListener("click", actions.mapEditor);
      panel.querySelector("[data-menu='debug-encounters']").addEventListener("click", actions.debugEncounters);
      panel.querySelector("[data-menu='close']").addEventListener("click", onClose);
    });
  }

  showMapEditor(editor, actions) {
    const activeKey = `${editor.brush.type}:${editor.brush.value ?? ""}`;
    const terrainButtons = TERRAIN_TOOLS.map((tool) => {
      const key = `terrain:${tool.id}`;
      return `<button class="${activeKey === key ? "active" : ""}" data-brush-type="terrain" data-brush-value="${tool.id}">${escapeHtml(tool.label)}</button>`;
    }).join("");
    const cells = editor.tiles.map((tile) => `
      <button
        class="map-cell terrain-${tile.terrain} ${tile.blocked ? "blocked" : ""} ${tile.override ? "override" : ""} ${tile.current ? "current" : ""}"
        data-map-x="${tile.x}"
        data-map-y="${tile.y}"
        aria-label="${tile.x},${tile.y} ${escapeHtml(tile.label)}${tile.blocked ? " blocked" : ""}"
        title="${tile.x},${tile.y} ${escapeHtml(tile.label)}${tile.blocked ? " blocked" : ""}"
      >${escapeHtml(tile.marker || "")}</button>
    `).join("");

    this.root.innerHTML = `
      <section class="map-editor-layer">
        <div class="map-editor-panel">
          <header class="map-editor-header">
            <div>
              <h2>Map Editor</h2>
              <div class="meta-text">${editor.overrideCount} overrides | Brush: ${escapeHtml(editor.brush.label)}</div>
            </div>
            <div class="map-editor-actions">
              <button data-editor-export>Export</button>
              <button data-editor-import>Import</button>
              <button data-editor-reset>Reset</button>
              <button data-editor-close>Close</button>
            </div>
          </header>
          <div class="map-editor-workspace">
            <aside class="map-editor-tools">
              <div class="tool-group">
                <div class="tool-title">Terrain</div>
                <div class="tool-grid">${terrainButtons}</div>
              </div>
              <div class="tool-group">
                <div class="tool-title">Collision</div>
                <div class="tool-grid">
                  <button class="${activeKey === "block:true" ? "active" : ""}" data-brush-type="block" data-brush-value="true">Block</button>
                  <button class="${activeKey === "block:false" ? "active" : ""}" data-brush-type="block" data-brush-value="false">Open</button>
                  <button class="${activeKey === "erase:" ? "active" : ""}" data-brush-type="erase" data-brush-value="">Erase</button>
                </div>
              </div>
              <div class="tool-group">
                <div class="tool-title">Data</div>
                <textarea spellcheck="false" data-editor-data>${escapeHtml(editor.transferText)}</textarea>
              </div>
            </aside>
            <div class="map-grid-shell">
              <div class="map-grid" style="grid-template-columns: repeat(${editor.width}, 1rem);">${cells}</div>
            </div>
          </div>
        </div>
      </section>
    `;

    this.root.querySelectorAll("[data-brush-type]").forEach((button) => {
      button.addEventListener("click", () => {
        actions.setBrush(button.dataset.brushType, button.dataset.brushValue);
      });
    });
    this.root.querySelector("[data-editor-close]").addEventListener("click", actions.close);
    this.root.querySelector("[data-editor-export]").addEventListener("click", () => actions.export(this.root.querySelector("[data-editor-data]")));
    this.root.querySelector("[data-editor-import]").addEventListener("click", () => actions.import(this.root.querySelector("[data-editor-data]").value));
    this.root.querySelector("[data-editor-reset]").addEventListener("click", actions.reset);

    let painting = false;
    const paint = (target) => {
      if (!target?.matches?.("[data-map-x]")) return;
      actions.paint(Number(target.dataset.mapX), Number(target.dataset.mapY));
    };
    const grid = this.root.querySelector(".map-grid");
    grid.addEventListener("pointerdown", (event) => {
      painting = true;
      event.preventDefault();
      paint(event.target);
    });
    grid.addEventListener("pointerover", (event) => {
      if (painting) paint(event.target);
    });
    window.addEventListener("pointerup", () => {
      painting = false;
    }, { once: true });
  }

  showPanel(title, html, onClose, afterMount) {
    const layer = document.createElement("section");
    layer.className = "pause-layer";
    layer.innerHTML = `
      <div class="pause-panel">
        <div class="member-top">
          <h2>${escapeHtml(title)}</h2>
          <button data-close>Close</button>
        </div>
        ${html}
      </div>
    `;
    this.root.appendChild(layer);
    const close = () => {
      layer.remove();
      onClose?.();
    };
    layer.querySelector("[data-close]").addEventListener("click", close);
    layer.addEventListener("click", (event) => {
      if (event.target === layer) close();
    });
    afterMount?.(layer.querySelector(".pause-panel"));
  }

  showBattle(engine, callbacks) {
    const active = engine.active();
    const isPlayerTurn = active?.side === "party";
    const commands = isPlayerTurn ? this.renderCommands(engine, active) : `<p class="meta-text">${escapeHtml(active?.name || "Enemy")} is acting...</p>`;
    const targets = isPlayerTurn && this.battleSelection ? this.renderTargets(engine, active) : this.renderBattleLog(engine);
    this.root.innerHTML = `
      <section class="battle-layer">
        <div></div>
        <div class="battle-layout">
          <section class="battle-panel battle-party-panel">
            <h2 class="battle-title">Party</h2>
            <div class="battle-roster">${engine.party.map((unit) => this.renderCombatant(unit)).join("")}</div>
          </section>
          <section class="battle-panel battle-enemy-panel">
            <h2 class="battle-title">${escapeHtml(engine.encounter.name)}</h2>
            <div class="battle-roster">${engine.enemies.map((unit) => this.renderCombatant(unit, true)).join("")}</div>
          </section>
          <section class="battle-panel battle-command-panel">
            <h2 class="battle-title">${isPlayerTurn ? `${escapeHtml(active.name)}: Command` : "Battle Log"}</h2>
            ${commands}
            ${targets}
          </section>
        </div>
        <div class="battle-tooltip" role="tooltip" hidden></div>
      </section>
    `;
    if (isPlayerTurn) this.bindBattleControls(engine, active, callbacks);
  }

  renderCombatant(unit, reveal = false) {
    const status = unit.statuses.map((entry) => entry.id).join(", ") || "steady";
    const weak = reveal || unit.scanned ? ` | weak: ${unit.weak.join(", ") || "none"}` : "";
    return `
      <article class="combatant-card">
        <div class="battle-row">
          <div>
            <strong>${escapeHtml(unit.name)}</strong>
            <div class="meta-text">${escapeHtml(status)}${escapeHtml(weak)}</div>
          </div>
          <div class="small-label">HP ${unit.hp}/${unit.maxHp}</div>
        </div>
        <div class="battle-resource-row">
          <span><strong>HP</strong> ${unit.hp}/${unit.maxHp}</span>
          <span><strong>AP</strong> ${unit.ap}/${unit.maxAp}</span>
        </div>
        <div class="bar" aria-label="HP"><div class="bar-fill hp" style="width:${pct(unit.hp, unit.maxHp)}%"></div></div>
        <div class="bar" aria-label="AP"><div class="bar-fill ap" style="width:${pct(unit.ap, unit.maxAp)}%"></div></div>
      </article>
    `;
  }

  renderCommands(engine, active) {
    const abilities = engine.availableAbilities(active);
    const abilityButtons = abilities.map((ability) => {
      const disabled = engine.canUse(active, ability) ? "" : "disabled";
      const tooltip = `${ability.name}\nCost: ${ability.cost} AP\n${ability.text}`;
      return `<button data-select="ability" data-id="${ability.id}" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}" ${disabled}><strong>${escapeHtml(ability.name)}</strong><span class="command-meta">${ability.cost} AP</span></button>`;
    });
    const items = Object.entries(state.inventory)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => {
        const item = ITEMS[id];
        const tooltip = `${item.name}\nOwned: ${amount}\n${item.text}`;
        return `<button data-select="item" data-id="${id}" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}"><strong>${escapeHtml(item.name)}</strong><span class="command-meta">x${amount}</span></button>`;
      });
    return `
      <div class="battle-command-grid">
        ${abilityButtons.join("")}
        ${items.join("")}
        <button data-action="guard" data-tooltip="Guard&#10;Reduce incoming damage and draw enemy attention until the next turn." aria-label="Guard. Reduce incoming damage and draw enemy attention until the next turn."><strong>Guard</strong><span class="command-meta">Defend</span></button>
      </div>
    `;
  }

  renderTargets(engine, active) {
    const descriptor = this.battleSelection.type === "ability"
      ? engine.getAbility(this.battleSelection.id)
      : ITEMS[this.battleSelection.id];
    const targets = engine.validTargets(active, descriptor);
    return `
      <h2 class="battle-title" style="margin-top:.8rem">Target</h2>
      <div class="target-list">
        ${targets.map((target) => `
          <button class="target-row" data-target="${target.uid}">
            <strong>${escapeHtml(target.name)}</strong>
            <span class="small-label">${target.hp}/${target.maxHp}</span>
          </button>
        `).join("")}
        <button data-cancel-target>Cancel</button>
      </div>
    `;
  }

  renderBattleLog(engine) {
    return `
      <div class="battle-log">
        ${engine.log.map((entry) => `<div class="log-row">${escapeHtml(entry)}</div>`).join("")}
      </div>
    `;
  }

  bindBattleControls(engine, active, callbacks) {
    this.root.querySelectorAll("[data-select]").forEach((button) => {
      button.addEventListener("click", () => {
        this.battleSelection = {
          type: button.dataset.select,
          id: button.dataset.id
        };
        const descriptor = this.battleSelection.type === "ability" ? engine.getAbility(this.battleSelection.id) : ITEMS[this.battleSelection.id];
        if (descriptor.target === "self") {
          callbacks.act({ type: this.battleSelection.type, id: this.battleSelection.id, targetId: active.uid });
          this.battleSelection = null;
          return;
        }
        this.showBattle(engine, callbacks);
        this.scrollBattleTargetsIntoView();
      });
    });
    this.root.querySelector("[data-action='guard']")?.addEventListener("click", () => callbacks.guard());
    this.bindCommandTooltips();
    this.root.querySelectorAll("[data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const selection = this.battleSelection;
        this.battleSelection = null;
        callbacks.act({ type: selection.type, id: selection.id, targetId: button.dataset.target });
      });
    });
    this.root.querySelector("[data-cancel-target]")?.addEventListener("click", () => {
      this.battleSelection = null;
      this.showBattle(engine, callbacks);
    });
  }

  toast(text) {
    let stack = this.root.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      this.root.appendChild(stack);
    }
    const item = document.createElement("div");
    item.textContent = text;
    stack.prepend(item);
    window.setTimeout(() => item.remove(), 2600);
  }

  bind(selector, event, handler) {
    const element = this.root.querySelector(selector);
    if (element) element.addEventListener(event, handler);
  }

  scrollBattleTargetsIntoView() {
    window.requestAnimationFrame(() => {
      const panel = this.root.querySelector(".battle-command-panel");
      const targetList = this.root.querySelector(".target-list");
      if (panel && targetList) panel.scrollTop = panel.scrollHeight;
    });
  }

  bindCommandTooltips() {
    const buttons = this.root.querySelectorAll(".battle-command-grid [data-tooltip]");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", (event) => this.showBattleTooltip(button, event));
      button.addEventListener("mousemove", (event) => this.showBattleTooltip(button, event));
      button.addEventListener("focus", () => this.showBattleTooltip(button));
      button.addEventListener("mouseleave", () => this.hideBattleTooltip());
      button.addEventListener("blur", () => this.hideBattleTooltip());
    });
  }

  showBattleTooltip(button, event = null) {
    const tooltip = this.root.querySelector(".battle-tooltip");
    if (!tooltip) return;
    tooltip.textContent = button.dataset.tooltip || "";
    tooltip.hidden = false;
    tooltip.classList.add("visible");

    window.requestAnimationFrame(() => {
      const rect = button.getBoundingClientRect();
      const pointerX = event?.clientX ?? rect.left + rect.width / 2;
      const pointerY = event?.clientY ?? rect.top;
      const margin = 10;
      let left = pointerX + 14;
      let top = pointerY - tooltip.offsetHeight - 14;

      if (left + tooltip.offsetWidth + margin > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - margin;
      }
      if (top < margin) {
        top = pointerY + 18;
      }

      tooltip.style.left = `${Math.max(margin, left)}px`;
      tooltip.style.top = `${Math.min(window.innerHeight - tooltip.offsetHeight - margin, top)}px`;
    });
  }

  hideBattleTooltip() {
    const tooltip = this.root.querySelector(".battle-tooltip");
    if (!tooltip) return;
    tooltip.classList.remove("visible");
    tooltip.hidden = true;
  }
}
