// Painel do professor: acessos, exercícios, quizzes e exportação CSV.
import { h, limpar, toast, ls, carregarJSON } from "../ui/dom.js";
import { montarLinhas, paraCSV, rotuloCorte } from "../core/painel-dados.js";
import { ranking } from "../core/pontuacao.js";
import * as fb from "../fb.js";
import { TURMA_PADRAO, CORTE_PRATICA } from "../config.js";
import { plural } from "../core/mensagens.js";

const dataBR = (m) => (m == null ? "—" : new Date(m).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }));
const calor = (p) => (p == null ? "" : p >= 80 ? "#DDF5E7" : p >= 50 ? "#FFF6E0" : "#FDE7E7");

export async function telaPainel(el) {
  const turma = h("input", { value: ls.get("painelTurma", TURMA_PADRAO), maxlength: 20, style: { maxWidth: "160px" } });
  const recentes = h("input", { type: "checkbox", style: { width: "auto", minHeight: "0" } });
  const area = h("div");
  let linhas = [], quizzes = [], totais = { uvvis: 88, iv: 86 }, ordem = { k: "pratica.uvvis", asc: false }, modB = "uvvis";

  const carregar = async () => {
    ls.set("painelTurma", turma.value);
    limpar(area, h("p", { class: "ajuda" }, "Carregando…"));
    try {
      const [al, ac, re, qz, casa] = await Promise.all([fb.lerAlunos(turma.value), fb.lerAcessos(turma.value), fb.lerRespostas(turma.value),
        fb.lerQuizzes(turma.value), carregarJSON("conteudo/uvvis/casa.json")]);
      const casaIV = await carregarJSON("conteudo/iv/casa.json");
      totais = { uvvis: casa.questoes.length, iv: casaIV.questoes.length };
      linhas = montarLinhas(al, ac, re, qz, { totais });
      quizzes = qz.sort((a, b) => (b.criadaEmMs ?? 0) - (a.criadaEmMs ?? 0));
      desenhar();
    } catch (e) { console.error(e); toast("Não consegui ler os dados.", "erro"); }
  };

  const desenhar = () => {
    const corte = Date.now() - 7 * 864e5;
    let ls_ = recentes.checked ? linhas.filter((l) => (l.ultimoAcesso ?? 0) >= corte) : [...linhas];
    const val = (l) => (ordem.k.startsWith("b") ? l.casaPctPorBloco[modB][ordem.k.slice(1)] ?? -1
      : ordem.k.includes(".") ? ordem.k.split(".").reduce((o, k) => o?.[k], l) ?? "" : l[ordem.k] ?? "");
    const nB = modB === "iv" ? 9 : 10;
    const media = (mod) => linhas.length ? (linhas.reduce((s, l) => s + l.pratica[mod], 0) / linhas.length).toFixed(1).replace(".", ",") : "—";
    ls_.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (ordem.asc ? 1 : -1); });
    const th = (k, t) => h("th", { onclick: () => { ordem = { k, asc: ordem.k === k ? !ordem.asc : k === "nome" }; desenhar(); } }, t, ordem.k === k ? (ordem.asc ? " ▲" : " ▼") : "");
    const ativos7 = linhas.filter((l) => (l.ultimoAcesso ?? 0) >= corte).length;
    limpar(area,
      h("div", { class: "leitura" },
        h("div", {}, h("span", { class: "ajuda" }, "alunos"), h("b", {}, linhas.length)),
        h("div", {}, h("span", { class: "ajuda" }, "ativos em 7 dias"), h("b", {}, ativos7)),
        h("div", {}, h("span", { class: "ajuda" }, "quizzes"), h("b", {}, quizzes.length)),
        h("div", {}, h("span", { class: "ajuda" }, "praticaram (UV-vis / IV)"),
          h("b", {}, `${linhas.filter((l) => l.casaFeitas.uvvis > 0).length} / ${linhas.filter((l) => l.casaFeitas.iv > 0).length}`)),
        h("div", {}, h("span", { class: "ajuda" }, "média de prática (0–10)"),
          h("b", {}, `${media("uvvis")} / ${media("iv")}`))),
      h("div", { class: "abas" }, h("span", { class: "ajuda" }, `Corte da prática: UV-vis ${rotuloCorte(CORTE_PRATICA.uvvis)} · IV ${rotuloCorte(CORTE_PRATICA.iv)}`),
        h("span", { class: "quem" }, "Blocos de:"), ["uvvis", "iv"].map((m) =>
          h("a", { href: "#", class: m === modB ? "ativa" : "", onclick: (e) => { e.preventDefault(); modB = m; desenhar(); } }, m === "iv" ? "IV" : "UV-vis"))),
      h("div", { class: "rolar cartao", style: { padding: 0 } }, h("table", { class: "tab" },
        h("tr", {}, th("nome", "Nome"), th("matricula", "Matrícula"), th("ultimoAcesso", "Último acesso"), th("nAcessos", "Acessos"),
          th("pratica.uvvis", "Prática UV-vis"), th("casaFeitas.uvvis", `Casa UV (de ${totais.uvvis})`),
          th("pratica.iv", "Prática IV"), th("casaFeitas.iv", `Casa IV (de ${totais.iv})`), th("simuladores", "Simul."),
          ...Array.from({ length: nB }, (_, i) => th(`b${i + 1}`, `B${i + 1}`)),
          h("th", {}, "Grupo"), th("quizzes", "Quizzes"), th("quizPontos", "Pts quiz")),
        ls_.map((l) => h("tr", {},
          h("td", {}, l.nome), h("td", {}, l.matricula), h("td", {}, dataBR(l.ultimoAcesso)), h("td", {}, l.nAcessos),
          ...["uvvis", "iv"].flatMap((m) => [
            h("td", { style: { background: calor(l.pratica[m] * 10), textAlign: "center", fontWeight: 700 } }, String(l.pratica[m]).replace(".", ",")),
            h("td", { style: { textAlign: "center" } }, l.casaFeitas[m])]),
          h("td", { style: { textAlign: "center" } }, `${l.simuladores}/5`),
          ...Array.from({ length: nB }, (_, i) => { const p = l.casaPctPorBloco[modB][i + 1]; return h("td", { style: { background: calor(p), textAlign: "center" } }, p == null ? "·" : `${p}%`); }),
          h("td", {}, l.grupoAtividades.map((a) => a.replace("grupo-", "")).join(" ")), h("td", {}, l.quizzes), h("td", {}, l.quizPontos))))),
      h("p", { class: "ajuda" }, `Prática = 10 × questões diferentes de casa feitas ÷ total do módulo (UV-vis ${totais.uvvis}, IV ${totais.iv}); refazer não soma. B1–B${nB} (${modB === "iv" ? "IV" : "UV-vis"}): % de acerto na primeira tentativa, por bloco. Grupo: estações feitas (A–E, P). Quiz em equipe conta para todos os integrantes.`),
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
