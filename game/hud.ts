import {
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
    case "blocked":
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}`;
    case "gathered":
      return `Gathered ${event.item} (you have ${event.count})`;
    case "crafted": {
      const made = event.output;
      const amount = made.count > 1 ? `${made.count} ` : "";
      return `Made ${amount}${made.item} from ${summarize(event.inputs)}`;
    }
    case "lacked":
      return `Cannot make ${event.recipe}: need ${summarize(event.missing)}`;
  }
}

function summarize(needed: Record<string, number>): string {
  return Object.entries(needed)
    .map(([item, count]) => `${count} ${item}`)
    .join(", ");
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
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
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
  }

  private showPosition() {
    const { x, y } = this.here;
    element("position").textContent = `${x}, ${y}`;
    const terrain = terrainAt(this.seed, x, y);
    const spent = this.gathered.has(cellKey(this.here));
    element("terrain").textContent = `${terrain}${spent ? " (spent)" : ""}`;
  }

  private showInventory(inventory: Record<string, number>) {
    element("inventory").replaceChildren(
      ...Object.entries(inventory).map(([item, count]) => {
        const row = document.createElement("li");
        row.textContent = `${item}: ${count}`;
        return row;
      }),
    );
  }
}
