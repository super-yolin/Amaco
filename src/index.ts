import { Amaco } from './Amaco';
export type {
  AnimatableProps,
  EasingFn,
  EasingInput,
  EasingName,
  Condition,
  StartCallback,
  CompleteCallback,
  UpdateCallback,
  PlayState,
} from './types';
export { resolveEasing } from './easing';
export { Amaco };

export default function amaco(element?: HTMLElement): Amaco {
  const instance = new Amaco();
  if (element) instance.target(element);
  return instance;
}
