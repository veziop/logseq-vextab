import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);

const VEXTAB_ENTRY_ID = "\0vextab-source";
const VEXFLOW_ENTRY_ID = "\0vexflow-entry";

// vextab's package `main` is a prebuilt webpack bundle carrying its own full copy
// of vexflow (and every music font). Build vextab from its shipped TypeScript
// source instead, so it shares this project's single vexflow instance.
function vextabFromSource(): Plugin {
  return {
    name: "vextab-from-source",
    enforce: "pre",
    resolveId(id) {
      return id === "vextab" ? VEXTAB_ENTRY_ID : null;
    },
    load(id) {
      if (id !== VEXTAB_ENTRY_ID) {
        return null;
      }
      return [
        'export { default as Artist } from "vextab/src/artist";',
        'export { default as VexTab } from "vextab/src/vextab";',
      ].join("\n");
    },
    transform(code, id) {
      if (!id.endsWith(".jison")) {
        return null;
      }
      const { Generator } = require("jison");
      const parser: string = new Generator(code, {
        moduleType: "js",
        moduleName: "parser",
      }).generate();
      return {
        code: [
          'import * as __vextabUtils from "./utils";',
          parser.replace('require("./utils")', "__vextabUtils"),
          "export default parser;",
        ].join("\n"),
        map: null,
      };
    },
  };
}

// vexflow's default entry inlines six music fonts as base64 strings in JS. Use
// the font-less core build and load only the fonts actually used (the same set
// as vexflow's own "bravura" entry) from separate .woff2 files instead.
const VEXFLOW_FONTS = [
  { family: "Bravura", module: "bravura", descriptors: { display: "block" } },
  {
    family: "Academico",
    module: "academico",
    descriptors: { display: "swap" },
  },
  {
    family: "Academico",
    module: "academicobold",
    descriptors: { display: "swap", weight: "bold" },
  },
];

function readVexFlowFontDataUrl(module: string): string {
  const fontsDir = join(
    dirname(require.resolve("vexflow")),
    "../esm/src/fonts",
  );
  const source = readFileSync(join(fontsDir, `${module}.js`), "utf8");
  const match = source.match(/'(data:font\/woff2;[^']+)'/);
  if (!match) {
    throw new Error(`Could not find embedded font data in ${module}.js`);
  }
  return match[1];
}

function vexflowWithFontFiles(): Plugin {
  let isBuild = false;
  return {
    name: "vexflow-with-font-files",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      return id === "vexflow" ? VEXFLOW_ENTRY_ID : null;
    },
    load(id) {
      if (id !== VEXFLOW_ENTRY_ID) {
        return null;
      }
      const loads = VEXFLOW_FONTS.map(({ family, module, descriptors }) => {
        const dataUrl = readVexFlowFontDataUrl(module);
        let url = JSON.stringify(dataUrl);
        if (isBuild) {
          const referenceId = this.emitFile({
            type: "asset",
            name: `${module}.woff2`,
            source: Buffer.from(dataUrl.split(",", 2)[1], "base64"),
          });
          url = `import.meta.ROLLUP_FILE_URL_${referenceId}`;
        }
        return `Font.load(${JSON.stringify(family)}, ${url}, ${JSON.stringify(descriptors)})`;
      });
      return [
        'import VexFlow, { Font } from "vexflow/core";',
        `Promise.allSettled([${loads.join(", ")}]);`,
        'VexFlow.setFonts("Bravura", "Academico");',
        'export * from "vexflow/core";',
        "export default VexFlow;",
      ].join("\n");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [vextabFromSource(), vexflowWithFontFiles()],
  // The dev pre-bundler doesn't run the .jison transform above.
  optimizeDeps: { exclude: ["vextab"] },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        plugin: "index.html",
        demo: "demo.html",
      },
    },
  },
});
