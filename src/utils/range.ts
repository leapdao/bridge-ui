export const range = (s: number, e: number) =>
  Array.from(new Array(e - s + 1), (_, i) => i + s);
