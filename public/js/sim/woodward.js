import { h, limpar } from "../ui/dom.js";
import { woodwardFieser } from "../core/uvvis.js";

const TIPOS = {
  "dieno-hetero": { nome: "Dieno acíclico / heteroanular", base: 214, inc: [["extensao", "C=C conjugada adicional", 30], ["alquila", "alquila ou resíduo de anel", 5], ["exociclica", "dupla exocíclica", 5], ["OR", "–OR", 6], ["Cl", "–Cl / –Br", 5], ["NR2", "–NR₂", 60]] },
  "dieno-homo": { nome: "Dieno homoanular", base: 253, inc: [["extensao", "C=C conjugada adicional", 30], ["alquila", "alquila ou resíduo de anel", 5], ["exociclica", "dupla exocíclica", 5], ["OR", "–OR", 6], ["NR2", "–NR₂", 60]] },
  enona: { nome: "Enona (cetona acíclica ou anel de 6)", base: 215, inc: [["alfa", "alquila/resíduo em α", 10], ["beta", "alquila/resíduo em β", 12], ["gamaDelta", "alquila/resíduo em γ ou δ", 18], ["extensao", "C=C conjugada adicional", 30], ["exociclica", "dupla exocíclica", 5], ["homoanular", "componente homoanular", 39]] },
};
const EXEMPLOS = [
  { nome: "2,5-dimetil-2,4-hexadieno", img: "wf_dieno_ex1", tipo: "dieno-hetero", inc: { alquila: 4 }, obs: 241 },
  { nome: "Dieno homoanular (slide 63)", img: "wf_dieno_homo", tipo: "dieno-homo", inc: { alquila: 3, exociclica: 1 }, obs: null },
  { nome: "3-metilciclo-hex-2-enona", img: "wf_enona_ex", tipo: "enona", inc: { beta: 2 }, obs: 234 },
  { nome: "Octalona", img: "wf_enona_ex2", tipo: "enona", inc: { beta: 2, exociclica: 1 }, obs: 241 },
];

export function montar(el) {
  let tipo = "dieno-hetero", inc = {}, exemplo = null;
  const area = h("div");
  const desenhar = () => {
    const t = TIPOS[tipo];
    const lam = woodwardFieser(tipo, inc);
    const partes = [`${t.base}`, ...t.inc.filter(([k]) => inc[k]).map(([k, , v]) => `${inc[k]}×${v}`)];
    limpar(area,
      h("label", { for: "tipo" }, "Valor base"),
      h("select", { id: "tipo", onchange: (e) => { tipo = e.target.value; inc = {}; exemplo = null; desenhar(); } },
        Object.entries(TIPOS).map(([k, v]) => h("option", { value: k, selected: k === tipo }, `${v.nome} — ${v.base} nm`))),
      exemplo ? h("div", { class: "centro" }, h("img", { src: `conteudo/uvvis/img/${exemplo.img}.png`, alt: exemplo.nome, style: { maxHeight: "130px" } }), h("p", { class: "ajuda" }, exemplo.nome)) : null,
      h("div", { class: "cartao" }, t.inc.map(([k, rot, v]) => h("div", { class: "contador" },
        h("span", {}, `${rot} `, h("small", { class: "ajuda" }, `(+${v})`)),
        h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } },
          h("button", { "aria-label": `menos ${rot}`, onclick: () => { inc[k] = Math.max(0, (inc[k] ?? 0) - 1); desenhar(); } }, "−"),
          h("span", { class: "n" }, inc[k] ?? 0),
          h("button", { "aria-label": `mais ${rot}`, onclick: () => { inc[k] = (inc[k] ?? 0) + 1; desenhar(); } }, "+"))))),
      h("p", { class: "centro" }, h("span", { class: "eq" }, `λmáx = ${partes.join(" + ")} = ${lam} nm`)),
      exemplo?.obs ? h("p", { class: "centro ajuda" }, `Observado: ${exemplo.obs} nm (diferença de ${Math.abs(exemplo.obs - lam)} nm)`) : null,
      h("h3", {}, "Exemplos da aula"),
      h("div", { class: "botoes" }, EXEMPLOS.map((ex) => h("button", { class: "btn sec", onclick: () => { exemplo = ex; tipo = ex.tipo; inc = {}; desenhar(); } }, ex.nome))),
      exemplo ? h("p", { class: "ajuda" }, "Monte a soma você mesmo com os botões + e −; depois compare com o observado.") : null);
  };
  limpar(el, h("h2", {}, "Woodward-Fieser"), h("p", { class: "ajuda" }, "λmáx = valor base + Σ incrementos (slides 61–64)."), area);
  desenhar();
}
