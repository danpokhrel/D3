export type Recipe = {
  name: string;
  inputs: Record<string, number>;
  output: { item: string; count: number };
};

export const RECIPES: Recipe[] = [
  { name: "axe", inputs: { stone: 1 }, output: { item: "axe", count: 1 } },
  {
    name: "torch",
    inputs: { wood: 2, stone: 1 },
    output: { item: "torch", count: 1 },
  },
  {
    name: "lockpick",
    inputs: { stone: 1, wood: 1 },
    output: { item: "lockpick", count: 1 },
  },
  {
    name: "magic catalyst",
    inputs: { lockpick: 1, torch: 1, "mana crystal": 2 },
    output: { item: "magic catalyst", count: 1 },
  },
];

export function recipeNamed(name: string): Recipe | null {
  return RECIPES.find((recipe) => recipe.name === name) ?? null;
}
