declare module "vextab" {
  export const Vex: {
    Flow: {
      Renderer: {
        new (element: HTMLElement, backend: unknown): unknown;
        Backends: { SVG: unknown };
      };
    };
  };

  export class Artist {
    constructor(x: number, y: number, width: number, options?: { scale?: number });
    render(renderer: unknown): void;
  }

  export class VexTab {
    constructor(artist: Artist);
    parse(source: string): void;
  }
}