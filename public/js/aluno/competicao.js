// Competição ao vivo — lado do aluno.
import { h, limpar, ls, toast } from "../ui/dom.js";
import { topo } from "./menu.js";
import { api, online } from "./dados.js";
import { incentivo } from "../core/mensagens.js";
import { infoRodada, AVATARES } from "../core/competicao.js";

export const FORMAS = ["▲", "◆", "●", "■"];
let desligar = [];
let geracao = 0; // muda a cada navegação: telas antigas param depois de um await
const parar = () => { geracao++; desligar.forEach((f) => f()); desligar = []; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const NEGADA = -1; // resposta recusada pelo servidor (fora do tempo)
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#quiz")) parar(); });

export async function telaCompeticao(el, aluno, codigo) {
  parar();
  if (!codigo || !/^\d{6}$/.test(codigo)) return pedirCodigo(el, aluno);
  if (!online()) return limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao" },
    h("p", {}, "Sem conexão com o servidor. Verifique a internet e recarregue a página."),
    h("button", { class: "btn", onclick: () => location.reload() }, "Recarregar")));
  const fb = api();
  const meu = geracao;
  limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "📶"), h("p", {}, "Conectando à sala…")));
  // com 4G instável, tenta de novo até conseguir ler a sala (o modo individual/equipe depende dela)
  let s0 = null;
  for (let tentativa = 0; ; tentativa++) {
    try { s0 = await fb.lerSala(codigo); break; } catch (e) { console.warn(e); }
    if (meu !== geracao) return;
    await espera(Math.min(5000, 1000 * (tentativa + 1)));
    if (meu !== geracao) return;
  }
  if (meu !== geracao) return;
  if (!s0) return limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "🤔"),
    h("p", {}, `Sala ${codigo} não encontrada.`), h("a", { class: "btn", href: "#quiz" }, "Digitar outro código")));
  const equipe = s0.modo === "equipe" ? ls.get(`equipe:${codigo}`) : null;
  if (s0.modo === "equipe" && !equipe) return formEquipe(el, aluno, codigo);
  const avatar = ls.get(`avatar:${codigo}`);
  if (!avatar) return escolherAvatar(el, aluno, codigo, equipe);
  // não espera: se a rede cair, o Firestore envia quando voltar
  let erroEntrada = null;
  fb.entrarSala(codigo, equipe ? { nome: equipe.nome, matricula: aluno.matricula, membros: equipe.membros, avatar } : { ...aluno, avatar })
    .catch((e) => { console.error(e); erroEntrada = e.code ?? e.message; render(); });

  const minhas = ls.get(`comp:${codigo}`, {}); // índice → alternativa escolhida
  let sala = null, placar = {}, tic = null;
  desligar.push(() => clearInterval(tic));
  const corpo = h("div");
  limpar(el, topo(aluno, "#menu"),
    h("p", { class: "centro", style: { fontSize: "1.05rem" } }, h("span", { style: { fontSize: "1.8rem", verticalAlign: "middle" } }, avatar), " ",
      equipe ? `Equipe ${equipe.nome} · ${equipe.membros.map((m) => String(m.nome).split(" ")[0]).join(", ")}` : aluno.nome), corpo);

  const meuPlacar = () => {
    const lista = Object.entries(placar).sort((a, b) => b[1].pontos - a[1].pontos || a[1].somaDtAcertos - b[1].somaDtAcertos);
    const pos = lista.findIndex(([u]) => u === fb.uid());
    return { pos: pos + 1, total: lista.length, pontos: placar[fb.uid()]?.pontos ?? 0 };
  };

  const render = () => {
    clearInterval(tic);
    if (!sala) return limpar(corpo, h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "📶"),
      h("p", {}, "Conexão perdida com a sala."), h("button", { class: "btn", onclick: () => telaCompeticao(el, aluno, codigo) }, "Reconectar")));
    const p = meuPlacar();
    const ri = sala.indice >= 0 ? infoRodada(sala.indice, sala.porRodada, sala.total) : null;
    const cab = h("div", { class: "ajuda centro" }, `Sala ${codigo}`,
      ri ? (ri.totalRodadas > 1 ? ` · rodada ${ri.rodada}/${ri.totalRodadas} · pergunta ${ri.posNaRodada}` : ` · pergunta ${sala.indice + 1} de ${sala.total}`) : "",
      ` · ${p.pontos} pts`);

    if (erroEntrada) return limpar(corpo, cab, h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "⚠️"),
      h("p", {}, "Não consegui registrar você na sala."), h("p", { class: "ajuda" }, `Erro: ${erroEntrada}. Mostre esta mensagem ao professor.`),
      h("button", { class: "btn", onclick: () => telaCompeticao(el, aluno, codigo) }, "Tentar de novo")));

    if (sala.estado === "lobby") return limpar(corpo, cab, h("div", { class: "cartao status-grande" },
      h("div", { class: "grande" }, "✅"), h("h2", {}, equipe ? "Equipe dentro!" : "Você está dentro!"),
      h("p", {}, equipe ? `${equipe.nome}: discutam juntos e enviem UMA resposta por pergunta.` : `${aluno.nome}, aguarde o professor começar.`),
      h("p", { class: "ajuda" }, "Olhe para o slide: a pergunta aparece lá e aqui no celular.")));

    if (sala.estado === "pergunta") {
      const escolhida = minhas[sala.indice];
      const q = sala.pergunta;
      const barra = h("div");
      const restante = () => Math.max(0, (sala.abertaEmMs ?? Date.now()) + sala.limiteMs - Date.now());
      const desenharBarra = () => {
        const f = sala.limiteMs ? restante() / sala.limiteMs : 0;
        limpar(barra, h("div", { class: "barra-tempo" }, h("div", { style: { width: `${Math.max(0, Math.min(1, f)) * 100}%` } })));
      };
      desenharBarra();
      tic = setInterval(desenharBarra, 250);
      const responder = async (k) => {
        if (minhas[sala.indice] != null) return;
        minhas[sala.indice] = k; ls.set(`comp:${codigo}`, minhas); render();
        try { await fb.responder(codigo, sala.indice, k); }
        catch (e) {
          console.warn(e);
          if (e.code === "permission-denied") minhas[sala.indice] = NEGADA; else delete minhas[sala.indice];
          ls.set(`comp:${codigo}`, minhas); render();
          toast(e.code === "permission-denied" ? "O tempo acabou antes da resposta chegar." : "Falha de conexão: toque de novo.", "erro");
        }
      };
      return limpar(corpo, cab, barra,
        h("div", { class: "cartao" }, h("p", { class: "enunciado", html: q.enunciado }),
          escolhida === NEGADA ? h("p", { class: "centro" }, h("b", {}, "⏳ O tempo acabou. "), "Na próxima você responde!")
            : escolhida != null ? h("p", { class: "centro" }, h("b", {}, "Resposta enviada! "), "Aguarde o fim do tempo.") : null,
          h("div", { class: "k-alts" }, q.alternativas.map((a, k) => h("button", {
            class: `k-alt k${k} ${escolhida === k ? "escolhida" : ""}`, disabled: escolhida != null,
            onclick: () => responder(k) }, h("span", { class: "forma", "aria-hidden": "true" }, FORMAS[k]), h("span", { html: a }))))));
    }

    if (sala.estado === "fechando") return limpar(corpo, cab, h("div", { class: "cartao status-grande" },
      h("div", { class: "grande" }, "⏳"), h("p", {}, "Tempo esgotado! Calculando os pontos…")));

    if (sala.estado === "revelada") {
      const escolhida = minhas[sala.indice] === NEGADA ? null : minhas[sala.indice];
      const acertou = escolhida === sala.correta;
      return limpar(corpo, cab, h("div", { class: "cartao status-grande", style: { background: acertou ? "#E3F7EC" : "#FFF6E0" } },
        h("div", { class: "grande" }, escolhida == null ? "⏳" : acertou ? "🎉" : "💪"),
        h("h2", {}, escolhida == null ? "O tempo voou! Na próxima você responde." : incentivo(acertou)),
        h("p", {}, "Resposta: ", h("b", { html: `${FORMAS[sala.correta]} ${sala.pergunta.alternativas[sala.correta]}` })),
        h("p", { class: "grande", style: { fontSize: "1.6rem" } }, `${p.pontos} pts`),
        p.pos ? h("p", {}, `${equipe ? "Sua equipe está" : "Você está"} em ${p.pos}º de ${p.total}`) : null,
        ri?.fimDaRodada && !ri.ultima ? h("p", { class: "cartao", style: { background: "#FFF6E0" } },
          h("b", {}, `🏁 Fim da rodada ${ri.rodada}!`), " Os pontos continuam valendo na próxima rodada.") : null));
    }

    if (sala.estado === "fim") return limpar(corpo, cab, h("div", { class: "cartao status-grande" },
      h("div", { class: "grande" }, p.pos === 1 ? "🥇" : p.pos === 2 ? "🥈" : p.pos === 3 ? "🥉" : "🏁"),
      h("h2", {}, "Fim de jogo!"), h("p", { class: "grande", style: { fontSize: "1.6rem" } }, `${p.pontos} pts`),
      p.pos ? h("p", {}, `Posição final: ${p.pos}º de ${p.total}`) : null,
      p.pos && p.pos <= 3 ? h("p", {}, equipe ? "🍫 Venham buscar o prêmio com o professor!" : "🍫 Vá buscar seu prêmio com o professor!") : null));
  };

  desligar.push(fb.ouvirSala(codigo, (s) => { sala = s; render(); }));
  desligar.push(fb.ouvirPlacar(codigo, (pl) => { placar = pl; if (sala?.estado !== "pergunta") render(); }));
}

function escolherAvatar(el, aluno, codigo, equipe) {
  limpar(el, topo(aluno, "#menu"), h("h1", {}, equipe ? `Escolha o símbolo da equipe` : "Escolha seu avatar"),
    h("p", { class: "ajuda" }, "Ele aparece no telão, no ranking e no pódio."),
    h("div", { class: "avatares" }, AVATARES.map((a) => h("button", { class: "avatar", "aria-label": a.nome, title: a.nome,
      onclick: () => { ls.set(`avatar:${codigo}`, a.emoji); telaCompeticao(el, aluno, codigo); } }, a.emoji))));
}

function formEquipe(el, aluno, codigo) {
  const salvo = ls.get("equipe", { nome: "", membros: [] });
  const nome = h("input", { maxlength: 40, value: salvo.nome, placeholder: "Ex.: Os Batocrômicos", "aria-label": "Nome da equipe" });
  const linhas = [0, 1, 2, 3].map((i) => {
    const m = salvo.membros?.[i] ?? {};
    return { nome: h("input", { placeholder: `Colega ${i + 1} — nome`, maxlength: 80, value: m.nome ?? "" }),
             mat: h("input", { placeholder: "matrícula", inputmode: "numeric", maxlength: 12, value: m.matricula ?? "" }) };
  });
  const erro = h("p", { class: "ajuda", style: { color: "var(--erro)" } });
  const entrar = (e) => {
    e.preventDefault();
    const n = nome.value.trim();
    if (!n) return (erro.textContent = "Dê um nome para a equipe.");
    const colegas = [];
    for (const l of linhas) {
      const nn = l.nome.value.trim(), mm = l.mat.value.replace(/\D/g, "");
      if (!nn && !mm) continue;
      if (!nn || !/^\d{6,12}$/.test(mm)) return (erro.textContent = "Cada colega precisa de nome e matrícula (6 a 12 dígitos).");
      colegas.push({ nome: nn, matricula: mm });
    }
    const eq = { nome: n, membros: [{ nome: aluno.nome, matricula: aluno.matricula }, ...colegas] };
    ls.set(`equipe:${codigo}`, eq);
    ls.set("equipe", { nome: n, membros: colegas });
    telaCompeticao(el, aluno, codigo);
  };
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "👥 Quiz em equipes"),
    h("form", { class: "cartao", onsubmit: entrar },
      h("p", {}, "Um celular por equipe. Pensem juntos e enviem a resposta!"),
      h("label", {}, "Nome da equipe"), nome,
      h("label", {}, "Integrantes (você já está incluído)"),
      h("p", { class: "ajuda" }, `1. ${aluno.nome} (${aluno.matricula})`),
      linhas.map((l) => h("div", { class: "linha-num", style: { margin: "6px 0" } }, l.nome, l.mat)),
      erro, h("button", { class: "btn largo", type: "submit" }, "Entrar com a equipe")));
}

function pedirCodigo(el, aluno) {
  const inp = h("input", { class: "codigo-input", inputmode: "numeric", maxlength: 6, placeholder: "000000", "aria-label": "Código da sala" });
  const status = h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "⏳"), h("p", {}, "Procurando o quiz da turma…"));
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "🏆 Quiz"), status,
    h("form", { class: "cartao", onsubmit: (e) => { e.preventDefault(); const c = inp.value.replace(/\D/g, ""); if (c.length === 6) location.hash = `#quiz/${c}`; else toast("O código tem 6 dígitos.", "erro"); } },
      h("label", {}, "Ou digite o código que está na tela do professor"), inp,
      h("button", { class: "btn largo", type: "submit" }, "Entrar na sala")));
  if (!online()) return limpar(status, h("p", {}, "Sem conexão com o servidor. Verifique a internet e recarregue a página."));
  // link fixo da turma (QR code do slide): entra sozinho no quiz que o professor abrir
  const fb = api();
  const meu = geracao;
  desligar.push(fb.ouvirTurma(aluno.turma, async (t) => {
    if (meu !== geracao) return;
    if (t?.salaAtual) {
      const sala = await fb.lerSala(t.salaAtual).catch(() => null);
      if (meu !== geracao) return;
      if (sala && sala.estado !== "fim") { location.hash = `#quiz/${t.salaAtual}`; return; }
    }
    limpar(status, h("div", { class: "grande" }, "🙋"), h("h2", {}, `Tudo certo, ${aluno.nome.split(" ")[0]}!`),
      h("p", {}, "Aguarde: quando o professor abrir o quiz, você entra sozinho."), h("p", { class: "ajuda" }, `Turma ${aluno.turma}`));
  }));
}
