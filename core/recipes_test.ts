import { assert, assertEquals } from "@std/assert";
import { missingFor, newGame, type Recipe } from "./mod.ts";
import { RECIPES } from "./recipes.ts";
import { apply } from "./rules.ts";
import { YIELDS } from "./terrain.ts";

const [first] = RECIPES;

function withInputs(recipe: Recipe) {
  const state = newGame(121);
  state.inventory = { ...recipe.inputs };
  return state;
}

Deno.test("a ready craft spends inputs and adds the output", () => {
  const state = withInputs(first);

  const events = apply(state, { type: "craft", recipe: first.name });

  for (const item of Object.keys(first.inputs)) {
    assertEquals(state.inventory[item] ?? 0, 0, `${item} should be spent`);
  }
  assertEquals(
    state.inventory[first.output.item],
    first.output.count,
    `${first.output.item} should be made`,
  );
  assert(events[0].type === "crafted");
  assertEquals(events[0].recipe, first.name);
  assertEquals(events[0].output, first.output);
});

Deno.test("the crafted event keeps copies while state moves on", () => {
  const state = withInputs(first);

  const [event] = apply(state, { type: "craft", recipe: first.name });
  assert(event.type === "crafted");
  const kept = event.inventory;

  state.inventory[first.inputs ? Object.keys(first.inputs)[0] : ""] = 99;

  assert(kept !== state.inventory);
  assertEquals(kept[first.output.item], first.output.count);
});

Deno.test("a failed craft changes nothing and says why", () => {
  const state = newGame(121);
  const snapshot = JSON.parse(JSON.stringify(state));

  const events = apply(state, { type: "craft", recipe: first.name });

  assertEquals(state, snapshot);
  assert(events[0].type === "lacked");
  assertEquals(events[0].recipe, first.name);
  assertEquals(events[0].missing, first.inputs);
  assertEquals(missingFor(state, first), first.inputs);
});

Deno.test("every recipe input has a source", () => {
  const sources = new Set<string>();
  for (const item of Object.values(YIELDS)) {
    if (item !== null) sources.add(item);
  }
  for (const recipe of RECIPES) {
    sources.add(recipe.output.item);
  }

  for (const recipe of RECIPES) {
    for (const item of Object.keys(recipe.inputs)) {
      assert(
        sources.has(item),
        `${recipe.name} needs ${item}, but nothing gathers or makes it`,
      );
    }
  }
});
