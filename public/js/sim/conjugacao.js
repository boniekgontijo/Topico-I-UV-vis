import { h, limpar } from "../ui/dom.js";
import { lambdaPolieno, corComplementar, banda, energiaKJmol } from "../core/uvvis.js";
import { formatarNumeroBR } from "../core/correcao.js";
import { grafico, amostrar } from "./grafico.js";
import { slider, leitura } from "./comum.js";

const ESTRUTURA = { 1: "eteno", 2: "butadieno", 3: "hexatrieno", 11: "beta_caroteno" };
const NOME = { 1: "eteno", 2: "1,3-butadieno", 3: "1,3,5-hexatrieno", 11: "β-caroteno" };

export function montar(el) {
  const graf = h("div"), info = h("div"), niveis = h("div"), img = h("div", { class: "centro" });
  const g = grafico(graf, { xmin: 150, xmax: 600, ymax: 1.2 });
  const atualizar = (n) => {
    const lam = lambdaPolieno(n), cor = corComplementar(lam);
    const eps = Math.min(1.1, 0.35 + n * 0.07);
    g.desenhar([{ pontos: amostrar((l) => banda(l, lam, eps, 22 + n * 2), 150, 600), cor: "#FF0000" }]);
    g.marcarX(lam, "#FF0000", `${lam} nm`);
    const gap = energiaKJmol(lam);
    const altura = 20 + (gap / 700) * 110;
    limpar(niveis, h("div", { style: { display: "flex", alignItems: "center", gap: "14px" } },
      h("div", { style: { width: "110px", flex: "none" }, html:
        `<svg viewBox="0 0 120 156" width="110"><line x1="20" y1="${140 - altura}" x2="100" y2="${140 - altura}" stroke="#0070C0" stroke-width="4"/>
         <text x="60" y="${132 - altura}" font-size="11" text-anchor="middle" fill="#0070C0">LUMO (π*)</text>
         <line x1="20" y1="140" x2="100" y2="140" stroke="#000099" stroke-width="4"/>
         <text x="60" y="152" font-size="11" text-anchor="middle" fill="#000099">HOMO (π)</text>
         <line x1="60" y1="136" x2="60" y2="${146 - altura}" stroke="#FF0000" stroke-width="2.5"/></svg>` }),
      h("div", {}, h("b", {}, `ΔE ≈ ${formatarNumeroBR(Math.round(gap))} kJ/mol`), h("p", { class: "ajuda" }, "Mais conjugação → gap menor → λ maior."))));
    const arq = ESTRUTURA[n];
    limpar(img, arq ? h("img", { src: `conteudo/uvvis/img/${arq}.png`, alt: NOME[n], style: { maxHeight: "110px" } }) : h("p", { class: "ajuda" }, `polieno com ${n} C=C conjugadas`));
    limpar(info, h("div", { class: "lado" },
      h("div", { class: "amostra-cor", style: { background: cor.hexObservada } }),
      h("div", {}, h("b", {}, NOME[n] ?? `${n} C=C conjugadas`),
        h("p", { class: "ajuda" }, lam < 400 ? `λmáx ${lam} nm: absorve no UV → incolor.` : `λmáx ${lam} nm: absorve ${cor.absorvida} → vemos ${cor.observada}.`))),
      leitura([["C=C", n], ["λmáx", `${lam} nm`], ["cor vista", cor.observada]]),
      n >= 4 && n <= 10 ? h("p", { class: "ajuda" }, "Valores entre 3 e 11 duplas são interpolados (aproximação didática).") : null);
  };
  limpar(el, h("h2", {}, "Conjugação e cor"),
    h("p", { class: "ajuda" }, "Aumente o número de ligações C=C conjugadas: do eteno ao β-caroteno."),
    slider({ rotulo: "Número de C=C conjugadas", min: 1, max: 11, passo: 1, valor: 1, aoMudar: atualizar }).el,
    img, info, graf, niveis);
  atualizar(1);
}
