import {
  BARRIERS,
  type Cell,
  cellKey,
  type GameEvent,
  type GameState,
  terrainAt,
} from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;
    case "blocked": {
      const needs = BARRIERS[event.terrain];
      return `blocked by ${event.terrain}${needs ? `: needs ${needs}` : ""}`;
    }
    case "gathered":
      return `Gathered ${event.item} (you have ${event.count})`;
    case "crafted": {
      const made = event.output;
      const amount = made.count > 1 ? `${made.count} ` : "";
      return `Made ${amount}${made.item} from ${summarize(event.inputs)}`;
    }
    case "lacked":
      return `Cannot make ${event.recipe}: need ${summarize(event.missing)}`;
    case "refused":
      return `Cannot make ${event.recipe}: you would be trapped in ${event.terrain}`;
    case "ended":
      return `The ${event.item} is forged. The dungeon's heart stills. You have won.`;
  }
}

function summarize(needed: Record<string, number>): string {
  return Object.entries(needed)
    .map(([item, count]) => `${count} ${item}`)
    .join(", ");
}

// The message line's color: a warning for refusals, a highlight for gains.
function toneOf(event: GameEvent): string {
  switch (event.type) {
    case "blocked":
    case "lacked":
    case "refused":
      return "warn";
    case "gathered":
    case "crafted":
    case "ended":
      return "good";
    default:
      return "";
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;

  private readonly gathered = new Set<string>();

  private here: Cell;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.here = { ...state.player };
    this.showPosition();
    // Safe to read state here: nothing has played yet.
    this.showInventory({ ...state.inventory });
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    element("live").className = toneOf(event);
    if (event.type === "moved") {
      this.here = { ...event.to };
      this.showPosition();
    }
    if (event.type === "gathered") {
      this.gathered.add(cellKey(event.at));
      this.showPosition();
      this.showInventory(event.inventory);
    }
    if (event.type === "crafted") {
      this.showInventory(event.inventory);
    }
    if (event.type === "ended") {
      // The core said the game is over; the banner only shows it.
      element("banner").hidden = false;
    }
  }

  private showPosition() {
    const { x, y } = this.here;
    element("position").textContent = `${x}, ${y}`;
    const terrain = terrainAt(this.seed, x, y);
    const spent = this.gathered.has(cellKey(this.here));
    element("terrain").textContent = `${terrain}${spent ? " (spent)" : ""}`;
  }

  // One plain line per item, from the event's own copy, never from state.
  private showInventory(inventory: Record<string, number>) {
    const rows = Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([item, count]) => {
        const row = document.createElement("li");
        row.textContent = count > 1 ? `${item} ×${count}` : item;
        return row;
      });
    if (rows.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Nothing yet";
      rows.push(empty);
    }
    element("inventory").replaceChildren(...rows);
  }
}
