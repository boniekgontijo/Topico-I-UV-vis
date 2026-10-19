import { h, limpar } from "../ui/dom.js";
import { topo } from "../aluno/menu.js";
export function telaSimuladores(el, aluno) {
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "📈 Simuladores"), h("p", { class: "ajuda" }, "Em construção."));
}
