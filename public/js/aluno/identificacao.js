import { h, limpar, ls } from "../ui/dom.js";
import { TURMA_PADRAO } from "../config.js";
import { AVATARES } from "../core/competicao.js";
import { conectar, online, api } from "./dados.js";

export function turmaAtual() {
  const t = new URLSearchParams(location.search).get("t");
  if (t && /^[\w-]{1,20}$/.test(t)) { ls.set("turma", t); return t; }
  return ls.get("turma", TURMA_PADRAO);
}

// registro completo = nome + matrícula + personagem (da turma atual)
export function obterAluno() {
  const a = ls.get("aluno");
  const turma = turmaAtual();
  return a?.nome && a?.matricula && a?.avatar && a?.avatarTurma === turma ? { ...a, turma } : null;
}

// volta ao registro (mantém nome/matrícula preenchidos para trocar só o personagem)
export function sair() { const a = ls.get("aluno"); if (a) ls.set("aluno", { ...a, avatarTurma: null, avatarTurmaAnt: a.avatarTurma }); }

export const matriculaValida = (m) => /^\d{6,12}$/.test(m);

export function telaIdentificacao(el, onOk) {
  const antigo = ls.get("aluno") ?? {};
  const turma = turmaAtual();
  const turmaDoAvatar = antigo.avatarTurma ?? antigo.avatarTurmaAnt; // personagem que já é dele nesta turma
  const nome = h("input", { id: "nome", autocomplete: "name", maxlength: 80, placeholder: "Seu nome", value: antigo.nome ?? "" });
  const mat = h("input", { id: "mat", inputmode: "numeric", autocomplete: "off", maxlength: 12, placeholder: "Só números", value: antigo.matricula ?? "" });
  const erro = h("p", { class: "ajuda", style: { color: "var(--erro)" } });
  const grade = h("div", { class: "avatares" });
  const escolhido = h("span", { class: "ajuda" }, "Escolha um personagem");
  let ocupados = {}, meuDono = null, sel = turmaDoAvatar === turma ? antigo.avatarId : null, desligar = null;

  const desenhar = () => limpar(grade, AVATARES.map((a) => {
    const dono = ocupados?.[a.id];
    const deOutro = dono && dono !== meuDono;
    return h("button", { type: "button", class: `avatar ${sel === a.id ? "escolhida" : ""}`, disabled: deOutro,
      "aria-label": `${a.nome}${deOutro ? " (já escolhido)" : ""}`, title: deOutro ? "já escolhido" : a.nome,
      onclick: () => { sel = a.id; escolhido.textContent = `${a.emoji} ${a.nome}`; desenhar(); } }, a.emoji);
  }));
  const atualizarDono = async () => {
    const m = mat.value.replace(/\D/g, "");
    meuDono = matriculaValida(m) && online() ? await api().donoDe(turma, m) : null;
    desenhar();
  };
  mat.addEventListener("change", atualizarDono);

  const enviar = async (ev) => {
    ev.preventDefault();
    const n = nome.value.trim().replace(/\s+/g, " ");
    const m = mat.value.replace(/\D/g, "");
    if (n.length < 2) return (erro.textContent = "Digite seu nome.");
    if (!matriculaValida(m)) return (erro.textContent = "A matrícula deve ter de 6 a 12 dígitos.");
    if (!sel) return (erro.textContent = "Escolha seu personagem.");
    const av = AVATARES.find((a) => a.id === sel);
    const botao = ev.submitter ?? el.querySelector("button[type=submit]");
    botao.disabled = true; erro.textContent = "";
    if (online()) {
      try {
        const fb = api();
        const dono = await fb.donoDe(turma, m);
        await fb.reservarAvatar(turma, av.id, dono);
        if (antigo.avatarId && antigo.avatarId !== av.id && turmaDoAvatar === turma) fb.liberarAvatar(turma, antigo.avatarId);
      } catch (e) {
        botao.disabled = false;
        if (e.code === "permission-denied") { erro.textContent = `${av.emoji} acabou de ser escolhido por outro colega. Escolha outro.`; sel = null; return desenhar(); }
        console.warn(e); // sem rede: segue, o registro é refeito depois
      }
    }
    desligar?.();
    ls.set("aluno", { nome: n, matricula: m, avatar: av.emoji, avatarId: av.id, avatarTurma: turma });
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
      h("label", {}, "Seu personagem na turma ", escolhido),
      h("p", { class: "ajuda" }, "Cada personagem tem um só dono. Os apagados já foram escolhidos."),
      grade,
      erro,
      h("p", { class: "ajuda" }, `Turma ${turma}. Sem senha: seus dados só servem para o professor acompanhar a turma.`),
      h("button", { class: "btn largo", type: "submit" }, "Entrar")));
  if (sel) { const a = AVATARES.find((x) => x.id === sel); if (a) escolhido.textContent = `${a.emoji} ${a.nome}`; }
  desenhar();
  conectar().then((ok) => {
    if (!ok) return;
    desligar = api().ouvirAvatares(turma, (o) => { ocupados = o ?? {}; desenhar(); });
    atualizarDono();
  });
  (antigo.nome ? mat : nome).focus();
}
