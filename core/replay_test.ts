import { assert, assertEquals } from "@std/assert";
import { apply, type Command, type GameEvent, newGame } from "./mod.ts";
import run from "./run.json" with { type: "json" };

function play() {
  const state = newGame(run.seed);
  const events: GameEvent[] = [];
  for (const command of run.commands as Command[]) {
    events.push(...apply(state, command));
  }
  return { state, events };
}

Deno.test("recorded run beats game", () => {
  const { state } = play();
  assert(state.won);
});

Deno.test("replay run twice gives identical state", () => {
  const first = play();
  const start = Date.now();
  while (Date.now() === start);
  const second = play();

  assertEquals(first, second);
});
