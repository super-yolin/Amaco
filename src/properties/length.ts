export function toPx(element: HTMLElement, key: string, value: string): string {
  if (value.endsWith('%')) {
    const parent = (element.offsetParent ?? element.parentElement ?? document.body) as HTMLElement;
    const parentPx = parseFloat(getComputedStyle(parent)[key as keyof CSSStyleDeclaration] as string);
    return `${(parseFloat(value) / 100) * parentPx}px`;
  }
  if (value.endsWith('vw')) {
    return `${(parseFloat(value) / 100) * window.innerWidth}px`;
  }
  if (value.endsWith('vh')) {
    return `${(parseFloat(value) / 100) * window.innerHeight}px`;
  }
  if (value.endsWith('em')) {
    const parent = (element.offsetParent ?? element.parentElement ?? document.body) as HTMLElement;
    const parentFontSize = parseFloat(getComputedStyle(parent).fontSize);
    return `${parseFloat(value) * parentFontSize}px`;
  }
  if (value.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return `${parseFloat(value) * rootFontSize}px`;
  }
  return value;
}

export function buildLengthInterpolator(from: string, to: string): (t: number) => string {
  const a = parseFloat(from);
  const b = parseFloat(to);
  const diff = b - a;
  return (t) => `${a + diff * t}px`;
}
