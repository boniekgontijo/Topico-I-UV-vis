// Conteúdo de uma alternativa: estrutura (imagem preta, sem nome) ou texto/HTML do próprio site.
import { h } from "./dom.js";
import { ehEstrutura } from "../core/modulo.js";

export function alternativa(a, base, k = null) {
  const id = ehEstrutura(a);
  return id
    ? h("img", { src: `${base}estruturas/${id}.png`, alt: k == null ? "estrutura" : `estrutura ${String.fromCharCode(65 + k)}`, class: "estrutura", loading: "lazy" })
    : h("span", { html: a });
}
