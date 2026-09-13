import { renderVexTab, type VexTabColors } from "./renderer";

const source = `options space=20
tabstave notation=true key=A time=4/4
notes :q =|: (5/2.5/3.7/4) :8 7-5h6/3 :q 7V/4 |`;

const notation = document.querySelector<HTMLElement>("#notation");
const toggle = document.querySelector<HTMLButtonElement>("#theme-toggle");

if (!notation || !toggle) {
  throw new Error("The demo page is missing required elements.");
}

const lightColors: VexTabColors = {
  foregroundColor: "#1f1f1f",
  backgroundColor: "#ffffff",
};

const darkColors: VexTabColors = {
  foregroundColor: "#f5f5f5",
  backgroundColor: "#1d1d1d",
};

let isDark = false;

function applyTheme(): void {
  const colors = isDark ? darkColors : lightColors;
  document.body.style.backgroundColor = colors.backgroundColor;
  document.body.style.color = colors.foregroundColor;
  void renderVexTab(notation!, source, colors);
}

toggle.addEventListener("click", () => {
  isDark = !isDark;
  applyTheme();
});

applyTheme();
