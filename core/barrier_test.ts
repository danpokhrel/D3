import { assert, assertEquals } from "@std/assert";
import {
  apply,
  BARRIERS,
  type GameState,
  newGame,
  type Terrain,
  terrainAt,
  YIELDS,
} from "./mod.ts";

const SEED = 121;

// A state with the player just west of a cell of this terrain. The search
// covers the whole island, not one row, because barriers sit in different
// places on every seed.
function besideEast(terrain: Terrain): GameState {
  for (let y = -60; y <= 60; y++) {
    for (let x = -60; x <= 60; x++) {
      if (terrainAt(SEED, x, y) === terrain) continue;
      if (terrainAt(SEED, x + 1, y) !== terrain) continue;
      const state = newGame(SEED);
      state.player = { x, y };
      return state;
    }
  }
  throw new Error(`Found no cell beside ${terrain}.`);
}

// One set of tests per barrier row with an opener, so a new row is tested
// without a new test.
for (const [terrain, openers] of Object.entries(BARRIERS)) {
  if (openers == null) continue;
  const barrier = terrain as Terrain;

  Deno.test(`${barrier} is shut without ${openers.join(" + ")}`, () => {
    const state = besideEast(barrier);
    const snapshot = JSON.parse(JSON.stringify(state));

    const events = apply(state, { type: "move", direction: "east" });

    assert(events[0].type === "blocked");
    assertEquals(events[0].terrain, barrier);
    assertEquals(state, snapshot);
  });

  Deno.test(`${barrier} opens with ${openers.join(" + ")}, which are kept`, () => {
    const state = besideEast(barrier);
    for (const item of openers) state.inventory[item] = 1;
    const { x, y } = state.player;

    const events = apply(state, { type: "move", direction: "east" });

    assert(events[0].type === "moved");
    assertEquals(state.player, { x: x + 1, y });
    for (const item of openers) assertEquals(state.inventory[item], 1);
  });

  const item = YIELDS[barrier];
  if (item === null) continue;

  Deno.test(`gathering inside ${barrier} gives ${item}`, () => {
    const state = besideEast(barrier);
    for (const item of openers) state.inventory[item] = 1;
    apply(state, { type: "move", direction: "east" });

    const events = apply(state, { type: "gather" });

    assert(events[0]?.type === "gathered");
    assertEquals(events[0].item, item);
  });
}
