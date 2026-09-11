# logseq-vextab
A Logseq plugging for writing music notation and guitar tabs.

## Current milestone

The project currently contains a small renderer. It takes VexTab text, parses
it with VexTab, and draws the result as SVG through VexFlow.

The important separation is:

```text
VexTab text -> renderer.ts -> SVG element
```

Logseq is not involved in this first step. That makes the notation engine easy
to test before connecting it to Logseq's editor and page model.

## Prerequisites

Install Node.js 22 LTS. Node is needed to develop and build the plugin; users
of the finished plugin will receive the generated bundle and do not need Node.

Install dependencies and build the project:

```bash
npm install
npm run build
```

To view the renderer in a browser during development:

```bash
npm run dev
```

Open the local URL printed by Vite and add `/demo.html` to it. The example
notation is defined in `src/demo.ts`. The reusable rendering function is in
`src/renderer.ts`.

The plugin entry is `src/main.ts`. To test it in Logseq, build the project and
use Logseq Desktop's developer mode to load the project directory as an
unpacked plugin. Then use the command palette to run `Show VexTab preview`, or
type `/Insert VexTab example` in a block.

The slash command inserts this format, which Logseq renders through the
experimental fenced-code renderer API:

````markdown
```vextab
tabstave notation=true
notes 4-5-6/3 ## | 5-4-2/3 2/2
```
````

## Project structure

```text
src/
├── main.ts       # Logseq plugin entry point
├── demo.ts       # Standalone browser demo entry point
├── renderer.ts   # VexTab text -> SVG rendering
└── vextab.d.ts   # TypeScript declarations for VexTab's JS package
```

The renderer remains independent of Logseq so it can continue to be tested in
the browser. The Logseq-specific fenced-code integration is in `src/main.ts`.
