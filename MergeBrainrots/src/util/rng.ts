export interface WeightedItem<T> {
  readonly value: T;
  readonly weight: number;
}

export function randInt(min: number, maxExclusive: number): number {
  return Math.floor(Math.random() * (maxExclusive - min)) + min;
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error("pickRandom: empty array");
  return items[randInt(0, items.length)]!;
}

export function pickWeighted<T>(items: readonly WeightedItem<T>[]): T {
  if (items.length === 0) throw new Error("pickWeighted: empty array");
  let total = 0;
  for (const it of items) total += it.weight;
  if (total <= 0) throw new Error("pickWeighted: total weight is zero");
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1]!.value;
}
