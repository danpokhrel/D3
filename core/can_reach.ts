// What can the player ever get? A fixpoint: keep applying the rules until a full
// pass adds nothing. Amounts are ignored, since this asks what is possible, not
// how long it takes. It reads the terrain rows and names no item of its own, so
// it works on any recipe table, including a broken one built for a test.

import type { Recipe } from "./recipes.ts";
import { isPassable, type Terrain, YIELDS } from "./terrain.ts";

const TERRAINS = Object.keys(YIELDS) as Terrain[];

// Items the player could gather while holding one of everything reached so far.
// Asking isPassable keeps "what opens what" in one place: the terrain rows.
function gatherable(reached: ReadonlySet<string>): string[] {
  const holding = Object.fromEntries([...reached].map((item) => [item, 1]));
  const items: string[] = [];
  for (const terrain of TERRAINS) {
    const item = YIELDS[terrain];
    if (item !== null && isPassable(terrain, holding)) items.push(item);
  }
  return items;
}

// Returns the recipes that can never be made, in table order. Empty means every
// recipe can be made.
export function unreachableRecipes(recipes: readonly Recipe[]): Recipe[] {
  // Two collections, kept apart: an item can be reached by gathering while the
  // recipe that also makes it never can be.
  const reached = new Set(gatherable(new Set()));
  const made = new Set<Recipe>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (made.has(recipe)) continue;
      const ready = Object.keys(recipe.inputs).every((item) =>
        reached.has(item)
      );
      if (!ready) continue;
      made.add(recipe);
      reached.add(recipe.output.item);
      // The barrier hook: an output may open terrain, whose items now count.
      for (const item of gatherable(reached)) reached.add(item);
      changed = true;
    }
  }

  return recipes.filter((recipe) => !made.has(recipe));
}
