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
  const tempo = h("select", {}, [10, 20, 30].map((s) => h("option", { value: s, selected: s === 20 }, `${s} s`)));
  const turma = h("input", { value: TURMA_PADRAO, maxlength: 20 });
  const criar = async (e) => {
    e.preventDefault();
    const sel = caixas.filter((c) => c.el.checked).map((c) => c.n);
    if (!sel.length) return toast("Escolha ao menos um bloco.", "erro");
    const qs = prepararCompeticao(banco, { blocos: sel, n: Number(nPerg.value) || 10 });
    if (!/^[\w-]{1,20}$/.test(turma.value)) return toast("Turma: use letras, números e hífen.", "erro");
    const limiteMs = Number(tempo.value) * 1000;
    const codigo = await fb.criarSala({ turma: turma.value, modulo: "uvvis", limiteMs, total: qs.length });
    await fb.salvarBanco(`sala-${codigo}`, qs); // gabarito desta sala, só o professor lê
    location.hash = `#sala/${codigo}`;
  };
  limpar(el, h("h1", {}, "🏆 Novo quiz"),
    h("form", { class: "cartao", onsubmit: criar },
      h("h3", {}, "Blocos"),
      h("div", { class: "blocos-sel" }, blocos.map((b, i) => h("label", {}, caixas[i].el, `${b.n}. ${b.titulo} (${conta(b.n)})`))),
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
  let jogadores = [], nResp = 0, fechando = false, tic = null, cancelarNResp = null;
  const area = h("div", { class: "telao" });
  limpar(el, area);
  desligar.push(() => clearInterval(tic), () => cancelarNResp?.());

  const urlAluno = () => {
    const base = location.href.split("#")[0].replace(/professor\.html.*$/, "");
    return `${base}index.html?t=${encodeURIComponent(sala.turma)}#quiz/${codigo}`;
  };
  const qrSvg = (txt) => { const q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); };
  const nomes = () => Object.fromEntries(jogadores.map((j) => [j.uid, j.nome]));

  const abrir = async (i) => {
    const q = qs[i];
    await fb.abrirPergunta(codigo, i, perguntaPublica(q), sala.limiteMs);
    sala = await fb.lerSala(codigo);
    render();
  };

  const fechar = async () => {
    if (fechando || sala.estado !== "pergunta") return;
    fechando = true;
    clearInterval(tic);
    try {
      const s = await fb.lerSala(codigo);
      const resp = await fb.respostasDaRodada(codigo, s.indice);
      const atual = await fb.lerPlacar(codigo);
      const base = Object.fromEntries(jogadores.map((j) => [j.uid, atual[j.uid] ?? { nome: j.nome, pontos: 0, somaDtAcertos: 0, acertos: 0 }]));
      const rodada = resp.map((r) => ({ uid: r.uid, alternativa: r.alternativa, dtMs: (r.quandoMs ?? s.fechaEmMs) - s.abertaEmMs }));
      const novo = aplicarRodada({ ...atual, ...base }, rodada, qs[s.indice].correta, s.limiteMs, nomes());
      await fb.revelar(codigo, qs[s.indice].correta, novo);
      sala = await fb.lerSala(codigo);
      render();
    } catch (e) { console.error(e); toast("Falha ao fechar a rodada — tente de novo.", "erro"); }
    finally { fechando = false; }
  };

  const proxima = async () => {
    if (sala.indice + 1 >= qs.length) { await fb.encerrar(codigo); sala = await fb.lerSala(codigo); return render(); }
    await abrir(sala.indice + 1);
  };

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
      h("span", { class: "quem" }, `${jogadores.length} jogadores`));

    if (sala.estado === "lobby") {
      return limpar(area, cab, h("div", { class: "lobby" },
        h("div", { class: "qr", html: qrSvg(urlAluno()) }),
        h("div", {},
          h("p", {}, "Leia o QR code ou entre no site e digite o código:"),
          h("div", { class: "codigo-grande" }, codigo),
          h("p", { class: "ajuda", style: { fontSize: ".9rem", wordBreak: "break-all" } }, urlAluno()),
          h("div", { class: "nomes" }, jogadores.map((j) => h("span", {}, j.nome))),
          h("div", { class: "linha-acoes", style: { justifyContent: "flex-start" } },
            h("button", { class: "btn", onclick: () => abrir(0), disabled: !jogadores.length }, `Começar (${qs.length} perguntas)`)))));
    }

    if (sala.estado === "pergunta") {
      const q = qs[sala.indice];
      const relogio = h("div", { class: "relogio" });
      const contagem = h("span");
      const fim = (sala.fechaEmMs ?? Date.now()) - 1500;
      const tick = () => {
        const s = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
        relogio.textContent = s;
        if (s === 0) fechar();
      };
      tick();
      tic = setInterval(tick, 250);
      cancelarNResp = fb.ouvirNumRespostas(codigo, sala.indice, (n) => {
        nResp = n; contagem.textContent = `${n}/${jogadores.length} responderam`;
        if (jogadores.length && n >= jogadores.length) fechar();
      });
      return limpar(area, cab, relogio, cartaoPergunta(q, false, null),
        h("div", { class: "linha-acoes" }, contagem, h("button", { class: "btn sec", onclick: fechar }, "Encerrar tempo")));
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
      const deg = (p, cls, med) => p ? h("div", {}, h("div", { class: "nome" }, `${med} ${p.nome}`), h("div", { class: `deg ${cls}` }, `${p.pontos} pts`, h("br"), plural(p.acertos, "acerto", "acertos"))) : h("div");
      const lista = h("ol", { class: "ranking oculto" }, r.map((p) => h("li", {}, h("span", {}, `${p.posicao}º ${p.nome}`), h("b", {}, `${p.pontos} · ${p.acertos} ✓`))));
      return limpar(area, cab, h("h1", { class: "centro" }, "🏆 Pódio — hora do chocolate! 🍫"),
        h("div", { class: "podio" }, deg(r[1], "p2", "🥈"), deg(r[0], "p1", "🥇"), deg(r[2], "p3", "🥉")),
        h("div", { class: "linha-acoes" },
          h("button", { class: "btn sec", onclick: () => lista.classList.toggle("oculto") }, "Mostrar ranking completo"),
          h("a", { class: "btn", href: "#comp" }, "Novo quiz")),
        lista);
    }
  };

  desligar.push(fb.ouvirJogadores(codigo, (js) => {
    jogadores = js;
    if (sala.estado === "lobby") render();
  }));
  render();
}
