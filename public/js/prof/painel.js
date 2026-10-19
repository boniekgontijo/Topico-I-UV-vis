import { h, limpar } from "../ui/dom.js";
export async function telaPainel(el) { limpar(el, h("h1", {}, "📊 Painel"), h("p", { class: "ajuda" }, "Em construção.")); }
