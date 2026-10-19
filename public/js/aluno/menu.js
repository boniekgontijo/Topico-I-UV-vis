import { h, limpar } from "../ui/dom.js";
import { MODULOS } from "../core/modulo.js";
import { moduloAtual, trocarModulo } from "./estado.js";

export function topo(aluno, voltar) {
  const m = moduloAtual();
  const marca = m === "iv" ? h("div", { class: "marca" }, "I", h("b", {}, "V")) : h("div", { class: "marca" }, "UV-", h("b", {}, "vis"));
  return h("header", { class: "topo" },
    h("div", {}, marca, h("div", { class: "quem" }, `${aluno.avatar ?? ""} ${aluno.nome} · ${aluno.turma}`.trim())),
    voltar ? h("a", { class: "btn sec voltar", href: voltar }, "← Voltar") : null);
}

export function telaMenu(el, aluno, aoSair) {
  const m = moduloAtual();
  const tile = (href, cls, ic, titulo, sub) =>
    h("a", { class: `tile ${cls}`, href }, h("span", { class: "ic", "aria-hidden": "true" }, ic), titulo, h("small", {}, sub));
  limpar(el,
    topo(aluno),
    h("div", { class: "modulos", role: "tablist" }, Object.entries(MODULOS).map(([k, v]) =>
      h("button", { class: k === m ? "ativo" : "", role: "tab", "aria-selected": k === m ? "true" : "false",
        onclick: () => { trocarModulo(k); telaMenu(el, aluno, aoSair); } }, v.titulo))),
    h("div", { class: "grade" },
      tile("#quiz", "t-comp", "🏆", "Quiz", "Ao vivo, em sala"),
      m === "iv" ? tile("#grupo-iv", "t-grupo", "👥", "Em grupo", "Composto desconhecido")
        : tile("#grupo", "t-grupo", "👥", "Em grupo", "Estações do Workshop"),
      tile("#casa", "t-casa", "🏠", "Para casa", m === "iv" ? "Qual molécula é?" : "Exercícios por tema"),
      MODULOS[m].simuladores ? tile("#sim", "t-sim", "📈", "Simuladores", "Mexa no espectro") : null),
    h("p", { class: "ajuda centro" }, "Não é você? ",
      h("a", { href: "#", onclick: (e) => { e.preventDefault(); aoSair(); } }, "Trocar de aluno / personagem")));
}
