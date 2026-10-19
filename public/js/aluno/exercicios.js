// Exercícios para casa (por bloco) e estações em grupo.
import { h, limpar, ls, toast, carregarJSON } from "../ui/dom.js";
import { corrigir, formatarNumeroBR } from "../core/correcao.js";
import { embaralharQuestao } from "../core/embaralhar.js";
import { topo } from "./menu.js";
import { salvarResposta } from "./dados.js";
import { matriculaValida } from "./identificacao.js";
import { incentivo } from "../core/mensagens.js";

const BASE = "conteudo/uvvis/";
let cache = {};
const conteudo = async (arq) => (cache[arq] ??= await carregarJSON(BASE + arq));

// progresso local: primeira tentativa de cada questão
const chave = (atividade, aluno) => `prog:${aluno.turma}:${aluno.matricula}:${atividade}`;
const lerProg = (atividade, aluno) => ls.get(chave(atividade, aluno), {});
const gravarProg = (atividade, aluno, p) => ls.set(chave(atividade, aluno), p);

// ---------- casa ----------
export async function telaCasaLista(el, aluno) {
  const [blocos, casa] = await Promise.all([conteudo("blocos.json"), conteudo("casa.json")]);
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "🏠 Para casa"),
    h("p", { class: "ajuda" }, "Faça no seu ritmo. Você pode tentar de novo; o professor vê a primeira tentativa."),
    h("ul", { class: "lista" }, blocos.map((b) => {
      const qs = casa.questoes.filter((q) => q.bloco === b.n);
      const p = lerProg(`casa-${b.n}`, aluno);
      const feitas = qs.filter((q) => q.id in p).length;
      return h("li", {}, h("a", { href: `#casa/${b.n}` },
        h("span", {}, h("b", {}, `${b.n}. `), b.titulo),
        h("span", { class: `pilula ${feitas === qs.length ? "ok" : ""}` }, `${feitas}/${qs.length}`)));
    })));
}

export async function telaCasaBloco(el, aluno, n) {
  const [blocos, casa] = await Promise.all([conteudo("blocos.json"), conteudo("casa.json")]);
  const bloco = blocos.find((b) => b.n === Number(n));
  if (!bloco) return (location.hash = "#casa");
  executar(el, aluno, {
    titulo: `${bloco.n}. ${bloco.titulo}`, voltar: "#casa", tipo: "casa", atividade: `casa-${bloco.n}`,
    questoes: casa.questoes.filter((q) => q.bloco === bloco.n),
    membros: [{ nome: aluno.nome, matricula: aluno.matricula }],
  });
}

// ---------- grupo ----------
export async function telaGrupoLista(el, aluno) {
  const g = await conteudo("grupo.json");
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "👥 Atividades em grupo"),
    h("p", { class: "ajuda" }, "Um celular por equipe. Discutam antes de responder!"),
    h("ul", { class: "lista" }, g.estacoes.map((e) => h("li", {}, h("a", { href: `#grupo/${e.id}` },
      h("span", {}, h("b", {}, e.id === "P" ? "★ " : `Estação ${e.id} — `), e.titulo),
      h("span", { class: "pilula" }, `${e.questoes.length} questões`))))));
}

export async function telaGrupoEstacao(el, aluno, id) {
  const g = await conteudo("grupo.json");
  const est = g.estacoes.find((e) => e.id === id);
  if (!est) return (location.hash = "#grupo");
  const salvo = ls.get("equipe", { nome: "", membros: [] });
  const equipe = h("input", { id: "eq", maxlength: 40, value: salvo.nome, placeholder: "Ex.: Os Batocrômicos" });
  const linhas = [0, 1, 2].map((i) => {
    const m = salvo.membros[i] ?? {};
    return { nome: h("input", { placeholder: `Colega ${i + 1} — nome`, maxlength: 80, value: m.nome ?? "" }),
             mat: h("input", { placeholder: "matrícula", inputmode: "numeric", maxlength: 12, value: m.matricula ?? "" }) };
  });
  const erro = h("p", { class: "ajuda", style: { color: "var(--erro)" } });
  const comecar = (ev) => {
    ev.preventDefault();
    const nomeEq = equipe.value.trim();
    if (!nomeEq) return (erro.textContent = "Dê um nome para a equipe.");
    const colegas = [];
    for (const l of linhas) {
      const n = l.nome.value.trim(), m = l.mat.value.replace(/\D/g, "");
      if (!n && !m) continue;
      if (!n || !matriculaValida(m)) return (erro.textContent = "Cada colega precisa de nome e matrícula (6 a 12 dígitos).");
      colegas.push({ nome: n, matricula: m });
    }
    ls.set("equipe", { nome: nomeEq, membros: colegas });
    executar(el, aluno, {
      titulo: est.id === "P" ? est.titulo : `Estação ${est.id}: ${est.titulo}`, subtitulo: est.subtitulo,
      voltar: "#grupo", tipo: "grupo", atividade: `grupo-${est.id}`, equipe: nomeEq,
      questoes: est.questoes, membros: [{ nome: aluno.nome, matricula: aluno.matricula }, ...colegas],
    });
  };
  limpar(el, topo(aluno, "#grupo"), h("h1", {}, est.id === "P" ? `★ ${est.titulo}` : `Estação ${est.id}: ${est.titulo}`),
    h("p", { class: "ajuda" }, est.subtitulo),
    h("form", { class: "cartao", onsubmit: comecar },
      h("label", { for: "eq" }, "Nome da equipe"), equipe,
      h("label", {}, "Integrantes (você já está incluído)"),
      h("p", { class: "ajuda" }, `1. ${aluno.nome} (${aluno.matricula})`),
      linhas.map((l) => h("div", { class: "linha-num", style: { margin: "6px 0" } }, l.nome, l.mat)),
      erro, h("button", { class: "btn largo", type: "submit" }, "Começar")));
}

// ---------- executor de questões ----------
function executar(el, aluno, cfg) {
  const prog = lerProg(cfg.atividade, aluno);
  const tentKey = chave(cfg.atividade, aluno).replace("prog:", "tent:");
  const tentativas = ls.get(tentKey, {});
  const qs = cfg.questoes.map((q) => embaralharQuestao(q));
  let i = Math.max(0, qs.findIndex((q) => !(q.id in prog)));
  if (qs.every((q) => q.id in prog)) i = 0;

  const registrar = (q, correta) => {
    tentativas[q.id] = (tentativas[q.id] ?? 0) + 1;
    ls.set(tentKey, tentativas);
    if (!(q.id in prog)) { prog[q.id] = correta; gravarProg(cfg.atividade, aluno, prog); }
    salvarResposta({ tipo: cfg.tipo, turma: aluno.turma, atividade: cfg.atividade, questaoId: q.id, bloco: q.bloco,
      correta, tentativa: tentativas[q.id], equipe: cfg.equipe, membros: cfg.membros });
  };

  const mostrar = () => {
    if (i >= qs.length) return fim();
    const q = qs[i];
    const corpo = h("div", { class: "cartao" });
    const fb = h("div");
    let travado = false;

    const responder = (resp, botao) => {
      if (travado) return;
      const r = corrigir(q, resp);
      if (!r.valida) return toast("Não entendi o número — use 0,52 ou 3,0e-5", "erro");
      travado = true;
      registrar(q, r.correta);
      if (q.tipo !== "num") {
        corpo.querySelectorAll(".alt").forEach((b) => (b.disabled = true));
        botao?.classList.add(r.correta ? "certa" : "errada"); // a certa não é revelada: dá para tentar de novo
      }
      const certoTxt = q.tipo === "num" ? ` Resposta: ${formatarNumeroBR(q.resposta)} ${q.unidade ?? ""}` : "";
      limpar(fb, h("div", { class: `feedback ${r.correta ? "ok" : "nao"}` },
        h("b", {}, r.correta ? `✓ ${incentivo(true)}` : `💡 ${incentivo(false)}`),
        h("p", { html: q.explicacao + (r.correta ? certoTxt : "") }),
        h("div", { class: "acoes" },
          !r.correta ? h("button", { class: "btn sec", onclick: () => mostrar() }, "Tentar de novo") : null,
          h("button", { class: "btn", onclick: () => { i++; mostrar(); } }, i + 1 < qs.length ? "Próxima →" : "Ver resultado"))));
      fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    let entrada;
    if (q.tipo === "mc") {
      entrada = h("div", { class: "alts" }, q.alternativas.map((a, k) =>
        h("button", { class: "alt", "data-v": k, onclick: (e) => responder(k, e.currentTarget), html: a })));
    } else if (q.tipo === "vf") {
      entrada = h("div", { class: "alts" }, [[true, "Verdadeiro"], [false, "Falso"]].map(([v, t]) =>
        h("button", { class: "alt", "data-v": String(v), onclick: (e) => responder(v, e.currentTarget) }, t)));
    } else {
      const inp = h("input", { inputmode: "decimal", autocomplete: "off", placeholder: "ex.: 0,452 ou 3,0e-5", "aria-label": "Sua resposta" });
      entrada = h("form", { class: "linha-num", style: { marginTop: "12px" }, onsubmit: (e) => { e.preventDefault(); responder(inp.value); } },
        inp, q.unidade ? h("span", { class: "unidade" }, q.unidade) : null, h("button", { class: "btn", type: "submit" }, "OK"));
    }

    limpar(corpo,
      h("div", { class: "ajuda" }, `Questão ${i + 1} de ${qs.length}`),
      h("div", { class: "progresso" }, h("div", { style: { width: `${(100 * i) / qs.length}%` } })),
      h("p", { class: "enunciado", html: q.enunciado }),
      q.figura ? h("a", { href: BASE + q.figura, target: "_blank", rel: "noopener" },
        h("img", { class: "figura", src: BASE + q.figura, alt: "Figura da questão (toque para ampliar)", loading: "lazy" })) : null,
      entrada, fb);
    limpar(el, topo(aluno, cfg.voltar), h("h2", {}, cfg.titulo), corpo);
  };

  const fim = () => {
    const certas = qs.filter((q) => prog[q.id] === true).length;
    limpar(el, topo(aluno, cfg.voltar), h("h2", {}, cfg.titulo),
      h("div", { class: "cartao centro" },
        h("div", { class: "grande" }, certas === qs.length ? "🏅" : certas >= qs.length / 2 ? "👏" : "💪"),
        h("p", {}, h("b", {}, `${certas} de ${qs.length}`), " na primeira tentativa"),
        h("p", { class: "ajuda" }, certas === qs.length ? "Perfeito! Você domina este tema." : "Cada revisão fixa um pouco mais. Que tal refazer?"),
        h("div", { class: "acoes", style: { display: "flex", gap: "8px", justifyContent: "center" } },
          h("button", { class: "btn sec", onclick: () => { i = 0; mostrar(); } }, "Refazer"),
          h("a", { class: "btn", href: cfg.voltar }, "Voltar"))));
  };

  mostrar();
}
