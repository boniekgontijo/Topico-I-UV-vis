import { h, limpar, ls } from "../ui/dom.js";
import { TURMA_PADRAO } from "../config.js";

export function turmaAtual() {
  const t = new URLSearchParams(location.search).get("t");
  if (t && /^[\w-]{1,20}$/.test(t)) { ls.set("turma", t); return t; }
  return ls.get("turma", TURMA_PADRAO);
}

export function obterAluno() {
  const a = ls.get("aluno");
  return a?.nome && a?.matricula ? { ...a, turma: turmaAtual() } : null;
}

export function sair() { ls.set("aluno", null); }

export const matriculaValida = (m) => /^\d{6,12}$/.test(m);

export function telaIdentificacao(el, onOk) {
  const nome = h("input", { id: "nome", autocomplete: "name", maxlength: 80, required: true, placeholder: "Seu nome" });
  const mat = h("input", { id: "mat", inputmode: "numeric", autocomplete: "off", maxlength: 12, placeholder: "Só números" });
  const erro = h("p", { class: "ajuda", style: { color: "var(--erro)" } });
  const enviar = (ev) => {
    ev.preventDefault();
    const n = nome.value.trim().replace(/\s+/g, " ");
    const m = mat.value.replace(/\D/g, "");
    if (n.length < 2) return (erro.textContent = "Digite seu nome.");
    if (!matriculaValida(m)) return (erro.textContent = "A matrícula deve ter de 6 a 12 dígitos.");
    ls.set("aluno", { nome: n, matricula: m });
    onOk(obterAluno());
  };
  limpar(el,
    h("div", { class: "centro" },
      h("div", { class: "grande", "aria-hidden": "true" }, "🌈🔬"),
      h("h1", {}, "UV-vis em jogo"),
      h("p", { class: "ajuda" }, "Introdução aos Métodos Instrumentais de Análise")),
    h("form", { class: "cartao", onsubmit: enviar },
      h("label", { for: "nome" }, "Nome"), nome,
      h("label", { for: "mat" }, "Matrícula"), mat,
      erro,
      h("p", { class: "ajuda" }, `Turma ${turmaAtual()}. Sem senha: seu nome e matrícula só servem para o professor acompanhar a turma.`),
      h("button", { class: "btn largo", type: "submit" }, "Entrar")));
  nome.focus();
}
