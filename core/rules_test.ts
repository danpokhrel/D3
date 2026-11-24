import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  apply,
  type GameState,
  isPassable,
  newGame,
  terrainAt,
} from "./mod.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

// A state with the player just west of a cell that is, or is not, passable.
// Searching keeps these tests honest if the terrain formula changes.
function besideEasternCell(passable: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isPassable(terrainAt(SEED, x, 0), {});
    const east = isPassable(terrainAt(SEED, x + 1, 0), {});
    if (here && east === passable) {
      const state = newGame(SEED);
      state.player = { x, y: 0 };
      return state;
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

// A state with the player on a beach cell, found by searching outward from the
// origin so the test does not depend on the map layout.
function onBeach(): GameState {
  for (let r = 0; r < 50; r++) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (terrainAt(SEED, x, y) === "beach") {
          const state = newGame(SEED);
          state.player = { x, y };
          return state;
        }
      }
    }
  }
  throw new Error("Found no beach cell near the origin.");
}

Deno.test("moving onto passable terrain moves the player", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: x + 1, y });
  assertEquals(events, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
  }]);
});

Deno.test("a blocked move changes nothing and reports why", () => {
  const state = besideEasternCell(false);
  const snapshot = JSON.parse(JSON.stringify(state));
  const { x, y } = state.player;
  const target = { x: x + 1, y };

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state, snapshot);
  assertEquals(events, [{
    type: "blocked",
    at: { x, y },
    toward: target,
    terrain: terrainAt(SEED, target.x, target.y),
  }]);
});

Deno.test("an event keeps its cells while state moves on", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const first = apply(state, { type: "move", direction: "east" });
  const second = apply(state, { type: "move", direction: "west" });
  apply(state, { type: "move", direction: "east" });

  // Both retained events still report the cells from when they happened, even
  // though state.player has since changed.
  assertEquals(first, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
  }]);
  assertEquals(second, [{
    type: "moved",
    from: { x: x + 1, y },
    to: { x, y },
  }]);
});

Deno.test("gather recieves copy of state", () => {
  const state = besideEasternCell(true);

  const [event] = apply(state, { type: "gather" });
  assert(event.type === "gathered");
  const kept = event.inventory;

  apply(state, { type: "move", direction: "east" });
  const [nextEvent] = apply(state, { type: "gather" });
  assert(nextEvent.type === "gathered");
  const check = nextEvent.inventory;

  assertNotEquals(kept, check);
});

Deno.test("a failed gather changes nothing", () => {
  // Given a cell that has already been gathered
  const state = onBeach();
  const first = apply(state, { type: "gather" });
  assertEquals(first.length, 1);
  const snapshot = JSON.parse(JSON.stringify(state));

  // When the player gathers there again
  const events = apply(state, { type: "gather" });

  // Then nothing happens and nothing changes
  assertEquals(events, []);
  assertEquals(state, snapshot);
});
