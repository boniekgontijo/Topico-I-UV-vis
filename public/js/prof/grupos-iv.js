// Atividade em grupo do IV — professor: abre, acompanha as entregas, projeta cada grupo e revela.
import { h, limpar, toast, carregarJSON } from "../ui/dom.js";
import * as fb from "../fb.js";
import { MODULOS } from "../core/modulo.js";
import { consolidar } from "../core/grupo-iv.js";
import { alternativa } from "../ui/alternativa.js";
import { desenharEspectroIV } from "../ui/espectro-iv.js";
import { TURMA_PADRAO } from "../config.js";

const BASE = MODULOS.iv.base;
let desligar = [];
const parar = () => { desligar.forEach((f) => f()); desligar = []; };
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#grupos-iv")) parar(); });
const sub = (f) => f.replace(/(\d+)/g, (d) => d.split("").map((x) => "₀₁₂₃₄₅₆₇₈₉"[x]).join(""));

export async function telaGruposIV(el, codigo) {
  parar();
  const [grupoJ, espectros, respostas] = await Promise.all([carregarJSON(BASE + "grupo.json"), carregarJSON(BASE + "espectros.json"), fb.lerBanco("iv-grupo").catch(() => null)]);
  if (!codigo) return telaCriar(el, grupoJ, respostas);
  const area = h("div", { class: "telao" });
  limpar(el, area);
  let ativ = null, entregas = [], foco = null; // foco = nº do grupo projetado
  const prob = (n) => grupoJ.problemas.find((p) => p.n === n);
  const resp = (n) => respostas?.find((r) => r.n === n);

  const urlAluno = () => `${location.href.split("#")[0].replace(/professor\.html.*$/, "")}index.html?t=${encodeURIComponent(ativ.turma)}&m=iv#grupo-iv/${codigo}`;
  const qr = (txt) => { const q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); };

  const desenhar = () => {
    if (!ativ) return limpar(area, h("p", { class: "aviso" }, `Atividade ${codigo} não encontrada.`));
    const linhas = consolidar(ativ.problemas, entregas);
    if (foco) return projetar(linhas[foco - 1]);
    limpar(area,
      h("div", { class: "abas" }, h("b", {}, `Atividade ${codigo}`), h("span", {}, `turma ${ativ.turma}`), h("span", {}, ativ.estado === "aberta" ? "🟢 aberta" : "🔒 fechada"),
        h("span", { class: "quem" }, `${linhas.filter((l) => l.entregue).length}/6 entregaram`)),
      h("div", { class: "lobby" }, h("div", { class: "qr", html: qr(urlAluno()) }),
        h("div", {}, h("p", {}, "Grupos: leiam o QR, escolham o número do grupo e resolvam o composto."),
          h("table", { class: "tab" }, h("tr", {}, h("th", {}, "Grupo"), h("th", {}, "Fórmula"), h("th", {}, "Situação"), h("th", {}, "")),
            linhas.map((l) => h("tr", {}, h("td", {}, `${l.grupo}`), h("td", {}, sub(prob(l.problema).formula)),
              h("td", {}, l.entregue ? `✅ entregue (${l.membros.length} integrantes)` : "⏳ sem entrega"),
              h("td", {}, h("button", { class: "btn sec", onclick: () => { foco = l.grupo; desenhar(); } }, "Projetar"))))),
          h("div", { class: "linha-acoes", style: { justifyContent: "flex-start" } },
            ativ.estado === "aberta" ? h("button", { class: "btn sec", onclick: () => fb.fecharAtividade(codigo) }, "🔒 Encerrar envios")
              : h("button", { class: "btn sec", onclick: () => fb.fecharAtividade(codigo, "aberta") }, "Reabrir envios"),
            h("a", { class: "btn sec", href: "#grupos-iv" }, "Nova atividade")))));
  };

  const projetar = (l) => {
    const p = prob(l.problema), r = resp(l.problema), revelado = ativ.revelados?.[l.problema];
    const espectro = h("div", { class: "espectro-tela" }); desenharEspectroIV(espectro, espectros[p.espectro], { altura: 210 });
    const revelar = async () => {
      if (!r) return toast("Carregue privado/iv-grupo.json na aba Perguntas (módulo IV).", "erro");
      await fb.revelarProblema(codigo, l.problema, { correta: r.correta, resolucao: r.resolucao, bandasChave: r.bandasChave });
    };
    limpar(area,
      h("div", { class: "abas" }, h("b", {}, `Grupo ${l.grupo}`), h("span", {}, `problema ${l.problema}`),
        h("span", { class: "quem" }, l.membros.map((m) => m.nome.split(" ")[0]).join(", ") || "sem integrantes informados")),
      h("div", { class: "enunciado-tela" }, sub(p.formula)), espectro,
      h("p", { class: "centro" }, h("b", {}, "Pista: "), p.pista),
      h("div", { class: "t-alts", style: { gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" } }, p.candidatas.map((c, k) =>
        h("div", { class: "t-alt", style: { background: revelado?.correta === k ? "#26890C" : l.escolha === k ? "#1368CE" : "#9AA3B8", flexDirection: "column" } },
          alternativa(c, BASE, k), h("small", {}, [l.escolha === k ? "proposta do grupo" : "", revelado?.correta === k ? "✓ correta" : ""].filter(Boolean).join(" · "))))),
      h("div", { class: "cartao", style: { fontSize: "1.15rem" } }, h("b", {}, "Justificativa do grupo: "), l.entregue ? l.justificativa : "(sem entrega)"),
      revelado ? h("div", { class: "cartao", style: { background: "#E3F7EC" } }, h("b", {}, "Resolução: "), revelado.resolucao,
        h("ul", {}, revelado.bandasChave.map((b) => h("li", {}, b)))) : null,
      h("div", { class: "linha-acoes" },
        h("button", { class: "btn sec", onclick: () => { foco = null; desenhar(); } }, "← Todos os grupos"),
        revelado ? null : h("button", { class: "btn", onclick: revelar }, "🔍 Revelar resposta")));
  };

  desligar.push(fb.ouvirAtividade(codigo, (a) => { ativ = a; desenhar(); }));
  desligar.push(fb.ouvirEntregas(codigo, (es) => { entregas = es; desenhar(); }));
}

function telaCriar(el, grupoJ, respostas) {
  const caixas = grupoJ.problemas.map((p, i) => ({ n: p.n, el: h("input", { type: "checkbox", checked: i < 6 }) }));
  const turma = h("input", { value: TURMA_PADRAO, maxlength: 20, style: { maxWidth: "160px" } });
  const criar = async () => {
    const sel = caixas.filter((c) => c.el.checked).map((c) => c.n);
    if (sel.length !== 6) return toast("Escolha exatamente 6 problemas (um por grupo).", "erro");
    const ordem = [...sel].sort(() => Math.random() - 0.5);
    try {
      const codigo = await fb.criarAtividade({ turma: turma.value, problemas: ordem });
      location.hash = `#grupos-iv/${codigo}`;
    } catch (e) {
      console.error(e);
      toast(e.code === "permission-denied" ? "O Firebase recusou: publique as regras novas (firestore.rules) no console." : "Não foi possível abrir a atividade.", "erro");
    }
  };
  limpar(el, h("h1", {}, "👥 Atividade em grupo — IV"),
    respostas?.length ? null : h("p", { class: "aviso" }, "As respostas ainda não foram carregadas: aba Perguntas → IV → privado/iv-grupo.json (necessário para revelar)."),
    h("div", { class: "cartao" },
      h("p", {}, "Escolha 6 problemas; cada grupo recebe um diferente (sorteado)."),
      h("div", { class: "blocos-sel" }, grupoJ.problemas.map((p, i) => h("label", {}, caixas[i].el, `Problema ${p.n}: ${sub(p.formula)}`))),
      h("label", {}, "Turma"), turma,
      h("p", {}, h("button", { class: "btn", onclick: criar }, "Abrir atividade"))));
}
