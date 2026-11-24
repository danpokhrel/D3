import { assertEquals } from "@std/assert";
import {
  apply,
  type GameState,
  newGame,
  type Terrain,
  terrainAt,
} from "./mod.ts";
import { recipeNamed } from "./recipes.ts";

const SEED = 121;

function standingOn(terrain: Terrain): GameState {
  for (let y = -60; y <= 60; y++) {
    for (let x = -60; x <= 60; x++) {
      if (terrainAt(SEED, x, y) === terrain) {
        const game = newGame(SEED);
        game.player = { x, y };
        return game;
      }
    }
  }
  throw new Error(`No ${terrain} terrain found within +60 of origin coords`);
}

Deno.test("spending your last lockpick in the dungeon is refused", () => {
  const state = standingOn("dungeon");
  const recipe = recipeNamed("magic catalyst")!;
  state.inventory = { ...recipe.inputs };
  const snapshot = JSON.parse(JSON.stringify(state));

  const events = apply(state, { type: "craft", recipe: recipe.name });

  assertEquals(events, [{
    type: "refused",
    recipe: recipe.name,
    terrain: "dungeon",
  }]);
  assertEquals(state, snapshot);
});

Deno.test("spending your last lockpick in the dungeon core is refused", () => {
  const state = standingOn("dungeon core");
  const recipe = recipeNamed("magic catalyst")!;
  state.inventory = { ...recipe.inputs };
  state.inventory["magic catalyst"] = 1;
  const snapshot = JSON.parse(JSON.stringify(state));

  const events = apply(state, { type: "craft", recipe: recipe.name });

  assertEquals(events, [{
    type: "refused",
    recipe: recipe.name,
    terrain: "dungeon core",
  }]);
  assertEquals(state, snapshot);
});

Deno.test("spending your last lockpick on the beach is allowed", () => {
  const state = standingOn("beach");
  const recipe = recipeNamed("magic catalyst")!;
  state.inventory = { ...recipe.inputs };

  const events = apply(state, { type: "craft", recipe: recipe.name });

  assertEquals(events[0].type, "crafted");
  assertEquals(state.inventory["lockpick"] ?? 0, 0);
  assertEquals(state.inventory["magic catalyst"], 1);
});
