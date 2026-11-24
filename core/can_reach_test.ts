import { assertEquals } from "@std/assert";
import { type Recipe, RECIPES, unreachableRecipes } from "./mod.ts";

function names(recipes: Recipe[]): string[] {
  return recipes.map((recipe) => recipe.name);
}

Deno.test("every recipe in the real table can be made", () => {
  // The tracer's answer, worked by hand: stone and wood, then the axe, torch
  // and lockpick, which opens the dungeon for mana crystal, then the catalyst,
  // which opens the dungeon core for core shards, then the capstone.
  assertEquals(names(unreachableRecipes(RECIPES)), []);
});

Deno.test("a recipe that needs its own output is unreachable", () => {
  const broken: Recipe[] = [
    ...RECIPES,
    {
      name: "elder relic",
      inputs: { "elder relic": 1, "mana crystal": 1 },
      output: { item: "elder relic", count: 1 },
    },
  ];

  assertEquals(names(unreachableRecipes(broken)), ["elder relic"]);
});

Deno.test("without its opener, what lies behind a barrier is unreachable", () => {
  // Remove the lockpick: the dungeon never opens, so nothing needing mana
  // crystal can be made. This is the barrier hook doing its job.
  const noLockpick = RECIPES.filter((recipe) => recipe.name !== "lockpick");

  assertEquals(names(unreachableRecipes(noLockpick)), [
    "magic catalyst",
    "heart of the dungeon",
  ]);
});
