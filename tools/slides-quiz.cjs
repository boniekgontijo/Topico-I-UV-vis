// Gera os slides do quiz (registro + 2 rodadas + pódios) a partir da sequência fixa em privado/uvvis-competicao.json.
// Uso: node tools/slides-quiz.cjs   → ../Aula_UV-vis/UV-vis_quiz.pptx
// Estilo da aula: fundo branco, títulos em Comic Sans, corpo em Arial; alternativas com as cores/formas do celular.
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const pptxgen = require(path.resolve(__dirname, "../../Aula_UV-vis/build/node_modules/pptxgenjs"));
const SKILL = "/Users/boniek/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/22b5ad14-9e1f-49de-a582-d26e1a721ea2/3d30ba2d-58af-4b52-940c-6c3cc5a76685/skills/pptx";
const { applyTheme } = require(path.join(SKILL, "scripts/apply_theme.js"));

const SITE = "https://boniekgontijo.github.io/Topico-I-UV-vis/";
const TURMA = process.argv[2] || "2026-2";
const LINK = `${SITE}?t=${TURMA}#quiz`; // link fixo: leva ao quiz que o professor abrir
const SAIDA = path.resolve(__dirname, "../../Aula_UV-vis/UV-vis_quiz.pptx");
const IMG = path.resolve(__dirname, "../../Aula_UV-vis/figs");

const RED = "FF0000", BLUE = "0070C0", NAVY = "000099", GREEN = "00B050", YELLOW = "FFCC00", GRAY = "7F7F7F";
const HEAD = "Comic Sans MS", BODY = "Arial";
const ALT = [ // mesmas cores e formas dos botões do celular
  { cor: "E21B3C", forma: "▲" }, { cor: "1368CE", forma: "◆" }, { cor: "D89E00", forma: "●" }, { cor: "26890C", forma: "■" },
];
const THEME = {
  name: "UV-vis Boniek", headFontFace: HEAD, bodyFontFace: BODY,
  colors: { dk1: "000000", lt1: "FFFFFF", dk2: NAVY, lt2: "F2F2F2", accent1: BLUE, accent2: RED,
    accent3: GREEN, accent4: YELLOW, accent5: "7030A0", accent6: "E06C00", hlink: BLUE, folHlink: "7030A0" },
};

const banco = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../privado/uvvis-competicao.json"), "utf8"));
const seq = banco.sequencia;
if (!seq?.length) throw new Error("rode antes: node tools/sortear-sequencia.mjs");
const POR_RODADA = 10;

(async () => {
  const qr = "image/png;base64," + (await QRCode.toBuffer(LINK, { margin: 1, width: 900, errorCorrectionLevel: "M" })).toString("base64");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 — igual à aula
  pres.author = "Prof. Dr. Boniek Gontijo Vaz";
  pres.title = "Quiz UV-vis";
  pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

  pres.defineSlideMaster({
    title: "PERGUNTA", background: { color: "FFFFFF" },
    objects: [
      { placeholder: { options: { name: "secao", type: "body", x: 0.4, y: 0.2, w: 9, h: 0.5, fontFace: HEAD, fontSize: 20,
        bold: true, color: RED, margin: 0, valign: "middle" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.4, y: 0.8, w: 10.6, h: 1.5, fontFace: HEAD, fontSize: 34,
        bold: true, color: BLUE, margin: 0, valign: "middle", align: "left" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "DIVISOR", background: { color: "FFFFFF" },
    objects: [
      { placeholder: { options: { name: "num", type: "body", x: 0.8, y: 1.6, w: 8, h: 1.4, fontFace: HEAD, fontSize: 66,
        bold: true, color: RED, margin: 0, valign: "bottom" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 3.1, w: 8, h: 1.1, fontFace: HEAD, fontSize: 36,
        bold: true, color: BLUE, margin: 0, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: 0.8, y: 4.3, w: 8, h: 1.6, fontFace: BODY, fontSize: 20,
        color: GRAY, margin: 0, valign: "top" }, text: "" } },
    ],
  });

  const qrPequeno = (s) => {
    s.addImage({ data: qr, x: 11.75, y: 0.25, w: 1.3, h: 1.3, altText: "QR code para entrar no quiz" });
    s.addText("entrou atrasado?", { x: 11.45, y: 1.55, w: 1.9, h: 0.3, fontSize: 11, color: GRAY, align: "center", margin: 0, isTextBox: true });
  };

  // ---------- 1. Registro ----------
  pres.addSection({ title: "Registro" });
  const r = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Registro" });
  r.addText("Quiz UV-vis", { placeholder: "secao" });
  r.addText("Entre agora pelo celular! 📱", { placeholder: "title" });
  r.addImage({ data: qr, x: 0.6, y: 2.45, w: 4.3, h: 4.3, altText: "QR code de entrada no quiz" });
  const passos = [
    ["1", "Aponte a câmera para o QR code", "funciona no 4G ou no Wi-Fi"],
    ["2", "Digite nome e matrícula", "só na primeira vez — sem senha"],
    ["3", "Escolha seu personagem 🦊🐼🦉", "cada um tem um só dono na turma"],
    ["4", "Aguarde a pergunta no celular", "toque na resposta antes do tempo acabar"],
  ];
  passos.forEach(([n, t, sub], i) => {
    const y = 2.45 + i * 1.02;
    r.addShape(pres.ShapeType.ellipse, { x: 5.4, y, w: 0.75, h: 0.75, fill: { color: [RED, BLUE, "D89E00", GREEN][i] }, line: { type: "none" }, objectName: `passo${n}` });
    r.addText(n, { x: 5.4, y, w: 0.75, h: 0.75, fontFace: HEAD, fontSize: 26, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    r.addText([{ text: t, options: { bold: true, fontSize: 22, color: "000000", breakLine: true } }, { text: sub, options: { fontSize: 15, color: GRAY } }],
      { x: 6.4, y: y - 0.08, w: 6.5, h: 0.95, valign: "middle", margin: 0, isTextBox: true });
  });
  r.addShape(pres.ShapeType.roundRect, { x: 5.4, y: 6.6, w: 7.5, h: 0.6, rectRadius: 0.1, fill: { color: "FFF6CC" }, line: { color: YELLOW, width: 1.5 } });
  r.addText("🏆 Até 1000 pts por acerto rápido · 2 rodadas · pódio final = 🍫", {
    x: 5.5, y: 6.6, w: 7.3, h: 0.6, fontSize: 15, bold: true, color: "000000", valign: "middle", margin: 0, isTextBox: true });
  r.addText(LINK.replace("https://", ""), { x: 0.6, y: 6.8, w: 4.3, h: 0.35, fontSize: 10, color: GRAY, align: "center", margin: 0, isTextBox: true });
  r.addNotes(`Professor: abra ${SITE}professor.html no celular, aba Quiz → "Sequência dos slides" → Criar sala. ` +
    `Os alunos que leram este QR entram sozinhos na sala. Quando todos aparecerem, toque em ▶ Começar.`);

  // ---------- rodadas ----------
  const nRodadas = Math.ceil(seq.length / POR_RODADA);
  for (let rd = 0; rd < nRodadas; rd++) {
    const titulo = `Rodada ${rd + 1}`;
    const qs = seq.slice(rd * POR_RODADA, (rd + 1) * POR_RODADA);
    const blocos = [...new Set(qs.map((q) => q.bloco))];
    pres.addSection({ title: titulo });
    const d = pres.addSlide({ masterName: "DIVISOR", sectionTitle: titulo });
    d.addText(titulo, { placeholder: "num" });
    d.addText(`${qs.length} perguntas`, { placeholder: "title" });
    d.addText(`Blocos ${blocos[0]}–${blocos[blocos.length - 1]} da aula${rd ? " · os pontos da rodada 1 continuam valendo" : ""}`, { placeholder: "sub" });
    d.addImage({ data: qr, x: 9.4, y: 1.7, w: 3.3, h: 3.3, altText: "QR code para entrar no quiz" });
    d.addText("ainda não entrou? escaneie", { x: 9.2, y: 5.05, w: 3.7, h: 0.4, fontSize: 14, color: GRAY, align: "center", margin: 0, isTextBox: true });
    d.addNotes(rd ? "Toque em ▶ Começar rodada 2 no celular." : "Confira se todos aparecem na lista do celular e toque em ▶ Começar.");

    qs.forEach((q, i) => {
      const s = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: titulo });
      s.addText(`${titulo} · Pergunta ${i + 1} de ${qs.length}`, { placeholder: "secao" });
      s.addText(q.enunciado.replace(/<[^>]+>/g, ""), { placeholder: "title" });
      qrPequeno(s);
      let topo = 2.55;
      if (q.figura) {
        const arq = path.join(IMG, path.basename(q.figura));
        s.addImage({ path: arq, x: 3.9, y: 2.35, w: 5.5, h: 5.5 * 624 / 1000 * 0.62, sizing: { type: "contain", w: 5.5, h: 2.15 }, altText: "figura da pergunta" });
        topo = 4.6;
      }
      const altura = q.figura ? 1.15 : 1.9, gap = 0.25, larg = 6.05;
      q.alternativas.forEach((a, k) => {
        const x = 0.4 + (k % 2) * (larg + gap), y = topo + Math.floor(k / 2) * (altura + gap);
        s.addShape(pres.ShapeType.roundRect, { x, y, w: larg, h: altura, rectRadius: 0.12, fill: { color: ALT[k].cor }, line: { type: "none" },
          shadow: { type: "outer", color: "000000", opacity: 0.18, blur: 3, offset: 2, angle: 90 }, objectName: `alternativa ${k + 1}` });
        s.addText([{ text: `${ALT[k].forma}  `, options: { fontSize: q.figura ? 24 : 30 } }, { text: a.replace(/<[^>]+>/g, ""), options: { fontSize: q.figura ? 22 : 26, bold: true } }],
          { x: x + 0.3, y, w: larg - 0.5, h: altura, color: "FFFFFF", valign: "middle", margin: 0, isTextBox: true });
      });
      s.addNotes(`Resposta: ${ALT[q.correta].forma} ${q.alternativas[q.correta]}.\n` +
        `No celular: ${i === 0 ? "▶ Começar" : "Próxima pergunta"} libera esta pergunta. Quando o tempo acabar, veja quantos marcaram cada alternativa e abra a discussão antes de passar o slide.`);

      // slide da resposta: certa em destaque, demais apagadas, e o porquê
      const t = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: titulo });
      t.addText(`${titulo} · Resposta ${i + 1} de ${qs.length}`, { placeholder: "secao" });
      t.addText(q.enunciado.replace(/<[^>]+>/g, ""), { placeholder: "title" });
      const hA = 1.05, gA = 0.2;
      q.alternativas.forEach((a, k) => {
        const certa = k === q.correta;
        const x = 0.4 + (k % 2) * (larg + gap), y = 2.5 + Math.floor(k / 2) * (hA + gA);
        t.addShape(pres.ShapeType.roundRect, { x, y, w: larg, h: hA, rectRadius: 0.12, fill: { color: ALT[k].cor, transparency: certa ? 0 : 75 },
          line: certa ? { color: "000000", width: 4 } : { type: "none" }, objectName: `alternativa ${k + 1}${certa ? " (correta)" : ""}` });
        t.addText([{ text: `${ALT[k].forma}  `, options: { fontSize: 22 } }, { text: a.replace(/<[^>]+>/g, ""), options: { fontSize: 22, bold: true } },
          ...(certa ? [{ text: "   ✓ correta", options: { fontSize: 20, bold: true } }] : [])],
          { x: x + 0.3, y, w: larg - 0.5, h: hA, color: certa ? "FFFFFF" : "6B6B6B", valign: "middle", margin: 0, isTextBox: true });
      });
      const figR = q.figuraResposta, wExp = figR ? 7.7 : 12.35;
      t.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 5.15, w: wExp, h: 1.45, rectRadius: 0.1, fill: { color: "FFF6CC" }, line: { color: YELLOW, width: 1.5 }, objectName: "por que" });
      t.addText([{ text: "Por quê? ", options: { bold: true, color: RED } }, { text: q.explicacao.replace(/<[^>]+>/g, ""), options: { color: "000000" } }],
        { x: 0.65, y: 5.15, w: wExp - 0.45, h: 1.45, fontSize: figR ? 18 : 20, valign: "middle", margin: 0, isTextBox: true });
      if (figR) t.addImage({ path: path.join(IMG, path.basename(figR)), x: 8.6, y: 4.95, w: 3.77, h: 2.35, altText: "figura da resposta" });
      t.addText("💬 Discuta com o colega: por que as outras alternativas estão erradas?", { x: 0.4, y: 6.75, w: 12.35, h: 0.45, fontSize: 16, italic: true, color: GRAY, margin: 0, isTextBox: true });
      t.addNotes(`${q.explicacao.replace(/<[^>]+>/g, "")}\nNo celular: depois da discussão, toque em ${i + 1 < qs.length ? "Próxima pergunta" : (rd === nRodadas - 1 ? "🏁 Ver pódio final" : "🏆 Pódio da rodada")}.`);
    });

    const fim = rd === nRodadas - 1;
    pres.addSection({ title: fim ? "Pódio final" : `Pódio da rodada ${rd + 1}` });
    const p = pres.addSlide({ masterName: "DIVISOR", sectionTitle: fim ? "Pódio final" : `Pódio da rodada ${rd + 1}` });
    p.addText(fim ? "🏆 Pódio final" : `🏁 Fim da rodada ${rd + 1}`, { placeholder: "num" });
    p.addText(fim ? "Hora do chocolate! 🍫" : "Pódio parcial", { placeholder: "title" });
    p.addText(fim ? "Somando as duas rodadas: 1º, 2º e 3º lugares ganham o prêmio." : "Os pontos acumulam: ainda dá tempo de virar o jogo na rodada 2!", { placeholder: "sub" });
    [["🥈", 1.9, 9.6], ["🥇", 2.6, 10.95], ["🥉", 1.4, 12.3]].forEach(([m, hgt, cx], j) => {
      const cor = ["B0BEC5", "F2C94C", "D99A6C"][j];
      p.addShape(pres.ShapeType.roundRect, { x: cx - 0.6, y: 6.6 - hgt, w: 1.2, h: hgt, rectRadius: 0.08, fill: { color: cor }, line: { type: "none" }, objectName: `degrau ${m}` });
      p.addText(m, { x: cx - 0.6, y: 6.6 - hgt - 0.8, w: 1.2, h: 0.75, fontSize: 36, align: "center", margin: 0, isTextBox: true });
    });
    p.addNotes(fim ? "Toque em 🏁 Ver pódio final no celular e projete/mostre o pódio." : "Toque em 🏆 Pódio da rodada 1 no celular; depois ▶ Começar rodada 2.");
  }

  await pres.writeFile({ fileName: SAIDA });
  await applyTheme(SAIDA, THEME);
  console.log(`ok: ${SAIDA} (${pres.slides.length} slides) — link ${LINK}`);
})().catch((e) => { console.error(e); process.exit(1); });
