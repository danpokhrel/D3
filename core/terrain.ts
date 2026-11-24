// The world is a pure function of a seed and coordinates. Nothing here is stored,
// so the world can be effectively unbounded while saved state stays small.

export type Terrain = "beach" | "forest" | "dungeon" | "dungeon core" | "ocean";

const ISLAND_RADIUS = 55;
const TENDRILS = 4;
const TENDRIL_STEPS = 30;
const TENDRIL_STEP = 2;
const TENDRIL_DISC_R = 2.5;
const DUNGEON_MAX_DIST = 44;
const DUNGEON_MIN_DIST = 12;

export function terrainAt(seed: number, x: number, y: number): Terrain {
  const dist = Math.hypot(x, y);
  if (dist > ISLAND_RADIUS) return "ocean";
  const center = dungeonCenter(seed);
  if (Math.abs(x - center.x) <= 1 && Math.abs(y - center.y) <= 1) {
    return "dungeon core";
  }
  for (const disc of dungeonDiscs(seed)) {
    if (Math.hypot(x - disc.x, y - disc.y) <= disc.r) return "dungeon";
  }
  const forestChance = Math.min(1, Math.max(0, (dist - 2) / 4));
  return noise(seed + 2, x, y, 6) < 0.45 * forestChance ? "forest" : "beach";
}

function dungeonCenter(seed: number): { x: number; y: number } {
  const angle = gridValue(seed + 3, 0, 0) * Math.PI * 2;
  const distance = 22 + gridValue(seed + 4, 0, 0) * 8;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
  };
}

function dungeonDiscs(seed: number): { x: number; y: number; r: number }[] {
  const center = dungeonCenter(seed);
  const discs = [{ x: center.x, y: center.y, r: 5 }];
  for (let t = 0; t < TENDRILS; t++) {
    const angle = gridValue(seed + 80 + t, 0, 0) * Math.PI * 2;
    discs.push({
      x: center.x + Math.round(Math.cos(angle) * 2.5),
      y: center.y + Math.round(Math.sin(angle) * 2.5),
      r: 4,
    });
  }
  for (let t = 0; t < TENDRILS; t++) {
    let x = center.x;
    let y = center.y;
    let heading = gridValue(seed + 100 + t, 0, 0) * Math.PI * 2;
    for (let i = 0; i < TENDRIL_STEPS; i++) {
      heading += (gridValue(seed + 30 + t * TENDRIL_STEPS + i, 0, 0) - 0.5) *
        1.2;
      const nextX = x + Math.cos(heading) * TENDRIL_STEP;
      const nextY = y + Math.sin(heading) * TENDRIL_STEP;
      const nextDist = Math.hypot(nextX, nextY);
      if (nextDist > DUNGEON_MAX_DIST || nextDist < DUNGEON_MIN_DIST) continue;
      x = nextX;
      y = nextY;
      discs.push({ x, y, r: TENDRIL_DISC_R });
    }
  }
  return discs;
}

// Type Object: one row per terrain, saying what gathering there gives.
export const YIELDS: Record<Terrain, string | null> = {
  beach: "stone",
  forest: "wood",
  dungeon: "mana crystal",
  "dungeon core": "core shard",
  ocean: null,
};

// Type Object: terrain you cannot enter with bare hands, and the held item that
// lets you in. null means nothing opens it. A terrain not listed is always open.
// Holding the opener keeps the way open; entering does not spend it.
export const BARRIERS: Partial<Record<Terrain, string[] | null>> = {
  ocean: null,
  forest: ["axe"],
  dungeon: ["lockpick", "torch"],
  "dungeon core": ["magic catalyst", "lockpick", "torch"],
};

// May the player enter this terrain, holding this inventory?
export function isPassable(
  terrain: Terrain,
  inventory: Record<string, number>,
): boolean {
  if (!(terrain in BARRIERS)) return true;
  const openers = BARRIERS[terrain];
  return openers != null &&
    openers.every((item) => (inventory[item] ?? 0) > 0);
}

// Value noise: random numbers at coarse grid points, blended between them, so
// that terrain forms regions instead of static.
function noise(seed: number, x: number, y: number, scale: number): number {
  const left = Math.floor(x / scale);
  const top = Math.floor(y / scale);
  const blendX = smooth(x / scale - left);
  const blendY = smooth(y / scale - top);
  return mix(
    mix(gridValue(seed, left, top), gridValue(seed, left + 1, top), blendX),
    mix(
      gridValue(seed, left, top + 1),
      gridValue(seed, left + 1, top + 1),
      blendX,
    ),
    blendY,
  );
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// A hash, not a generator: the same inputs give the same number in [0, 1), with
// no memory of earlier calls.
function gridValue(seed: number, x: number, y: number): number {
  let hash = Math.imul(seed, 0x9e3779b1) ^ Math.imul(x, 0x85ebca6b) ^
    Math.imul(y, 0xc2b2ae35);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);
  return ((hash ^ (hash >>> 15)) >>> 0) / 2 ** 32;
}
