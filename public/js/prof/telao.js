// Competição ao vivo — telão do professor (projetado em sala).
import { h, limpar, toast, carregarJSON } from "../ui/dom.js";
import { prepararCompeticao, perguntaPublica } from "../core/competicao.js";
import { aplicarRodada, ranking } from "../core/pontuacao.js";
import * as fb from "../fb.js";
import { TURMA_PADRAO } from "../config.js";
import { plural } from "../core/mensagens.js";

const FORMAS = ["▲", "◆", "●", "■"];
const IMG = "conteudo/uvvis/";
let desligar = [];
const parar = () => { desligar.forEach((f) => f()); desligar = []; };
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#sala")) parar(); });

// ---------- criar ----------
export async function telaNova(el) {
  parar();
  const [blocos, banco] = await Promise.all([carregarJSON(IMG + "blocos.json"), fb.lerBanco("uvvis")]);
  if (!banco?.length) return limpar(el, h("div", { class: "cartao" },
    h("h2", {}, "Carregue as perguntas primeiro"), h("p", {}, "Vá à aba Perguntas e escolha o arquivo privado/uvvis-competicao.json."),
    h("a", { class: "btn", href: "#perguntas" }, "Ir para Perguntas")));
  const conta = (n) => banco.filter((q) => q.bloco === n).length;
  const caixas = blocos.map((b) => ({ n: b.n, el: h("input", { type: "checkbox", checked: true }) }));
  const nPerg = h("input", { type: "number", min: 1, max: banco.length, value: Math.min(10, banco.length) });
  const tempo = h("select", {});
  const modo = h("select", {}, h("option", { value: "individual" }, "Individual (cada um no seu celular)"), h("option", { value: "equipe" }, "Em equipes (um celular por equipe)"));
  const opcoesTempo = () => {
    const ops = modo.value === "equipe" ? [45, 60, 90] : [10, 20, 30];
    const padrao = modo.value === "equipe" ? 60 : 20;
    tempo.replaceChildren(...ops.map((s) => h("option", { value: s, selected: s === padrao }, `${s} s`)));
  };
  modo.addEventListener("change", opcoesTempo);
  opcoesTempo();
  const turma = h("input", { value: TURMA_PADRAO, maxlength: 20 });
  const criar = async (e) => {
    e.preventDefault();
    const sel = caixas.filter((c) => c.el.checked).map((c) => c.n);
    if (!sel.length) return toast("Escolha ao menos um bloco.", "erro");
    const qs = prepararCompeticao(banco, { blocos: sel, n: Number(nPerg.value) || 10 });
    if (!/^[\w-]{1,20}$/.test(turma.value)) return toast("Turma: use letras, números e hífen.", "erro");
    const limiteMs = Number(tempo.value) * 1000;
    const codigo = await fb.criarSala({ turma: turma.value, modulo: "uvvis", limiteMs, total: qs.length, modo: modo.value });
    await fb.salvarBanco(`sala-${codigo}`, qs); // gabarito desta sala, só o professor lê
    location.hash = `#sala/${codigo}`;
  };
  limpar(el, h("h1", {}, "🏆 Novo quiz"),
    h("form", { class: "cartao", onsubmit: criar },
      h("h3", {}, "Blocos"),
      h("div", { class: "blocos-sel" }, blocos.map((b, i) => h("label", {}, caixas[i].el, `${b.n}. ${b.titulo} (${conta(b.n)})`))),
      h("label", {}, "Modo"), modo,
      h("div", { class: "grade", style: { gridTemplateColumns: "repeat(3, 1fr)" } },
        h("div", {}, h("label", {}, "Nº de perguntas"), nPerg),
        h("div", {}, h("label", {}, "Tempo por pergunta"), tempo),
        h("div", {}, h("label", {}, "Turma"), turma)),
      h("p", {}, h("button", { class: "btn", type: "submit" }, "Criar sala"))));
}

// ---------- sala ----------
export async function telaSala(el, codigo) {
  parar();
  const qs = await fb.lerBanco(`sala-${codigo}`);
  let sala = await fb.lerSala(codigo);
  if (!sala || !qs) return limpar(el, h("p", { class: "aviso" }, `Sala ${codigo} não encontrada.`), h("a", { class: "btn", href: "#comp" }, "Novo quiz"));
  const emEquipe = sala.modo === "equipe";
  const rotJog = (n) => emEquipe ? `${n} ${n === 1 ? "equipe" : "equipes"}` : `${n} ${n === 1 ? "jogador" : "jogadores"}`;
  let jogadores = [], nResp = 0, fechando = false, ocupado = false, tic = null, cancelarNResp = null;
  // diferença entre o relógio do servidor e o deste computador (medida ao abrir cada pergunta)
  let desvio = Number(sessionStorage.getItem(`desvio:${codigo}`)) || 0;
  const area = h("div", { class: "telao" });
  limpar(el, h("p", { class: "ajuda" }, "Conectando…"));
  desligar.push(() => clearInterval(tic), () => cancelarNResp?.());
  // espera a lista de jogadores antes de desenhar (evita nomes "?" ao retomar)
  await new Promise((ok) => {
    let primeira = true;
    desligar.push(fb.ouvirJogadores(codigo, (js) => {
      jogadores = js;
      if (primeira) { primeira = false; return ok(); }
      if (sala.estado === "lobby") render();
    }));
  });
  limpar(el, area);

  const urlAluno = () => {
    const base = location.href.split("#")[0].replace(/professor\.html.*$/, "");
    return `${base}index.html?t=${encodeURIComponent(sala.turma)}#quiz/${codigo}`;
  };
  const qrSvg = (txt) => { const q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); };
  const nomes = () => Object.fromEntries(jogadores.map((j) => [j.uid, String(j.nome ?? "?")]));

  // impede clique duplo em Começar/Próxima/Encerrar
  const umaVez = (fn) => async (...a) => {
    if (ocupado) return;
    ocupado = true;
    area.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try { await fn(...a); } catch (e) { console.error(e); toast("Falha de conexão — tente de novo.", "erro"); render(); }
    finally { ocupado = false; }
  };

  const abrir = umaVez(async (i) => {
    const antes = Date.now();
    await fb.abrirPergunta(codigo, i, perguntaPublica(qs[i]));
    sala = await fb.lerSala(codigo);
    desvio = sala.abertaEmMs - (antes + Date.now()) / 2;
    sessionStorage.setItem(`desvio:${codigo}`, String(desvio));
    render();
  });

  // Fecha a rodada em duas etapas (ver fb.iniciarFechamento / fb.revelar): pontua uma vez só.
  const fechar = async () => {
    if (fechando) return;
    fechando = true;
    clearInterval(tic);
    try {
      const i = sala.indice;
      const decisao = await fb.iniciarFechamento(codigo, i);
      if (decisao !== "ignorar") {
        const [s, resp, atual] = await Promise.all([fb.lerSala(codigo), fb.respostasDaRodada(codigo, i), fb.lerPlacar(codigo)]);
        const base = Object.fromEntries(jogadores.map((j) => [j.uid, atual[j.uid] ?? { nome: String(j.nome ?? "?"), pontos: 0, somaDtAcertos: 0, acertos: 0 }]));
        const rodada = resp.map((r) => ({ uid: r.uid, alternativa: r.alternativa, dtMs: (r.quandoMs ?? s.abertaEmMs + s.limiteMs) - s.abertaEmMs }));
        const novo = aplicarRodada({ ...atual, ...base }, rodada, qs[i].correta, s.limiteMs, nomes());
        await fb.revelar(codigo, i, qs[i].correta, novo);
      }
      sala = await fb.lerSala(codigo);
      render();
    } catch (e) { console.error(e); toast("Falha ao fechar a rodada — clique em Encerrar tempo de novo.", "erro"); }
    finally { fechando = false; }
  };

  const proxima = umaVez(async () => {
    if (sala.indice + 1 >= qs.length) { await fb.encerrar(codigo); sala = await fb.lerSala(codigo); return render(); }
    ocupado = false;
    await abrir(sala.indice + 1);
  });

  const cartaoPergunta = (q, revelar, dist) => h("div", {},
    h("div", { class: "enunciado-tela", html: q.enunciado }),
    q.figura ? h("div", { class: "centro" }, h("img", { class: "figura", src: IMG + q.figura, alt: "" })) : null,
    dist ? h("div", { class: "barras" }, q.alternativas.map((_, k) => {
      const max = Math.max(1, ...dist);
      return h("div", { class: `k${k}`, style: { height: `${14 + (86 * dist[k]) / max}%`, opacity: revelar && k !== q.correta ? 0.35 : 1 } }, `${FORMAS[k]} ${dist[k]}`);
    })) : null,
    h("div", { class: "t-alts" }, q.alternativas.map((a, k) => h("div", {
      class: `t-alt k${k} ${revelar ? (k === q.correta ? "certa" : "apagada") : ""}` },
      h("span", {}, FORMAS[k]), h("span", { html: a })))));

  const top = (n) => ranking(Object.fromEntries(Object.entries(nomesPlacar).filter(([u]) => u))).slice(0, n);
  let nomesPlacar = {};

  const render = async () => {
    clearInterval(tic);
    cancelarNResp?.(); cancelarNResp = null;
    const cab = h("div", { class: "abas", style: { fontSize: "1rem" } },
      h("b", {}, `Sala ${codigo}`), h("span", {}, `turma ${sala.turma}`),
      sala.indice >= 0 ? h("span", {}, `pergunta ${sala.indice + 1}/${qs.length}`) : null,
      emEquipe ? h("span", {}, "👥 em equipes") : null,
      h("span", { class: "quem" }, rotJog(jogadores.length)));

    if (sala.estado === "lobby") {
      return limpar(area, cab, h("div", { class: "lobby" },
        h("div", { class: "qr", html: qrSvg(urlAluno()) }),
        h("div", {},
          h("p", {}, "Leia o QR code ou entre no site e digite o código:"),
          h("div", { class: "codigo-grande" }, codigo),
          h("p", { class: "ajuda", style: { fontSize: ".9rem", wordBreak: "break-all" } }, urlAluno()),
          emEquipe ? h("p", { class: "ajuda" }, "Um celular por equipe: discutam e enviem uma resposta.") : null,
          h("div", { class: "nomes" }, jogadores.map((j) => h("span", {}, j.membros ? `👥 ${String(j.nome)} (${j.membros.length})` : String(j.nome)))),
          h("div", { class: "linha-acoes", style: { justifyContent: "flex-start" } },
            h("button", { class: "btn", onclick: () => abrir(0), disabled: !jogadores.length }, `Começar (${qs.length} perguntas)`)))));
    }

    if (sala.estado === "pergunta") {
      const q = qs[sala.indice];
      const relogio = h("div", { class: "relogio" });
      const contagem = h("span");
      const fim = (sala.abertaEmMs ?? Date.now() + desvio) + sala.limiteMs - desvio; // em hora local
      const tick = () => {
        const s = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
        relogio.textContent = s;
        if (s === 0) fechar();
      };
      tick();
      tic = setInterval(tick, 250);
      cancelarNResp = fb.ouvirNumRespostas(codigo, sala.indice, (n) => {
        nResp = n; contagem.textContent = `${n}/${rotJog(jogadores.length)} responderam`;
        if (jogadores.length && n >= jogadores.length) fechar();
      });
      return limpar(area, cab, relogio, cartaoPergunta(q, false, null),
        h("div", { class: "linha-acoes" }, contagem, h("button", { class: "btn sec", onclick: fechar }, "Encerrar tempo")));
    }

    if (sala.estado === "fechando") {
      limpar(area, cab, h("div", { class: "relogio" }, "⏳"), h("p", { class: "centro" }, "Calculando os pontos…"));
      return fechar(); // retoma um fechamento interrompido
    }

    if (sala.estado === "revelada") {
      const q = qs[sala.indice];
      const resp = await fb.respostasDaRodada(codigo, sala.indice);
      const dist = q.alternativas.map((_, k) => resp.filter((r) => r.alternativa === k).length);
      nomesPlacar = await fb.lerPlacar(codigo);
      const ultima = sala.indice + 1 >= qs.length;
      return limpar(area, cab, cartaoPergunta(q, true, dist),
        h("div", { class: "cartao", style: { fontSize: "1.2rem" } }, h("b", {}, "Por quê? "), h("span", { html: q.explicacao })),
        h("h2", {}, "Top 5"),
        h("ol", { class: "ranking" }, top(5).map((p) => h("li", {}, h("span", {}, `${p.posicao}º ${p.nome}`), h("b", {}, `${p.pontos}`)))),
        h("div", { class: "linha-acoes" }, h("button", { class: "btn", onclick: proxima }, ultima ? "🏁 Ver pódio" : "Próxima pergunta →")));
    }

    if (sala.estado === "fim") {
      nomesPlacar = await fb.lerPlacar(codigo);
      const r = top(1000);
      const membrosDe = (uid) => jogadores.find((j) => j.uid === uid)?.membros?.map((m) => String(m?.nome ?? "").split(" ")[0]).join(", ");
      const deg = (p, cls, med) => p ? h("div", {}, h("div", { class: "nome" }, `${med} ${p.nome}`),
        membrosDe(p.uid) ? h("div", { class: "ajuda", style: { fontSize: "1rem" } }, membrosDe(p.uid)) : null, h("div", { class: `deg ${cls}` }, `${p.pontos} pts`, h("br"), plural(p.acertos, "acerto", "acertos"))) : h("div");
      const lista = h("ol", { class: "ranking oculto" }, r.map((p) => h("li", {}, h("span", {}, `${p.posicao}º ${p.nome}`), h("b", {}, `${p.pontos} · ${p.acertos} ✓`))));
      return limpar(area, cab, h("h1", { class: "centro" }, "🏆 Pódio — hora do chocolate! 🍫"),
        h("div", { class: "podio" }, deg(r[1], "p2", "🥈"), deg(r[0], "p1", "🥇"), deg(r[2], "p3", "🥉")),
        h("div", { class: "linha-acoes" },
          h("button", { class: "btn sec", onclick: () => lista.classList.toggle("oculto") }, "Mostrar ranking completo"),
          h("a", { class: "btn", href: "#comp" }, "Novo quiz")),
        lista);
    }
  };

  render();
}
