declare module 'color-string' {
  type RGBA = [number, number, number, number];

  const get: {
    (str: string): { model: string; value: RGBA } | null;
    rgb(str: string): RGBA | null;
    hsl(str: string): RGBA | null;
  };

  const to: {
    hex(rgba: RGBA): string;
    rgb(rgba: RGBA): string;
    hsl(hsla: RGBA): string;
  };

  export { get, to };
}
