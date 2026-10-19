import { h, limpar } from "../ui/dom.js";
import { topo } from "./menu.js";
export function telaCompeticao(el, aluno) {
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "🏆 Competição"), h("p", { class: "ajuda" }, "Em construção."));
}
