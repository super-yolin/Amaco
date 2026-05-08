import BezierEasing from 'bezier-easing';
import type { EasingFn, EasingInput, EasingName } from './types';

export const linear: EasingFn = (t) => t;

const PRESETS: Record<EasingName, EasingFn> = {
  linear,
  ease: BezierEasing(0.25, 0.1, 0.25, 1),
  'ease-in': BezierEasing(0.42, 0, 1, 1),
  'ease-out': BezierEasing(0, 0, 0.58, 1),
  'ease-in-out': BezierEasing(0.42, 0, 0.58, 1),
  'u-speed': (x) => 4 * x ** 3 - 6 * x ** 2 + 3 * x,
};

export function resolveEasing(input?: EasingInput): EasingFn {
  if (input === undefined) return linear;
  if (typeof input === 'function') return input;
  if (typeof input === 'string') return PRESETS[input as EasingName] ?? linear;
  if (Array.isArray(input) && input.length >= 4) {
    return BezierEasing(input[0], input[1], input[2], input[3]);
  }
  return linear;
}
