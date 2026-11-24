// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import { isPassable, type Terrain, terrainAt, YIELDS } from "./terrain.ts";
import { CAPSTONE, type Recipe, recipeNamed } from "./recipes.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;

  inventory: Record<string, number>;

  changed: Record<string, "gathered">;

  won: boolean;
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command =
  | { type: "move"; direction: Direction }
  | { type: "gather" }
  | { type: "craft"; recipe: string };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | {
    type: "gathered";
    at: Cell;
    item: string;
    count: number;
    inventory: Record<string, number>;
  }
  | {
    type: "crafted";
    recipe: string;
    inputs: Record<string, number>;
    output: { item: string; count: number };
    inventory: Record<string, number>;
  }
  | {
    type: "lacked";
    recipe: string;
    missing: Record<string, number>;
  }
  | { type: "ended"; item: string };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return {
    seed,
    player: { x: 0, y: 0 },
    inventory: {},
    changed: {},
    won: false,
  };
}

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

// The single way in. It updates the state it is given and returns the events.
export function cellNow(
  state: GameState,
  cell: Cell,
): { terrain: Terrain; gathered: boolean } {
  return {
    terrain: terrainAt(state.seed, cell.x, cell.y),
    gathered: state.changed[cellKey(cell)] === "gathered",
  };
}

export function missingFor(
  state: GameState,
  recipe: Recipe,
): Record<string, number> {
  const missing: Record<string, number> = {};
  for (const [item, needed] of Object.entries(recipe.inputs)) {
    const have = state.inventory[item] ?? 0;
    if (have < needed) missing[item] = needed - have;
  }
  return missing;
}

export function apply(state: GameState, command: Command): GameEvent[] {
  if (state.won) return [];
  switch (command.type) {
    case "move":
      return move(state, command.direction);
    case "gather":
      return gather(state);
    case "craft":
      return craft(state, command.recipe);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain, state.inventory)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

function gather(state: GameState): GameEvent[] {
  const at = { ...state.player };

  const { terrain, gathered } = cellNow(state, at);
  const item = YIELDS[terrain];
  if (item === null || gathered) return [];
  state.changed[cellKey(at)] = "gathered";
  const count = (state.inventory[item] ?? 0) + 1;
  state.inventory[item] = count;

  const inventory = { ...state.inventory };
  return [{ type: "gathered", at, item, count, inventory }];
}

function craft(state: GameState, name: string): GameEvent[] {
  const recipe = recipeNamed(name);
  if (!recipe) return [];

  const missing = missingFor(state, recipe);
  if (Object.keys(missing).length > 0) {
    return [{ type: "lacked", recipe: recipe.name, missing }];
  }

  for (const [item, count] of Object.entries(recipe.inputs)) {
    state.inventory[item] -= count;
    if (state.inventory[item] === 0) delete state.inventory[item];
  }
  state.inventory[recipe.output.item] =
    (state.inventory[recipe.output.item] ?? 0) + recipe.output.count;

  const events: GameEvent[] = [{
    type: "crafted",
    recipe: recipe.name,
    inputs: { ...recipe.inputs },
    output: { ...recipe.output },
    inventory: { ...state.inventory },
  }];

  if (recipe.name === CAPSTONE) {
    state.won = true;
    events.push({ type: "ended", item: recipe.output.item });
  }
  return events;
}
