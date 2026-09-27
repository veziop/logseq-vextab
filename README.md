# logseq-vextab

A Logseq plugging for writing music notation and guitar tabs. This plugin uses the FOSS [VexTab](https://vexflow.com/vextab/).

Follow the official tutorial [here](https://vexflow.com/vextab/tutorial.html)

*Note*: only tested in Logseq OG (markdown version).

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

## Installation into Logseq

Once the software has been cloned/download and built with npm, all you need to do is:
1. enable the developer mode in the application settings (*Settings > Advanced > Developer mode*)
2. open the plugins window and click *Load unpacked plugin*
3. select the *root of this project* (not the dist/ directory)

## Roadmap

The next goal is to get this plugin listed on the official marketplace. Timing is uncertain, though: [Logseq DB beta shipped in mid-2026](), and how that affects the marketplace submission process isn't clear yet.