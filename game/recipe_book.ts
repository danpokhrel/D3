import {
  type Command,
  type GameState,
  missingFor,
  type Recipe,
  RECIPES,
} from "../core/mod.ts";

export class RecipeBook {
  private readonly state: GameState;
  private readonly send: (command: Command) => void;

  private readonly buttons: HTMLButtonElement[] = [];

  constructor(
    list: HTMLElement,
    state: GameState,
    send: (command: Command) => void,
  ) {
    this.state = state;
    this.send = send;

    for (const recipe of RECIPES) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", (event) => {
        this.send({ type: "craft", recipe: recipe.name });
        if (event.detail > 0) button.blur();
      });
      item.appendChild(button);
      list.appendChild(item);
      this.buttons.push(button);
    }
    this.update();
  }

  update() {
    RECIPES.forEach((recipe, index) => {
      this.buttons[index].textContent = this.label(recipe);
    });
  }

  private label(recipe: Recipe): string {
    const missing = missingFor(this.state, recipe);
    const needed = Object.entries(missing)
      .map(([item, count]) => `${count} ${item}`)
      .join(", ");
    return needed === ""
      ? `Make ${recipe.name}`
      : `Make ${recipe.name} (needs ${needed})`;
  }
}
