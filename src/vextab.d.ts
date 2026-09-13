declare module "vextab" {
  import type { Renderer } from "vexflow";

  export class Artist {
    constructor(
      x: number,
      y: number,
      width: number,
      options?: { scale?: number },
    );
    render(renderer: Renderer): void;
  }

  export class VexTab {
    constructor(artist: Artist);
    parse(source: string): void;
  }
}
