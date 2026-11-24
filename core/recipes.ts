export type Recipe = {
  name: string;
  inputs: Record<string, number>;
  output: { item: string; count: number };
};

export const CAPSTONE = "heart of the dungeon";

export const RECIPES: Recipe[] = [
  { name: "axe", inputs: { stone: 4 }, output: { item: "axe", count: 1 } },
  {
    name: "torch",
    inputs: { wood: 4, stone: 2 },
    output: { item: "torch", count: 1 },
  },
  {
    name: "lockpick",
    inputs: { stone: 10, wood: 10 },
    output: { item: "lockpick", count: 1 },
  },
  {
    name: "magic catalyst",
    inputs: { lockpick: 1, torch: 4, "mana crystal": 2 },
    output: { item: "magic catalyst", count: 1 },
  },
  {
    name: CAPSTONE,
    inputs: { "core shard": 3, "mana crystal": 2, torch: 1 },
    output: { item: CAPSTONE, count: 1 },
  },
];

export function recipeNamed(name: string): Recipe | null {
  return RECIPES.find((recipe) => recipe.name === name) ?? null;
}
