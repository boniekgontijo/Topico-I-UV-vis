import { h, limpar } from "../ui/dom.js";
import { absorbancia, percentT, banda } from "../core/uvvis.js";
import { formatarNumeroBR } from "../core/correcao.js";
import { grafico, amostrar } from "./grafico.js";
import { slider, leitura } from "./comum.js";

export function montar(el) {
  let eps = 15000, b = 1, c = 3e-5;
  const cubeta = h("div");
  const nums = h("div");
  const graf = h("div");
  const g = grafico(graf, { ymax: 1.6 });
  const fmtC = (v) => formatarNumeroBR(v) + " mol L⁻¹";
  const atualizar = () => {
    const A = absorbancia(eps, b, c), T = percentT(A);
    g.desenhar([{ pontos: amostrar((l) => banda(l, 450, A, 35)), cor: "#F7931E" }]);
    g.marcarX(450, "#5C6070", "450 nm");
    const larg = Math.min(100, 20 + b * 16);
    limpar(cubeta, h("div", { class: "ajuda" }, "Feixe de 450 nm atravessando a cubeta"),
      h("div", { style: { display: "flex", alignItems: "center", gap: "6px", height: "54px" } },
        h("div", { style: { flex: 1, height: "14px", background: "#2E5BD8", borderRadius: "7px" } }),
        h("div", { style: { width: `${larg}px`, height: "50px", border: "3px solid #9AA3B8", borderRadius: "4px",
          background: `rgba(247,147,30,${Math.min(0.9, 0.08 + A * 0.55)})` } }),
        h("div", { style: { flex: 1, height: "14px", background: "#2E5BD8", opacity: Math.max(0.05, T / 100), borderRadius: "7px" } })));
    limpar(nums, h("p", { class: "centro" }, h("span", { class: "eq" }, `A = εbc = ${formatarNumeroBR(eps)} × ${formatarNumeroBR(b)} × ${formatarNumeroBR(c)} = ${formatarNumeroBR(A)}`)),
      leitura([["A", formatarNumeroBR(A)], ["%T", formatarNumeroBR(T) + " %"], ["absorvida", formatarNumeroBR(100 - T) + " %"]]),
      A > 1 ? h("p", { class: "aviso" }, "A > 1: fora da faixa de trabalho (0,1–1,0). Dilua a amostra ou use cubeta menor.") :
      A < 0.1 ? h("p", { class: "aviso", style: { color: "var(--hipso)" } }, "A < 0,1: sinal baixo, mais incerteza.") : null);
  };
  limpar(el, h("h2", {}, "Lei de Beer"),
    h("p", { class: "ajuda" }, "Mexa em ε, b e c e veja a absorbância e a luz transmitida."),
    cubeta, nums,
    slider({ rotulo: "ε (L mol⁻¹ cm⁻¹)", min: 1000, max: 50000, passo: 500, valor: eps, formato: formatarNumeroBR, aoMudar: (v) => { eps = v; atualizar(); } }).el,
    slider({ rotulo: "b (cm)", min: 0.1, max: 5, passo: 0.1, valor: b, formato: formatarNumeroBR, aoMudar: (v) => { b = v; atualizar(); } }).el,
    slider({ rotulo: "c", min: 0, max: 1e-4, passo: 1e-6, valor: c, formato: fmtC, aoMudar: (v) => { c = v; atualizar(); } }).el,
    graf);
  atualizar();
}
