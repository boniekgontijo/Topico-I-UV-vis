// Competição ao vivo — telão do professor (projetado em sala).
import { h, limpar, toast, carregarJSON } from "../ui/dom.js";
import { prepararCompeticao, perguntaPublica, infoRodada } from "../core/competicao.js";
import { aplicarRodada, ranking } from "../core/pontuacao.js";
import * as fb from "../fb.js";
import { TURMA_PADRAO } from "../config.js";
import { plural } from "../core/mensagens.js";

import { FORMAS_QUIZ as FORMAS } from "../core/competicao.js";
import { MODULOS } from "../core/modulo.js";
import { alternativa } from "../ui/alternativa.js";
import { desenharEspectroIV } from "../ui/espectro-iv.js";
let desligar = [];
const parar = () => { desligar.forEach((f) => f()); desligar = []; };
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#sala")) parar(); });

// ---------- criar ----------
// telaNova(el, { slides: true, modulo }) = link direto professor.html#comp/slides[/iv] (sequência dos slides já escolhida)
export async function telaNova(el, { slides = false, modulo = "uvvis" } = {}) {
  parar();
  const mod = modulo in MODULOS ? modulo : "uvvis";
  const [blocos, bancoDoc] = await Promise.all([carregarJSON(MODULOS[mod].base + "blocos.json"), fb.lerBancoCompleto(mod)]);
  const banco = bancoDoc?.questoes, sequencia = bancoDoc?.sequencia ?? [];
  const seletor = h("div", { class: "abas" }, h("b", {}, "Módulo:"), Object.entries(MODULOS).map(([k, v]) =>
    h("a", { href: slides ? `#comp/slides/${k}` : `#comp/${k}`, class: k === mod ? "ativa" : "" }, v.titulo)));
  if (!banco?.length) return limpar(el, seletor, h("div", { class: "cartao" },
    h("h2", {}, "Carregue as perguntas primeiro"), h("p", {}, `Vá à aba Perguntas e escolha o arquivo privado/${mod}-competicao.json.`),
    h("a", { class: "btn", href: "#perguntas" }, "Ir para Perguntas")));
  const conta = (n) => banco.filter((q) => q.bloco === n).length;
  const caixas = blocos.map((b) => ({ n: b.n, el: h("input", { type: "checkbox", checked: true }) }));
  const ordem = h("select", { onchange: () => { if (ordem.value === "slides") { nRodadas.value = "2"; porRodada.value = "10"; } } },
    sequencia.length ? h("option", { value: "slides" }, `Sequência dos slides (${sequencia.length} perguntas, ordem fixa)`) : null,
    h("option", { value: "sorteio" }, "Sortear perguntas agora"));
  const nRodadas = h("select", {}, [1, 2, 3].map((n) => h("option", { value: n, selected: n === 2 }, `${n}`)));
  const porRodada = h("select", {}, [5, 10].map((n) => h("option", { value: n, selected: n === 10 }, `${n}`)));
  const tempo = h("select", {});
  const modo = h("select", {}, h("option", { value: "individual" }, "Individual (cada um no seu celular)"), h("option", { value: "equipe" }, "Em equipes (um celular por equipe)"));
  const opcoesTempo = () => {
    const ops = modo.value === "equipe" ? [60, 90, 120, 180] : [20, 30, 60, 90, 120];
    const padrao = 120; // 2 min por pergunta: tempo para discutir antes de votar
    const rot = (s) => (s % 60 ? `${s} s` : `${s / 60} min`);
    tempo.replaceChildren(...ops.map((s) => h("option", { value: s, selected: s === padrao }, rot(s))));
  };
  modo.addEventListener("change", opcoesTempo);
  opcoesTempo();
  const turma = h("input", { value: TURMA_PADRAO, maxlength: 20 });
  const criar = async (e) => {
    e.preventDefault();
    const sel = caixas.filter((c) => c.el.checked).map((c) => c.n);
    if (!sel.length && ordem.value !== "slides") return toast("Escolha ao menos um bloco.", "erro");
    const n = Number(nRodadas.value) * Number(porRodada.value);
    const qs = ordem.value === "slides" ? sequencia.slice(0, n) : prepararCompeticao(banco, { blocos: sel, n });
    if (qs.length < n) toast(`Só há ${qs.length} perguntas nos blocos escolhidos; o quiz terá ${qs.length}.`);
    if (!/^[\w-]{1,20}$/.test(turma.value)) return toast("Turma: use letras, números e hífen.", "erro");
    const limiteMs = Number(tempo.value) * 1000;
    const codigo = await fb.criarSala({ turma: turma.value, modulo: mod, limiteMs, total: qs.length, porRodada: Number(porRodada.value), modo: modo.value });
    await fb.salvarBanco(`sala-${codigo}`, qs); // gabarito desta sala, só o professor lê
    location.hash = `#sala/${codigo}`;
  };
  if (slides && !sequencia.length) toast("A sequência dos slides não está carregada: vá à aba Perguntas e carregue o arquivo do quiz.", "erro");
  limpar(el, seletor, h("h1", {}, `${slides && sequencia.length ? "🏆 Quiz dos slides" : "🏆 Novo quiz"} — ${MODULOS[mod].titulo}`),
    slides && sequencia.length ? h("p", { class: "ajuda" }, `As ${sequencia.length} perguntas dos slides, na mesma ordem: confira o modo e o tempo e toque em Criar sala.`) : null,
    h("form", { class: "cartao", onsubmit: criar },
      h("h3", {}, "Blocos"),
      h("div", { class: "blocos-sel" }, blocos.map((b, i) => h("label", {}, caixas[i].el, `${b.n}. ${b.titulo} (${conta(b.n)})`))),
      h("label", {}, "Ordem das perguntas"), ordem,
      h("label", {}, "Modo"), modo,
      h("div", { class: "grade", style: { gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" } },
        h("div", {}, h("label", {}, "Rodadas"), nRodadas),
        h("div", {}, h("label", {}, "Perguntas por rodada"), porRodada),
        h("div", {}, h("label", {}, "Tempo por pergunta"), tempo),
        h("div", {}, h("label", {}, "Turma"), turma)),
      h("p", {}, h("button", { class: "btn", type: "submit" }, "Criar sala"))));
}

// ---------- sala ----------
export async function telaSala(el, codigo) {
  parar();
  const qs = await fb.lerBanco(`sala-${codigo}`);
  let sala = await fb.lerSala(codigo);
  const IMG = MODULOS[sala?.modulo ?? "uvvis"]?.base ?? MODULOS.uvvis.base;
  if (!sala || !qs) return limpar(el, h("p", { class: "aviso" }, `Sala ${codigo} não encontrada.`), h("a", { class: "btn", href: "#comp" }, "Novo quiz"));
  // reabrir uma sala pelo link #sala/<código> faz dela a sala atual da turma (o QR fixo leva para ela)
  if (sala.estado !== "fim") fb.marcarSalaAtual(sala.turma, codigo).catch((e) => console.warn(e));
  const emEquipe = sala.modo === "equipe";
  const rotJog = (n) => emEquipe ? `${n} ${n === 1 ? "equipe" : "equipes"}` : `${n} ${n === 1 ? "jogador" : "jogadores"}`;
  let jogadores = [], nResp = 0, fechando = false, ocupado = false, tic = null, cancelarNResp = null;
  // diferença entre o relógio do servidor e o deste computador (medida ao abrir cada pergunta)
  let desvio = Number(sessionStorage.getItem(`desvio:${codigo}`)) || 0;
  const area = h("div", { class: "telao" });
  limpar(el, h("p", { class: "ajuda" }, "Conectando…"));
  desligar.push(() => clearInterval(tic), () => cancelarNResp?.());
  // espera a lista de jogadores antes de desenhar (evita nomes "?" ao retomar), mas no máximo 6 s
  let erroJogadores = null;
  await new Promise((ok) => {
    let primeira = true;
    const pronto = () => { if (primeira) { primeira = false; ok(); return true; } return false; };
    setTimeout(pronto, 6000);
    desligar.push(fb.ouvirJogadores(codigo, (js) => {
      jogadores = js; erroJogadores = null;
      if (pronto()) return;
      if (sala.estado === "lobby") render();
    }, (e) => {
      console.error(e);
      erroJogadores = `Não consegui ler a lista de alunos (${e.code ?? e.message}).`;
      if (!pronto() && sala.estado === "lobby") render();
    }));
  });
  limpar(el, area);

  const urlAluno = () => {
    // o MESMO link fixo dos slides (QR igual): o aluno entra sozinho na sala atual da turma (turmas/{t}.salaAtual)
    const base = location.href.split("#")[0].replace(/professor\.html.*$/, "");
    return `${base}?t=${encodeURIComponent(sala.turma)}${sala.modulo === "iv" ? "&m=iv" : ""}#quiz`;
  };
  const qrSvg = (txt) => { const q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); };
  const rotulo = (j) => `${j.avatar ? j.avatar + " " : ""}${String(j.nome ?? "?")}`;
  const nomes = () => Object.fromEntries(jogadores.map((j) => [j.uid, rotulo(j)]));

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
        const base = Object.fromEntries(jogadores.map((j) => [j.uid, atual[j.uid] ?? { nome: rotulo(j), pontos: 0, somaDtAcertos: 0, acertos: 0 }]));
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
    q.bandas ? (() => { const d = h("div", { class: "espectro-tela" }); desenharEspectroIV(d, q.bandas, { altura: 200 }); return d; })() : null,
    q.figura ? h("div", { class: "centro" }, h("img", { class: "figura", src: IMG + q.figura, alt: "" })) : null,
    revelar && q.figuraResposta ? h("div", { class: "centro" }, h("img", { class: "figura", src: IMG + q.figuraResposta, alt: "" })) : null,
    dist ? h("div", { class: "barras" }, q.alternativas.map((_, k) => {
      const max = Math.max(1, ...dist);
      return h("div", { class: `k${k}`, style: { height: `${14 + (86 * dist[k]) / max}%`, opacity: revelar && k !== q.correta ? 0.35 : 1 } }, `${FORMAS[k]} ${dist[k]}`);
    })) : null,
    h("div", { class: "t-alts" }, q.alternativas.map((a, k) => h("div", {
      class: `t-alt k${k} ${revelar ? (k === q.correta ? "certa" : "apagada") : ""}` },
      h("span", {}, FORMAS[k]), alternativa(a, IMG, k)))));

  const top = (n) => ranking(Object.fromEntries(Object.entries(nomesPlacar).filter(([u]) => u))).slice(0, n);
  let nomesPlacar = {};

  const render = () => desenhar().catch((e) => {
    console.error(e);
    limpar(area, h("p", { class: "aviso" }, `Erro ao desenhar a sala: ${e.message}`), h("button", { class: "btn", onclick: () => location.reload() }, "Recarregar"));
  });
  const desenhar = async () => {
    clearInterval(tic);
    cancelarNResp?.(); cancelarNResp = null;
    const cab = h("div", { class: "abas", style: { fontSize: "1rem" } },
      h("b", {}, `Sala ${codigo}`), h("span", {}, `turma ${sala.turma}`),
      sala.indice >= 0 ? (() => { const ri = infoRodada(sala.indice, sala.porRodada, qs.length);
        return h("span", {}, ri.totalRodadas > 1 ? `rodada ${ri.rodada}/${ri.totalRodadas} · pergunta ${ri.posNaRodada}` : `pergunta ${sala.indice + 1}/${qs.length}`); })() : null,
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
          h("div", { class: "nomes" }, jogadores.map((j) => h("span", {}, j.membros ? `${rotulo(j)} (${j.membros.length})` : rotulo(j)))),
          h("div", { class: "linha-acoes", style: { justifyContent: "flex-start" } },
            h("button", { class: "btn", onclick: () => abrir(0) }, `▶ Começar (${qs.length} perguntas)`)),
          erroJogadores ? h("p", { class: "aviso" }, erroJogadores, " Recarregue a página; se continuar, me mande esta mensagem.") : null)));
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
      }, (e) => { console.error(e); contagem.textContent = `(não consegui contar as respostas: ${e.code ?? e.message})`; });
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
      const ri = infoRodada(sala.indice, sala.porRodada, qs.length);
      const botao = ri.ultima ? h("button", { class: "btn", onclick: proxima }, "🏁 Ver pódio final")
        : ri.fimDaRodada ? h("button", { class: "btn", onclick: () => mostrarPodio(`🏁 Fim da rodada ${ri.rodada} — pódio parcial`,
            h("button", { class: "btn", onclick: proxima }, `▶ Começar rodada ${ri.rodada + 1}`)) }, `🏆 Pódio da rodada ${ri.rodada}`)
        : h("button", { class: "btn", onclick: proxima }, "Próxima pergunta →");
      return limpar(area, cab, cartaoPergunta(q, true, dist),
        h("div", { class: "cartao", style: { fontSize: "1.2rem" } }, h("b", {}, "Por quê? "), h("span", { html: q.explicacao })),
        h("h2", {}, "Top 5"),
        h("ol", { class: "ranking" }, top(5).map((p) => h("li", {}, h("span", {}, `${p.posicao}º ${p.nome}`), h("b", {}, `${p.pontos}`)))),
        h("div", { class: "linha-acoes" }, botao));
    }

    if (sala.estado === "fim") {
      nomesPlacar = await fb.lerPlacar(codigo);
      return mostrarPodio("🏆 Pódio final — hora do chocolate! 🍫", h("a", { class: "btn", href: "#comp" }, "Novo quiz"));
    }
  };

  // pódio (parcial entre rodadas ou final); a pontuação é acumulada
  function mostrarPodio(titulo, acao) {
    const r = top(1000);
    const membrosDe = (uid) => jogadores.find((j) => j.uid === uid)?.membros?.map((m) => String(m?.nome ?? "").split(" ")[0]).join(", ");
    const deg = (p, cls, med) => p ? h("div", {}, h("div", { class: "nome" }, `${med} ${p.nome}`),
      membrosDe(p.uid) ? h("div", { class: "ajuda", style: { fontSize: "1rem" } }, membrosDe(p.uid)) : null,
      h("div", { class: `deg ${cls}` }, `${p.pontos} pts`, h("br"), plural(p.acertos, "acerto", "acertos"))) : h("div");
    const lista = h("ol", { class: "ranking oculto" }, r.map((p) => h("li", {}, h("span", {}, `${p.posicao}º ${p.nome}`), h("b", {}, `${p.pontos} · ${p.acertos} ✓`))));
    limpar(area, h("h1", { class: "centro" }, titulo),
      h("div", { class: "podio" }, deg(r[1], "p2", "🥈"), deg(r[0], "p1", "🥇"), deg(r[2], "p3", "🥉")),
      h("div", { class: "linha-acoes" },
        h("button", { class: "btn sec", onclick: () => lista.classList.toggle("oculto") }, "Mostrar ranking completo"), acao),
      lista);
  }

  render();
}
