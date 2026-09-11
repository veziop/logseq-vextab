# logseq-vextab
A Logseq plugging for writing music notation and guitar tabs.

## Current milestone

The project currently contains a small browser renderer. It takes VexTab text,
parses it with VexTab, and draws the result as SVG through VexFlow.

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

Open the local URL printed by Vite. The example notation is defined in
`src/main.ts`. The reusable rendering function is in `src/renderer.ts`.

## Project structure

```text
src/
├── main.ts       # Temporary browser demo entry point
├── renderer.ts   # VexTab text -> SVG rendering
└── vextab.d.ts   # TypeScript declarations for VexTab's JS package
```

The next step is to add a separate Logseq entry point. It should read a chosen
block's VexTab text and call `renderVexTab` in a Logseq-provided container. The
renderer should remain independent of Logseq so it can continue to be tested
in the browser.
