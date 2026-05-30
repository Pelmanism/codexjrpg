import { ABILITIES, CODEX, ITEMS, PARTY, QUESTS } from "./data.js";
import { hasSave, objectiveText, state } from "./state.js";

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
        </div>
      </section>
    `;
    this.bind("[data-action='journal']", "click", actions.journal);
    this.bind("[data-action='party']", "click", actions.party);
    this.bind("[data-action='save']", "click", actions.save);
    this.bind("[data-action='load']", "click", actions.load);
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
    this.showPanel("Camp Menu", `
      <div class="menu-grid">
        <button data-menu="journal">Journal</button>
        <button data-menu="party">Party</button>
        <button data-menu="save">Save</button>
        <button data-menu="load" ${hasSave() ? "" : "disabled"}>Load</button>
        <button data-menu="close">Close</button>
      </div>
    `, onClose, (panel) => {
      panel.querySelector("[data-menu='journal']").addEventListener("click", actions.journal);
      panel.querySelector("[data-menu='party']").addEventListener("click", actions.party);
      panel.querySelector("[data-menu='save']").addEventListener("click", actions.save);
      panel.querySelector("[data-menu='load']").addEventListener("click", actions.load);
      panel.querySelector("[data-menu='close']").addEventListener("click", onClose);
    });
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
          <div class="small-label">${unit.hp}/${unit.maxHp}</div>
        </div>
        <div class="bar"><div class="bar-fill hp" style="width:${pct(unit.hp, unit.maxHp)}%"></div></div>
      </article>
    `;
  }

  renderCommands(engine, active) {
    const abilities = engine.availableAbilities(active);
    const abilityButtons = abilities.map((ability) => {
      const disabled = engine.canUse(active, ability) ? "" : "disabled";
      return `<button data-select="ability" data-id="${ability.id}" ${disabled}><strong>${escapeHtml(ability.name)}</strong><br /><span class="meta-text">${ability.cost} AP - ${escapeHtml(ability.text)}</span></button>`;
    });
    const items = Object.entries(state.inventory)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => `<button data-select="item" data-id="${id}"><strong>${escapeHtml(ITEMS[id].name)} x${amount}</strong><br /><span class="meta-text">${escapeHtml(ITEMS[id].text)}</span></button>`);
    return `
      <div class="battle-command-grid">
        ${abilityButtons.join("")}
        ${items.join("")}
        <button data-action="guard"><strong>Guard</strong><br /><span class="meta-text">Reduce damage and draw fire.</span></button>
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
}
