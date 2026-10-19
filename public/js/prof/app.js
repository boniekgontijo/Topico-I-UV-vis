// Área do professor: login Google restrito + abas.
import { h, limpar, rotas, toast } from "../ui/dom.js";
import * as fb from "../fb.js";

const el = document.getElementById("app");
let email = null;

function abas(ativa) {
  const a = (href, txt) => h("a", { href, class: ativa === href ? "ativa" : "" }, txt);
  return h("nav", { class: "abas" }, h("span", { class: "marca" }, "UV-", h("b", {}, "vis"), " · professor"),
    a("#comp", "🏆 Quiz"), a("#painel", "📊 Painel"), a("#perguntas", "🗂️ Perguntas"),
    h("span", { class: "quem" }, email ?? ""),
    h("a", { href: "#", onclick: async (e) => { e.preventDefault(); await fb.sairProfessor(); location.reload(); } }, "Sair"));
}

function telaLogin(erro) {
  limpar(el, h("div", { class: "cartao centro", style: { maxWidth: "460px", margin: "10vh auto" } },
    h("h1", {}, "Área do professor"),
    h("p", { class: "ajuda" }, "Entre com a conta Google autorizada."),
    erro ? h("p", { class: "aviso" }, erro) : null,
    h("button", { class: "btn largo", onclick: entrar }, "Entrar com Google")));
}

async function entrar() {
  try { email = (await fb.entrarProfessor()).email; iniciarRotas(); }
  catch (e) { console.warn(e); telaLogin(e.message === "acesso restrito" ? "Esta conta não tem acesso à área do professor." : "Não foi possível entrar."); }
}

const aba = (href, carregar) => async (params) => {
  const area = h("div");
  limpar(el, abas(href), area);
  try { await carregar(area, params); } catch (e) { console.error(e); toast(e.message || "erro", "erro"); }
};

let iniciado = false;
function iniciarRotas() {
  if (iniciado) return window.dispatchEvent(new HashChangeEvent("hashchange"));
  iniciado = true;
  rotas({
    "": aba("#comp", async (a) => (await import("./telao.js")).telaNova(a)),
    comp: aba("#comp", async (a) => (await import("./telao.js")).telaNova(a)),
    sala: aba("#comp", async (a, [c]) => (await import("./telao.js")).telaSala(a, c)),
    painel: aba("#painel", async (a) => (await import("./painel.js")).telaPainel(a)),
    perguntas: aba("#perguntas", async (a) => (await import("./banco.js")).telaBanco(a)),
  });
}

telaLogin();
fb.professorLogado().then((e) => { if (e) { email = e; iniciarRotas(); } });
