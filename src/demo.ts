import { renderVexTab } from "./renderer";

const notation = document.querySelector<HTMLElement>("#notation");

if (!notation) {
  throw new Error("The notation container is missing.");
}

renderVexTab(
  notation,
  `options space=20
tabstave notation=true key=A time=4/4
notes :q =|: (5/2.5/3.7/4) :8 7-5h6/3 :q 7V/4 |`,
);