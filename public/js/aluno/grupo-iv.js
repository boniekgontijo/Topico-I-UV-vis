// Atividade em grupo do IV — aluno: escolhe o grupo, resolve o composto desconhecido e envia.
import { h, limpar, ls, toast, carregarJSON } from "../ui/dom.js";
import { topo } from "./menu.js";
import { api, online } from "./dados.js";
import { MODULOS } from "../core/modulo.js";
import { alternativa } from "../ui/alternativa.js";
import { desenharEspectroIV } from "../ui/espectro-iv.js";
import { matriculaValida } from "./identificacao.js";

const BASE = MODULOS.iv.base;
let desligar = [];
const parar = () => { desligar.forEach((f) => f()); desligar = []; };
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#grupo-iv")) parar(); });

export async function telaGrupoIV(el, aluno, codigo) {
  parar();
  if (!online()) return limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao" }, h("p", {}, "Sem conexão com o servidor. Recarregue a página.")));
  const fb = api();
  if (!codigo) { // link fixo da turma: entra na atividade aberta
    limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "⏳"), h("p", {}, "Procurando a atividade em grupo…")));
    desligar.push(fb.ouvirTurma(aluno.turma, (t) => {
      if (t?.atividadeIV) location.hash = `#grupo-iv/${t.atividadeIV}`;
      else limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "👥"),
        h("p", {}, "Aguarde: quando o professor abrir a atividade em grupo, ela aparece aqui.")));
    }));
    return;
  }
  const [grupoJ, { compostos, extras }] = await Promise.all([carregarJSON(BASE + "grupo.json"), carregarJSON(BASE + "compostos.json")]);
  const corpo = h("div");
  limpar(el, topo(aluno, "#menu"), corpo);
  let ativ = null;
  desligar.push(fb.ouvirAtividade(codigo, (a) => { ativ = a; desenhar(); }));

  const desenhar = () => {
    if (!ativ) return limpar(corpo, h("div", { class: "cartao" }, h("p", {}, `Atividade ${codigo} não encontrada.`)));
    const meuGrupo = ls.get(`grupoIV:${codigo}`);
    if (!meuGrupo) return limpar(corpo, h("h1", {}, "👥 Em grupo — IV"),
      h("p", {}, "Qual é o número do seu grupo? (o professor diz)"),
      h("div", { class: "avatares", style: { gridTemplateColumns: "repeat(3, 1fr)" } }, [1, 2, 3, 4, 5, 6].map((g) =>
        h("button", { class: "avatar", style: { fontSize: "1.6rem", fontWeight: 800 }, onclick: () => { ls.set(`grupoIV:${codigo}`, g); desenhar(); } }, `Grupo ${g}`))));
    const n = ativ.problemas[meuGrupo - 1];
    const prob = grupoJ.problemas.find((p) => p.n === n);
    const rasc = ls.get(`grupoIVr:${codigo}`, { escolha: null, justificativa: "", membros: [] });
    const revelado = ativ.revelados?.[n];
    const aberta = ativ.estado === "aberta";
    const espectro = h("div"); desenharEspectroIV(espectro, compostos[prob.espectro].bandas, { altura: 190 });
    const just = h("textarea", { rows: 6, maxlength: 1500, placeholder: "Ex.: I = 1. 1715 cm⁻¹ = C=O de cetona; sem O–H em 3300; …",
      style: { width: "100%", font: "inherit", padding: "10px", borderRadius: "10px", border: "2px solid var(--borda)" }, disabled: !aberta }, rasc.justificativa);
    const colegas = [0, 1, 2, 3, 4].map((i) => ({ nome: h("input", { placeholder: `Colega ${i + 1} — nome`, maxlength: 80, value: rasc.membros[i]?.nome ?? "", disabled: !aberta }),
      mat: h("input", { placeholder: "matrícula", inputmode: "numeric", maxlength: 12, value: rasc.membros[i]?.matricula ?? "", disabled: !aberta }) }));
    let escolha = rasc.escolha;
    const cands = h("div", { class: "alts" });
    const desenharCands = () => limpar(cands, prob.candidatas.map((c, k) => h("button", { type: "button",
      class: `alt alt-est ${escolha === k ? "escolhida" : ""} ${revelado && revelado.correta === k ? "certa" : ""}`, disabled: !aberta,
      onclick: () => { escolha = k; salvarRasc(); desenharCands(); } }, alternativa(c, BASE))));
    const salvarRasc = () => ls.set(`grupoIVr:${codigo}`, { escolha, justificativa: just.value, membros: lerColegas(false) });
    just.addEventListener("input", salvarRasc);
    const lerColegas = (validar) => {
      const out = [{ nome: aluno.nome, matricula: aluno.matricula }];
      for (const c of colegas) {
        const nn = c.nome.value.trim(), mm = c.mat.value.replace(/\D/g, "");
        if (!nn && !mm) continue;
        if (validar && (!nn || !matriculaValida(mm))) throw new Error("Cada colega precisa de nome e matrícula (6 a 12 dígitos).");
        out.push({ nome: nn, matricula: mm });
      }
      return out;
    };
    const enviar = async () => {
      try {
        if (escolha == null) return toast("Escolha a estrutura proposta.", "erro");
        if (just.value.trim().length < 20) return toast("Escreva a justificativa: atribua as bandas principais.", "erro");
        await fb.entregar(codigo, { grupo: meuGrupo, problema: n, escolha, justificativa: just.value.trim(), membros: lerColegas(true) });
        toast("✓ Enviado! Vocês podem editar até o professor fechar.");
      } catch (e) { console.error(e); toast(e.message?.startsWith("Cada colega") ? e.message : "Não foi possível enviar. Tente de novo.", "erro"); }
    };
    desenharCands();
    limpar(corpo,
      h("h1", {}, `👥 Grupo ${meuGrupo} — composto desconhecido`),
      h("div", { class: "cartao" },
        h("p", { class: "enunciado" }, "Fórmula: ", h("span", { class: "eq" }, prob.formula.replace(/(\d+)/g, (d) => d.split("").map((x) => "₀₁₂₃₄₅₆₇₈₉"[x]).join("")))),
        espectro,
        h("p", {}, h("b", {}, "Pista: "), prob.pista),
        h("p", { class: "ajuda" }, "1) Calcule as insaturações: I = C − H/2 + N/2 + 1.  2) Atribua as bandas principais.  3) Escolha a estrutura.")),
      h("h3", {}, "Qual é a estrutura?"), cands,
      revelado ? h("div", { class: "feedback ok" }, h("b", {}, "Resposta revelada pelo professor"), h("p", {}, revelado.resolucao)) : null,
      h("h3", {}, "Justificativa (bandas)"), just,
      h("h3", {}, "Integrantes"), h("p", { class: "ajuda" }, `1. ${aluno.nome} (${aluno.matricula})`),
      colegas.map((c) => h("div", { class: "linha-num", style: { margin: "6px 0" } }, c.nome, c.mat)),
      aberta ? h("button", { class: "btn largo", style: { marginTop: "12px" }, onclick: enviar }, "Enviar para o professor") : h("p", { class: "ajuda centro" }, "Atividade encerrada."),
      h("p", { class: "ajuda centro" }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); ls.set(`grupoIV:${codigo}`, null); desenhar(); } }, "Trocar de grupo")));
  };
}
