import { Artist, Vex, VexTab } from "vextab";

export function renderVexTab(
  container: HTMLElement,
  source: string,
  options: { foregroundColor?: string } = {},
): void {
  container.replaceChildren();

  const Renderer = Vex.Flow.Renderer;
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  const artist = new Artist(10, 10, 550, { scale: 0.8 });
  const tab = new VexTab(artist);

  try {
    tab.parse(source);
    artist.render(renderer);
  } catch (error) {
    console.error("VexTab rendering failed", error);
    container.textContent = "Unable to render this VexTab block.";
    return;
  }

  const foregroundColor = options.foregroundColor ?? "#1f1f1f";
  const svg = container.querySelector<SVGElement>("svg");
  if (!svg) {
    return;
  }

  svg.querySelectorAll<SVGElement>("text, a, g").forEach((element) => {
    if (element.textContent?.toLowerCase().includes("vexflow.com")) {
      element.remove();
    }
  });

  const fillElements = svg.querySelectorAll<SVGElement>(
    "path, text, tspan, polygon, circle, ellipse, rect",
  );
  fillElements.forEach((element) => {
    if (element.getAttribute("fill") !== "none") {
      element.style.setProperty("fill", foregroundColor, "important");
    }
  });

  const strokeElements = svg.querySelectorAll<SVGElement>(
    "path, line, polyline, polygon, circle, ellipse, rect",
  );
  strokeElements.forEach((element) => {
    const hasStrokeAttribute = element.hasAttribute("stroke");
    const isLineElement = ["line", "polyline"].includes(
      element.tagName.toLowerCase(),
    );
    if (
      (hasStrokeAttribute || isLineElement) &&
      element.getAttribute("stroke") !== "none"
    ) {
      element.style.setProperty("stroke", foregroundColor, "important");
    }
  });
}