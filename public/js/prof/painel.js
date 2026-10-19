// Painel do professor: acessos, exercícios, quizzes e exportação CSV.
import { h, limpar, toast, ls } from "../ui/dom.js";
import { montarLinhas, paraCSV } from "../core/painel-dados.js";
import { ranking } from "../core/pontuacao.js";
import * as fb from "../fb.js";
import { TURMA_PADRAO } from "../config.js";
import { plural } from "../core/mensagens.js";

const dataBR = (m) => (m == null ? "—" : new Date(m).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }));
const calor = (p) => (p == null ? "" : p >= 80 ? "#DDF5E7" : p >= 50 ? "#FFF6E0" : "#FDE7E7");

export async function telaPainel(el) {
  const turma = h("input", { value: ls.get("painelTurma", TURMA_PADRAO), maxlength: 20, style: { maxWidth: "160px" } });
  const recentes = h("input", { type: "checkbox", style: { width: "auto", minHeight: "0" } });
  const area = h("div");
  let linhas = [], quizzes = [], ordem = { k: "nome", asc: true };

  const carregar = async () => {
    ls.set("painelTurma", turma.value);
    limpar(area, h("p", { class: "ajuda" }, "Carregando…"));
    try {
      const [al, ac, re, qz] = await Promise.all([fb.lerAlunos(turma.value), fb.lerAcessos(turma.value), fb.lerRespostas(turma.value), fb.lerQuizzes(turma.value)]);
      linhas = montarLinhas(al, ac, re, qz);
      quizzes = qz.sort((a, b) => (b.criadaEmMs ?? 0) - (a.criadaEmMs ?? 0));
      desenhar();
    } catch (e) { console.error(e); toast("Não consegui ler os dados.", "erro"); }
  };

  const desenhar = () => {
    const corte = Date.now() - 7 * 864e5;
    let ls_ = recentes.checked ? linhas.filter((l) => (l.ultimoAcesso ?? 0) >= corte) : [...linhas];
    const val = (l) => (ordem.k.startsWith("b") ? l.casaPctPorBloco[ordem.k.slice(1)] ?? -1 : l[ordem.k] ?? "");
    ls_.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (ordem.asc ? 1 : -1); });
    const th = (k, t) => h("th", { onclick: () => { ordem = { k, asc: ordem.k === k ? !ordem.asc : k === "nome" }; desenhar(); } }, t, ordem.k === k ? (ordem.asc ? " ▲" : " ▼") : "");
    const ativos7 = linhas.filter((l) => (l.ultimoAcesso ?? 0) >= corte).length;
    limpar(area,
      h("div", { class: "leitura" },
        h("div", {}, h("span", { class: "ajuda" }, "alunos"), h("b", {}, linhas.length)),
        h("div", {}, h("span", { class: "ajuda" }, "ativos em 7 dias"), h("b", {}, ativos7)),
        h("div", {}, h("span", { class: "ajuda" }, "quizzes"), h("b", {}, quizzes.length)),
        h("div", {}, h("span", { class: "ajuda" }, "questões de casa feitas"), h("b", {}, linhas.reduce((s, l) => s + l.casaFeitas, 0)))),
      h("div", { class: "rolar cartao", style: { padding: 0 } }, h("table", { class: "tab" },
        h("tr", {}, th("nome", "Nome"), th("matricula", "Matrícula"), th("ultimoAcesso", "Último acesso"), th("nAcessos", "Acessos"),
          th("casaFeitas", "Casa"), ...Array.from({ length: 10 }, (_, i) => th(`b${i + 1}`, `B${i + 1}`)),
          h("th", {}, "Grupo"), th("quizzes", "Quizzes"), th("quizPontos", "Pts quiz")),
        ls_.map((l) => h("tr", {},
          h("td", {}, l.nome), h("td", {}, l.matricula), h("td", {}, dataBR(l.ultimoAcesso)), h("td", {}, l.nAcessos), h("td", {}, l.casaFeitas),
          ...Array.from({ length: 10 }, (_, i) => { const p = l.casaPctPorBloco[i + 1]; return h("td", { style: { background: calor(p), textAlign: "center" } }, p == null ? "·" : `${p}%`); }),
          h("td", {}, l.grupoAtividades.map((a) => a.replace("grupo-", "")).join(" ")), h("td", {}, l.quizzes), h("td", {}, l.quizPontos))))),
      h("p", { class: "ajuda" }, "Casa: % de acerto na primeira tentativa, por bloco. Grupo: estações feitas (A–E, P). Quiz em equipe conta para todos os integrantes."),
      h("h2", {}, "Quizzes"),
      quizzes.length ? h("div", {}, quizzes.map((q) => {
        const r = ranking(Object.fromEntries(q.jogadores.map((j) => [j.uid, { nome: j.nome, pontos: 0, somaDtAcertos: 0, acertos: 0, ...q.placar[j.uid] }]))).slice(0, 3);
        return h("div", { class: "cartao" }, h("b", {}, `Sala ${q.codigo}`), ` · ${dataBR(q.criadaEmMs)} · ${q.modo === "equipe" ? "em equipes" : "individual"} · ${plural(q.jogadores.length, "participante", "participantes")} · ${q.estado === "fim" ? "encerrado" : q.estado}`,
          h("div", { class: "ajuda" }, r.map((p, i) => `${["🥇", "🥈", "🥉"][i]} ${p.nome} (${p.pontos})`).join("   ")));
      })) : h("p", { class: "ajuda" }, "Nenhum quiz nesta turma ainda."));
  };

  const exportar = () => {
    const blob = new Blob([paraCSV(linhas)], { type: "text/csv;charset=utf-8" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `uvvis-${turma.value}-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
  };

  recentes.addEventListener("change", desenhar);
  limpar(el, h("h1", {}, "📊 Painel da turma"),
    h("div", { class: "abas" }, h("label", { style: { margin: 0 } }, "Turma "), turma,
      h("button", { class: "btn sec", onclick: carregar }, "Atualizar"),
      h("label", { style: { margin: 0, fontWeight: 400, display: "flex", gap: "6px", alignItems: "center" } }, recentes, "acessou nos últimos 7 dias"),
      h("button", { class: "btn", onclick: exportar }, "⬇ Exportar CSV")),
    area);
  carregar();
}
