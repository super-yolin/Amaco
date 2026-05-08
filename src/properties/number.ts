export function buildNumberInterpolator(from: number, to: number): (t: number) => string {
  const diff = to - from;
  return (t) => String(from + diff * t);
}
