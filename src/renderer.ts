import { Renderer, type RenderContext } from "vexflow";
import { Artist, VexTab } from "vextab";

// vextab bundles its own internal copy of vexflow (rather than sharing the one
// this file imports), so mutating vexflow's exported metrics objects directly
// has no effect on what vextab actually draws - element sizes/colors have to be
// adjusted on the rendered SVG itself instead, after render() runs.
const ARTIST_SCALE = 0.8;

export interface VexTabColors {
  foregroundColor: string;
  backgroundColor: string;
}

const DEFAULT_COLORS: VexTabColors = {
  foregroundColor: "#1f1f1f",
  backgroundColor: "#ffffff",
};

export async function renderVexTab(
  container: HTMLElement,
  source: string,
  colors: VexTabColors = DEFAULT_COLORS,
): Promise<void> {
  // VexFlow loads its music font (noteheads, clefs, etc.) asynchronously via the
  // FontFace API, registering it on *this* document's font set. In Logseq, the
  // fenced-code-renderer container actually lives in the host app's top-level
  // document (registerFencedCodeRenderer's React/ReactDOM come from window.top),
  // not this plugin iframe's document - so the font also has to be registered on
  // the container's own document, or the browser painting that document never
  // sees it and silently drops every glyph-based element (clef, noteheads, the
  // "TAB" label), while plain vector paths and fallback-font digits still show.
  const targetDocument = container.ownerDocument ?? document;
  if (targetDocument !== document) {
    for (const fontFace of document.fonts) {
      targetDocument.fonts.add(fontFace);
    }
  }
  await targetDocument.fonts.ready;

  container.replaceChildren();

  const { foregroundColor, backgroundColor } = colors;

  // The container is always a <div> in practice (created by this plugin's own
  // Logseq/demo integration code); VexFlow's types just narrow it to HTMLDivElement.
  const renderer = new Renderer(
    container as HTMLDivElement,
    Renderer.Backends.SVG,
  );

  // Set colors on the render context *before* drawing so every element VexFlow
  // draws - noteheads, stems, bar lines, and the small background-colored
  // rectangles it erases behind tab fret numbers - uses the right color natively.
  const context: RenderContext = renderer.getContext();
  context.setBackgroundFillStyle(backgroundColor);
  context.setFillStyle(foregroundColor);
  context.setStrokeStyle(foregroundColor);

  const artist = new Artist(10, 10, 550, { scale: ARTIST_SCALE });
  const tab = new VexTab(artist);

  try {
    tab.parse(source);
    artist.render(renderer);
  } catch (error) {
    console.error("VexTab rendering failed", error);
    container.textContent = "Unable to render this VexTab block.";
    return;
  }

  const svg = container.querySelector<SVGElement>("svg");
  if (!svg) {
    return;
  }

  // Keep the canvas itself transparent so the block blends into whatever
  // background Logseq's current theme paints behind it, rather than stamping its
  // own opaque rectangle on top. The small erase-rectangles VexFlow draws behind
  // tab fret numbers still use setBackgroundFillStyle(backgroundColor) above, so
  // those digits stay legible against the theme background.
  svg.style.background = "transparent";

  svg.querySelectorAll<SVGElement>("text, a, g").forEach((element) => {
    if (element.textContent?.toLowerCase().includes("vexflow.com")) {
      element.remove();
    }
  });

  // Note stems (and beams) are the "vertical lines" attached to each notehead.
  // VexFlow - via vextab's bundled copy - writes a hardcoded stroke="black" onto
  // both the root <svg> (its default, which beams inherit) and every individual
  // stem group, ignoring the foreground color we set on the render context. On a
  // dark theme that renders every stem and beam as a black line against the dark
  // background. Re-point both at the resolved foreground color so all stroked
  // note geometry follows light/dark mode like the rest of the notation does.
  svg.setAttribute("stroke", foregroundColor);
  svg.querySelectorAll<SVGGElement>("g.vf-stem").forEach((stem) => {
    stem.setAttribute("stroke", foregroundColor);
  });

  // Barlines are drawn as a hairline rect exactly 1 unit wide *before* the
  // ARTIST_SCALE (0.8) shrink is applied - so its width attribute always reads
  // "1" (never fractional) even though it paints at a sub-pixel 0.8 device
  // pixels wide, which the browser anti-aliases into a faint gray blend with
  // the background instead of the solid foreground color every other element
  // gets. Compensate for the scale directly so it paints at a full device pixel.
  const minBarlineWidth = 1 / ARTIST_SCALE;
  svg
    .querySelectorAll<SVGRectElement>("g.vf-stavebarline rect")
    .forEach((rect) => {
      const width = Number(rect.getAttribute("width"));
      if (width > 0 && width < minBarlineWidth) {
        rect.setAttribute("width", minBarlineWidth.toString());
      }
    });

  // vextab bundles its own internal copy of vexflow's metrics, so overriding
  // this package's exported font-size defaults has no effect (see note above) -
  // bump the rendered tab fret-number text directly instead.
  svg.querySelectorAll<SVGTextElement>("g.vf-tabnote text").forEach((text) => {
    if (/^\d+$/.test(text.textContent?.trim() ?? "")) {
      text.setAttribute("font-size", "13pt");
    }
  });
}
