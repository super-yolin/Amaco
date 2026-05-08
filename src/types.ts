export interface AnimatableProps {
  // Length properties
  width?: string;
  height?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  fontSize?: string;
  lineHeight?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  // Color properties
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  outlineColor?: string;
  textDecorationColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  // Unitless number properties
  opacity?: string | number;
  zIndex?: string | number;
  flexGrow?: string | number;
  flexShrink?: string | number;
  fontWeight?: string | number;
  [key: string]: string | number | undefined;
}

export type EasingName = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'u-speed';
export type EasingFn = (t: number) => number;
export type EasingInput = EasingName | EasingFn | [number, number, number, number];

export interface Condition {
  if: (step: number, progress: number, element: HTMLElement) => boolean;
  do: (step: number, progress: number, element: HTMLElement) => void;
}

export type StartCallback = (element: HTMLElement) => void;
export type CompleteCallback = (element: HTMLElement) => void;
export type UpdateCallback = (progress: number, step: number, element: HTMLElement) => void;

export type PlayState = 'idle' | 'running' | 'paused' | 'finished' | 'cancelled';
