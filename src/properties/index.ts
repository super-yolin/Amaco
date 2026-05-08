import { toPx, buildLengthInterpolator } from './length';
import { buildColorInterpolator } from './color';
import { buildNumberInterpolator } from './number';

export type PropType = 'length' | 'color' | 'number';
export type Interpolator = (t: number) => string;

const LENGTH_PROPS = new Set([
  'width', 'height', 'top', 'left', 'right', 'bottom',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'fontSize', 'lineHeight', 'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'letterSpacing', 'wordSpacing',
]);

const COLOR_PROPS = new Set([
  'backgroundColor', 'color', 'borderColor', 'outlineColor', 'textDecorationColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
]);

const NUMBER_PROPS = new Set(['opacity', 'zIndex', 'flexGrow', 'flexShrink', 'fontWeight']);

export function getPropType(key: string): PropType | null {
  if (LENGTH_PROPS.has(key)) return 'length';
  if (COLOR_PROPS.has(key)) return 'color';
  if (NUMBER_PROPS.has(key)) return 'number';
  return null;
}

export function readComputedValue(key: string, element: HTMLElement): string {
  return (getComputedStyle(element)[key as keyof CSSStyleDeclaration] as string) ?? '';
}

export function resolveValue(element: HTMLElement, key: string, value: string): string {
  if (getPropType(key) === 'length') return toPx(element, key, value);
  return value;
}

export function buildInterpolator(
  key: string,
  from: string,
  to: string
): Interpolator | null {
  const type = getPropType(key);
  if (!type) return null;

  if (type === 'length') {
    return buildLengthInterpolator(from, to);
  }
  if (type === 'color') {
    try {
      return buildColorInterpolator(from, to);
    } catch {
      return null;
    }
  }
  if (type === 'number') {
    return buildNumberInterpolator(parseFloat(from) || 0, parseFloat(to) || 0);
  }
  return null;
}
