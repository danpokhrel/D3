export type Recipe = {
  name: string;
  inputs: Record<string, number>;
  output: { item: string; count: number };
};

export const CAPSTONE = "heart of the dungeon";

export const RECIPES: Recipe[] = [
  { name: "axe", inputs: { stone: 2 }, output: { item: "axe", count: 1 } },
  {
    name: "torch",
    inputs: { wood: 2, stone: 3 },
    output: { item: "torch", count: 1 },
  },
  {
    name: "lockpick",
    inputs: { stone: 10, wood: 10 },
    output: { item: "lockpick", count: 1 },
  },
  {
    name: "magic catalyst",
    inputs: { lockpick: 1, torch: 2, "mana crystal": 2 },
    output: { item: "magic catalyst", count: 1 },
  },
  {
    name: CAPSTONE,
    inputs: { "core shard": 3, "mana crystal": 10, torch: 1 },
    output: { item: CAPSTONE, count: 1 },
  },
];

export function recipeNamed(name: string): Recipe | null {
  return RECIPES.find((recipe) => recipe.name === name) ?? null;
}
