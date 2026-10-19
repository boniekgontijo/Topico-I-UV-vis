import { h, limpar } from "../ui/dom.js";
import { banda } from "../core/uvvis.js";
import { grafico, amostrar } from "./grafico.js";

const EFEITOS = {
  bato: { nome: "Batocrômico", cor: "#FF0000", dl: 40, fa: 1, txt: "Deslocamento para λ MAIOR (vermelho): a energia da transição diminui. Ex.: conjugação, auxocromo +M." },
  hipso: { nome: "Hipsocrômico", cor: "#0070C0", dl: -40, fa: 1, txt: "Deslocamento para λ MENOR (azul): a energia da transição aumenta. Ex.: n→π* em solvente polar, efeito −I." },
  hiper: { nome: "Hipercrômico", cor: "#7030A0", dl: 0, fa: 1.5, txt: "Aumento de ε (banda mais alta): a transição fica mais provável. Não muda a energia." },
  hipo: { nome: "Hipocrômico", cor: "#7030A0", dl: 0, fa: 0.6, txt: "Diminuição de ε (banda mais baixa): a transição fica menos provável." },
};

export function montar(el) {
  const graf = h("div"), legenda = h("div", { class: "cartao" });
  const g = grafico(graf, { xmin: 200, xmax: 450, ymax: 1.2 });
  const base = { pontos: amostrar((l) => banda(l, 280, 0.6, 22), 200, 450), cor: "#9AA3B8", tracejado: true, rotulo: "" };
  const mostrar = (k) => {
    if (!k) { g.desenhar([{ ...base, tracejado: false, cor: "#1B1B1F" }]); g.marcarX(280, "#5C6070", "280 nm");
      return limpar(legenda, h("p", { class: "ajuda" }, "Toque num efeito. Horizontal (λ) = energia; vertical (ε) = intensidade.")); }
    const e = EFEITOS[k];
    const lam = 280 + e.dl, A = 0.6 * e.fa;
    g.desenhar([base, { pontos: amostrar((l) => banda(l, lam, A, 22), 200, 450), cor: e.cor }]);
    if (e.dl) g.seta(280, 0.63, lam, 0.63, e.cor); else g.seta(280, 0.6, 280, A, e.cor);
    g.marcarX(lam, e.cor, `${lam} nm`);
    limpar(legenda, h("h3", { style: { color: e.cor } }, e.nome), h("p", {}, e.txt));
  };
  limpar(el, h("h2", {}, "Bato, hipso, hiper, hipo"),
    h("p", { class: "ajuda" }, "Banda original tracejada (λmáx 280 nm)."), graf,
    h("div", { class: "botoes" }, Object.entries(EFEITOS).map(([k, e]) =>
      h("button", { class: "btn", style: { background: e.cor }, onclick: () => mostrar(k) }, e.nome)),
      h("button", { class: "btn sec", onclick: () => mostrar(null) }, "Original")),
    legenda);
  mostrar(null);
}
