// Competição ao vivo — lado do aluno.
import { h, limpar, ls, toast } from "../ui/dom.js";
import { topo } from "./menu.js";
import { api, online } from "./dados.js";
import { incentivo } from "../core/mensagens.js";

export const FORMAS = ["▲", "◆", "●", "■"];
let desligar = [];
const parar = () => { desligar.forEach((f) => f()); desligar = []; };
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#quiz")) parar(); });

export async function telaCompeticao(el, aluno, codigo) {
  parar();
  if (!codigo || !/^\d{6}$/.test(codigo)) return pedirCodigo(el, aluno);
  if (!online()) return limpar(el, topo(aluno, "#menu"), h("div", { class: "cartao" },
    h("p", {}, "Sem conexão com o servidor. Verifique a internet e recarregue a página."),
    h("button", { class: "btn", onclick: () => location.reload() }, "Recarregar")));
  const fb = api();
  try { await fb.entrarSala(codigo, aluno); } catch (e) { console.warn(e); }

  const minhas = ls.get(`comp:${codigo}`, {}); // índice → alternativa escolhida
  let sala = null, placar = {}, tic = null;
  desligar.push(() => clearInterval(tic));
  const corpo = h("div");
  limpar(el, topo(aluno, "#menu"), corpo);

  const meuPlacar = () => {
    const lista = Object.entries(placar).sort((a, b) => b[1].pontos - a[1].pontos || a[1].somaDtAcertos - b[1].somaDtAcertos);
    const pos = lista.findIndex(([u]) => u === fb.uid());
    return { pos: pos + 1, total: lista.length, pontos: placar[fb.uid()]?.pontos ?? 0 };
  };

  const render = () => {
    clearInterval(tic);
    if (!sala) return limpar(corpo, h("div", { class: "cartao status-grande" }, h("div", { class: "grande" }, "🤔"),
      h("p", {}, `Sala ${codigo} não encontrada.`), h("a", { class: "btn", href: "#quiz" }, "Digitar outro código")));
    const p = meuPlacar();
    const cab = h("div", { class: "ajuda centro" }, `Sala ${codigo}`, sala.indice >= 0 ? ` · pergunta ${sala.indice + 1} de ${sala.total}` : "", ` · ${p.pontos} pts`);

    if (sala.estado === "lobby") return limpar(corpo, cab, h("div", { class: "cartao status-grande" },
      h("div", { class: "grande" }, "✅"), h("h2", {}, "Você está dentro!"), h("p", {}, `${aluno.nome}, aguarde o professor começar.`),
      h("p", { class: "ajuda" }, "Olhe para o telão: a pergunta aparece lá e aqui.")));

    if (sala.estado === "pergunta") {
      const escolhida = minhas[sala.indice];
      const q = sala.pergunta;
      const barra = h("div");
      const restante = () => Math.max(0, (sala.fechaEmMs ?? 0) - 1500 - Date.now());
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
          toast(e.code === "permission-denied" ? "Tempo esgotado: a resposta não foi aceita." : "Falha de conexão: tente de novo.", "erro");
          if (e.code !== "permission-denied") { delete minhas[sala.indice]; ls.set(`comp:${codigo}`, minhas); render(); }
        }
      };
      return limpar(corpo, cab, barra,
        h("div", { class: "cartao" }, h("p", { class: "enunciado", html: q.enunciado }),
          escolhida != null ? h("p", { class: "centro" }, h("b", {}, "Resposta enviada! "), "Aguarde o fim do tempo.") : null,
          h("div", { class: "k-alts" }, q.alternativas.map((a, k) => h("button", {
            class: `k-alt k${k} ${escolhida === k ? "escolhida" : ""}`, disabled: escolhida != null,
            onclick: () => responder(k) }, h("span", { class: "forma", "aria-hidden": "true" }, FORMAS[k]), h("span", { html: a }))))));
    }

    if (sala.estado === "revelada") {
      const escolhida = minhas[sala.indice];
      const acertou = escolhida === sala.correta;
      return limpar(corpo, cab, h("div", { class: "cartao status-grande", style: { background: acertou ? "#E3F7EC" : "#FFF6E0" } },
        h("div", { class: "grande" }, escolhida == null ? "⏳" : acertou ? "🎉" : "💪"),
        h("h2", {}, escolhida == null ? "O tempo voou! Na próxima você responde." : incentivo(acertou)),
        h("p", {}, "Resposta: ", h("b", { html: `${FORMAS[sala.correta]} ${sala.pergunta.alternativas[sala.correta]}` })),
        h("p", { class: "grande", style: { fontSize: "1.6rem" } }, `${p.pontos} pts`),
        p.pos ? h("p", {}, `Você está em ${p.pos}º de ${p.total}`) : null));
    }

    if (sala.estado === "fim") return limpar(corpo, cab, h("div", { class: "cartao status-grande" },
      h("div", { class: "grande" }, p.pos === 1 ? "🥇" : p.pos === 2 ? "🥈" : p.pos === 3 ? "🥉" : "🏁"),
      h("h2", {}, "Fim de jogo!"), h("p", { class: "grande", style: { fontSize: "1.6rem" } }, `${p.pontos} pts`),
      p.pos ? h("p", {}, `Posição final: ${p.pos}º de ${p.total}`) : null,
      p.pos && p.pos <= 3 ? h("p", {}, "🍫 Vá buscar seu prêmio com o professor!") : null));
  };

  desligar.push(fb.ouvirSala(codigo, (s) => { sala = s; render(); }));
  desligar.push(fb.ouvirPlacar(codigo, (pl) => { placar = pl; if (sala?.estado !== "pergunta") render(); }));
}

function pedirCodigo(el, aluno) {
  const inp = h("input", { class: "codigo-input", inputmode: "numeric", maxlength: 6, placeholder: "000000", "aria-label": "Código da sala" });
  limpar(el, topo(aluno, "#menu"), h("h1", {}, "🏆 Quiz"),
    h("form", { class: "cartao", onsubmit: (e) => { e.preventDefault(); const c = inp.value.replace(/\D/g, ""); if (c.length === 6) location.hash = `#quiz/${c}`; else toast("O código tem 6 dígitos.", "erro"); } },
      h("label", {}, "Código que está no telão"), inp, h("p", { class: "ajuda" }, "Ou leia o QR code do telão com a câmera."),
      h("button", { class: "btn largo", type: "submit" }, "Entrar na sala")));
  inp.focus();
}
