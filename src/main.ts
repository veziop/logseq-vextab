import "@logseq/libs";

const exampleVexTab = `tabstave notation=true
notes 4-5-6/3 ## | 5-4-2/3 2/2`;

type ThemeMode = "light" | "dark";

interface VexTabColors {
  foregroundColor: string;
  backgroundColor: string;
}

// Resolve Logseq's theme CSS variables to concrete color values (rather than
// passing raw `var(...)` strings into the renderer) so the colors baked into the
// generated SVG are self-contained and don't depend on `var()` support inside SVG
// presentation attributes.
function resolveThemeVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function colorsForTheme(mode: ThemeMode): VexTabColors {
  const fallback =
    mode === "dark"
      ? { foregroundColor: "#f5f5f5", backgroundColor: "#1d1d1d" }
      : { foregroundColor: "#1f1f1f", backgroundColor: "#ffffff" };

  return {
    foregroundColor: resolveThemeVar(
      "--ls-primary-text-color",
      fallback.foregroundColor,
    ),
    backgroundColor: resolveThemeVar(
      "--ls-primary-background-color",
      fallback.backgroundColor,
    ),
  };
}

async function main(): Promise<void> {
  const notation = document.querySelector<HTMLElement>("#notation");
  let currentThemeMode: ThemeMode = "light";

  if (!notation) {
    throw new Error("The notation container is missing.");
  }

  // Every container we've rendered a vextab block into, keyed to its source, so we
  // can redraw them with new colors when Logseq's theme changes. Entries whose
  // container has been removed from the DOM are pruned on each theme change.
  const renderedBlocks = new Map<HTMLElement, string>();

  logseq.Editor.registerSlashCommand("Insert VexTab example", async () => {
    await logseq.Editor.insertAtEditingCursor(
      `\`\`\`vextab\n${exampleVexTab}\n\`\`\``,
    );
  });

  logseq.Editor.registerSlashCommand("Blank VexTab", [
    [
      "editor/input",
      "```vextab\ntabstave notation=false \n```",
      { "backward-pos": 4 },
    ],
  ]);

  let rendererPromise: Promise<typeof import("./renderer")> | undefined;

  logseq.Experiments.registerFencedCodeRenderer("vextab", {
    edit: false,
    before: async () => {
      rendererPromise ??= import("./renderer");
      await rendererPromise;
    },
    render: ({ content }) => {
      const React = logseq.Experiments.React as {
        createElement: (
          type: string,
          props: Record<string, unknown>,
        ) => unknown;
      };

      return React.createElement("div", {
        style: {
          overflowX: "auto",
        },
        ref: async (container: HTMLElement | null) => {
          if (!container) {
            return;
          }

          renderedBlocks.set(container, content);

          try {
            rendererPromise ??= import("./renderer");
            const { renderVexTab } = await rendererPromise;
            await renderVexTab(
              container,
              content,
              colorsForTheme(currentThemeMode),
            );
          } catch (error) {
            console.error("VexTab rendering failed", error);
            container.textContent = "Unable to render this VexTab block.";
          }
        },
      });
    },
  });

  logseq.App.registerCommandPalette(
    {
      key: "show-vextab-preview",
      label: "Show VexTab preview",
    },
    async () => {
      const { renderVexTab } = await import("./renderer");

      renderedBlocks.set(notation, exampleVexTab);
      await renderVexTab(
        notation,
        exampleVexTab,
        colorsForTheme(currentThemeMode),
      );
      logseq.showMainUI({ autoFocus: false });
    },
  );

  const applyTheme = async ({ mode }: { mode: ThemeMode }): Promise<void> => {
    currentThemeMode = mode;
    const colors = colorsForTheme(mode);

    logseq.setMainUIInlineStyle({
      backgroundColor: colors.backgroundColor,
      color: colors.foregroundColor,
      padding: "24px",
    });

    const { renderVexTab } = await import("./renderer");

    for (const [container, content] of renderedBlocks) {
      if (!container.isConnected) {
        renderedBlocks.delete(container);
        continue;
      }

      try {
        await renderVexTab(container, content, colors);
      } catch (error) {
        console.error("VexTab re-render failed", error);
      }
    }
  };

  const userConfigs = await logseq.App.getUserConfigs();
  await applyTheme({ mode: userConfigs.preferredThemeMode as ThemeMode });
  const offThemeModeChanged = logseq.App.onThemeModeChanged(applyTheme);

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    logseq.hideMainUI({ restoreEditingCursor: true });
  };

  document.addEventListener("keydown", handleKeyDown, true);
  logseq.beforeunload(async () => {
    document.removeEventListener("keydown", handleKeyDown, true);
    offThemeModeChanged();
  });
}

logseq.ready(main).catch(console.error);
