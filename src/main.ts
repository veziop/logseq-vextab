import "@logseq/libs";

const exampleVexTab = `tabstave notation=true
notes 4-5-6/3 ## | 5-4-2/3 2/2`;

type VexTabRenderer = (
  container: HTMLElement,
  source: string,
  options?: { foregroundColor?: string },
) => void;

type ThemeMode = "light" | "dark";

function foregroundForTheme(mode: ThemeMode): string {
  const fallback = mode === "dark" ? "#f5f5f5" : "#1f1f1f";
  return `var(--ls-primary-text-color, ${fallback})`;
}

async function main(): Promise<void> {
  const notation = document.querySelector<HTMLElement>("#notation");
  let currentThemeMode: ThemeMode = "light";

  if (!notation) {
    throw new Error("The notation container is missing.");
  }

  logseq.Editor.registerSlashCommand("Insert VexTab example", async () => {
    await logseq.Editor.insertAtEditingCursor(
      `\`\`\`vextab\n${exampleVexTab}\n\`\`\``,
    );
  });

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
          color: foregroundForTheme(currentThemeMode),
          overflowX: "auto",
        },
        ref: async (container: HTMLElement | null) => {
          if (!container) {
            return;
          }

          try {
            rendererPromise ??= import("./renderer");
            const { renderVexTab } = await rendererPromise;
            renderVexTab(container, content, {
              foregroundColor: foregroundForTheme(currentThemeMode),
            });
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

      renderVexTab(notation, exampleVexTab, {
        foregroundColor: foregroundForTheme(currentThemeMode),
      });
      logseq.showMainUI({ autoFocus: false });
    },
  );

  logseq.setMainUIInlineStyle({
    backgroundColor: "var(--ls-primary-background-color)",
    color: foregroundForTheme(currentThemeMode),
    padding: "24px",
  });

  const applyTheme = ({ mode }: { mode: ThemeMode }): void => {
    currentThemeMode = mode;
    const foregroundColor = foregroundForTheme(mode);
    document.documentElement.style.setProperty(
      "--vextab-foreground",
      foregroundColor,
    );
    notation.style.color = foregroundColor;
    logseq.setMainUIInlineStyle({ color: foregroundColor });
  };

  const userConfigs = await logseq.App.getUserConfigs();
  applyTheme({ mode: userConfigs.preferredThemeMode as ThemeMode });
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