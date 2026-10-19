import { h } from "../ui/dom.js";
// Slider rotulado: devolve { el, valor() }
export function slider({ rotulo, min, max, passo, valor, formato = (v) => v, aoMudar }) {
  const out = h("output", {}, formato(valor));
  const inp = h("input", { type: "range", min, max, step: passo, value: valor, "aria-label": rotulo });
  inp.addEventListener("input", () => { out.textContent = formato(Number(inp.value)); aoMudar(Number(inp.value)); });
  return { el: h("div", { class: "controle" }, h("div", { class: "rot" }, h("span", {}, rotulo), out), inp), valor: () => Number(inp.value) };
}
export const leitura = (pares) => h("div", { class: "leitura" }, pares.map(([r, v]) => h("div", {}, h("span", { class: "ajuda" }, r), h("b", {}, v))));
