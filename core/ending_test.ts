import { assert, assertEquals } from "@std/assert";
import { apply, CAPSTONE, newGame } from "./mod.ts";
import { RECIPES } from "./recipes.ts";

const capstone = RECIPES.find((recipe) => recipe.name === CAPSTONE)!;

Deno.test("a finished game takes no more commands", () => {
  const state = newGame(121);
  state.inventory = { ...capstone.inputs };
  const events = apply(state, { type: "craft", recipe: CAPSTONE });
  assert(events.at(-1)?.type === "ended");
  const snapshot = JSON.parse(JSON.stringify(state));

  for (
    const command of [
      { type: "move", direction: "north" },
      { type: "move", direction: "south" },
      { type: "move", direction: "east" },
      { type: "move", direction: "west" },
      { type: "gather" },
      { type: "craft", recipe: "axe" },
      { type: "craft", recipe: CAPSTONE },
    ] as const
  ) {
    assertEquals(apply(state, command), []);
  }
  assertEquals(state, snapshot);
});
