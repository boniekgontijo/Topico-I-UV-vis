import { h, limpar } from "../ui/dom.js";
import { topo } from "../aluno/menu.js";

const SIMS = [
  ["beer", "🧪", "Lei de Beer", "ε, b e c → A e %T"],
  ["conjugacao", "🌈", "Conjugação e cor", "Do eteno ao β-caroteno"],
  ["deslocamentos", "↔️", "Bato, hipso, hiper, hipo", "Como a banda se move"],
  ["curva", "📏", "Curva analítica", "Padrões, reta, resíduos"],
  ["woodward", "🧮", "Woodward-Fieser", "Calcule o λmáx"],
];

export async function telaSimuladores(el, aluno, qual) {
  const sim = SIMS.find(([k]) => k === qual);
  if (!sim) {
    return limpar(el, topo(aluno, "#menu"), h("h1", {}, "📈 Simuladores"),
      h("ul", { class: "lista" }, SIMS.map(([k, ic, t, sub]) => h("li", {}, h("a", { href: `#sim/${k}` },
        h("span", {}, `${ic} `, h("b", {}, t), h("br"), h("small", { class: "ajuda" }, sub)), h("span", {}, "→"))))));
  }
  const area = h("div", { class: "cartao" });
  limpar(el, topo(aluno, "#sim"), area);
  (await import(`./${sim[0]}.js`)).montar(area);
}
