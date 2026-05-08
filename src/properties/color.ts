import colorString from 'color-string';

type RGBA = [number, number, number, number];

function parseColor(value: string): RGBA {
  const rgb = colorString.get.rgb(value);
  if (!rgb) throw new Error(`Cannot parse color: "${value}"`);
  return [rgb[0], rgb[1], rgb[2], rgb[3] ?? 1];
}

export function buildColorInterpolator(from: string, to: string): (t: number) => string {
  const [r0, g0, b0, a0] = parseColor(from);
  const [r1, g1, b1, a1] = parseColor(to);
  const dr = r1 - r0, dg = g1 - g0, db = b1 - b0, da = a1 - a0;
  return (t) => `rgba(${r0 + dr * t},${g0 + dg * t},${b0 + db * t},${a0 + da * t})`;
}
