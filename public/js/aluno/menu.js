import { h, limpar } from "../ui/dom.js";

export function topo(aluno, voltar) {
  return h("header", { class: "topo" },
    h("div", {}, h("div", { class: "marca" }, "UV-", h("b", {}, "vis")),
      h("div", { class: "quem" }, `${aluno.nome} · ${aluno.turma}`)),
    voltar ? h("a", { class: "btn sec voltar", href: voltar }, "← Voltar") : null);
}

export function telaMenu(el, aluno, aoSair) {
  const tile = (href, cls, ic, titulo, sub) =>
    h("a", { class: `tile ${cls}`, href }, h("span", { class: "ic", "aria-hidden": "true" }, ic), titulo, h("small", {}, sub));
  limpar(el,
    topo(aluno),
    h("div", { class: "grade" },
      tile("#quiz", "t-comp", "🏆", "Quiz", "Ao vivo, em sala"),
      tile("#grupo", "t-grupo", "👥", "Em grupo", "Estações do Workshop"),
      tile("#casa", "t-casa", "🏠", "Para casa", "Exercícios por tema"),
      tile("#sim", "t-sim", "📈", "Simuladores", "Mexa no espectro")),
    h("p", { class: "ajuda centro" }, "Não é você? ",
      h("a", { href: "#", onclick: (e) => { e.preventDefault(); aoSair(); } }, "Trocar de aluno")));
}
