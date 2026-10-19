// Slides do módulo IV: registro, quiz (2 rodadas de pergunta → resposta), pódios, atividade em grupo e "Para casa".
// Uso: NODE_PATH=../Aula_IV/build/node_modules node tools/iv/slides-iv.cjs   → ../Aula_IV/IV_quiz.pptx
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const pptxgen = require("pptxgenjs");
const SKILL = "/Users/boniek/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/22b5ad14-9e1f-49de-a582-d26e1a721ea2/3d30ba2d-58af-4b52-940c-6c3cc5a76685/skills/pptx";
const { applyTheme } = require(path.join(SKILL, "scripts/apply_theme.js"));

const RAIZ = path.resolve(__dirname, "../..");
const SITE = "https://boniekgontijo.github.io/Topico-I-UV-vis/";
const TURMA = "2026-2";
const SAIDA = path.resolve(RAIZ, "../Aula_IV/IV_quiz.pptx");
const FIGS = path.resolve(RAIZ, "../Aula_IV/quiz_figs");
const EST = path.join(RAIZ, "public/conteudo/iv/estruturas");
const RED = "FF0000", BLUE = "0070C0", NAVY = "000099", GREEN = "00B050", YELLOW = "FFCC00", GRAY = "7F7F7F";
const HEAD = "Comic Sans MS", BODY = "Arial";
const ALT = [{ cor: "E21B3C", forma: "▲" }, { cor: "1368CE", forma: "◆" }, { cor: "D89E00", forma: "●" }, { cor: "26890C", forma: "■" }, { cor: "7B2FBE", forma: "★" }];
const THEME = { name: "IV Boniek", headFontFace: HEAD, bodyFontFace: BODY, colors: { dk1: "000000", lt1: "FFFFFF", dk2: NAVY, lt2: "F2F2F2",
  accent1: BLUE, accent2: RED, accent3: GREEN, accent4: YELLOW, accent5: "7030A0", accent6: "E06C00", hlink: BLUE, folHlink: "7030A0" } };
const CORTE_IV = (fs.readFileSync(path.join(RAIZ, "public/js/config.js"), "utf8").match(/iv:\s*"([\d-]+)"/) || [])[1];
const corteTxt = CORTE_IV ? CORTE_IV.split("-").reverse().join("/") : "a definir";

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), "utf8"));
const banco = ler("privado/iv-competicao.json"), seq = banco.sequencia;
const grupoPub = ler("public/conteudo/iv/grupo.json").problemas, grupoPriv = ler("privado/iv-grupo.json").problemas;
const { compostos } = ler("public/conteudo/iv/compostos.json");
const sub = (f) => f.replace(/(\d+)/g, (d) => d.split("").map((x) => "₀₁₂₃₄₅₆₇₈₉"[x]).join(""));
const est = (a) => (a.startsWith("@est:") ? a.slice(5) : null);
const POR_RODADA = 10;

(async () => {
  const qr = async (u) => "image/png;base64," + (await QRCode.toBuffer(u, { margin: 1, width: 900, errorCorrectionLevel: "M" })).toString("base64");
  const QR_QUIZ = await qr(`${SITE}?t=${TURMA}&m=iv#quiz`), QR_GRUPO = await qr(`${SITE}?t=${TURMA}&m=iv#grupo-iv`), QR_CASA = await qr(`${SITE}?t=${TURMA}&m=iv#menu`);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Prof. Dr. Boniek Gontijo Vaz";
  pres.title = "Quiz IV";
  pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
  pres.defineSlideMaster({ title: "PERGUNTA", background: { color: "FFFFFF" }, objects: [
    { placeholder: { options: { name: "secao", type: "body", x: 0.4, y: 0.2, w: 9, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: RED, margin: 0, valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.4, y: 0.7, w: 10.6, h: 0.8, fontFace: HEAD, fontSize: 28, bold: true, color: BLUE, margin: 0, valign: "middle", align: "left" }, text: "" } },
  ] });
  pres.defineSlideMaster({ title: "DIVISOR", background: { color: "FFFFFF" }, objects: [
    { placeholder: { options: { name: "num", type: "body", x: 0.8, y: 1.6, w: 8, h: 1.4, fontFace: HEAD, fontSize: 60, bold: true, color: RED, margin: 0, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 3.1, w: 8, h: 1.1, fontFace: HEAD, fontSize: 34, bold: true, color: BLUE, margin: 0, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "sub", type: "body", x: 0.8, y: 4.3, w: 8, h: 1.8, fontFace: BODY, fontSize: 20, color: GRAY, margin: 0, valign: "top" }, text: "" } },
  ] });

  const qrCanto = (s, img, txt = "entrou atrasado?") => {
    s.addImage({ data: img, x: 11.75, y: 0.2, w: 1.3, h: 1.3, altText: "QR code" });
    s.addText(txt, { x: 11.45, y: 1.5, w: 1.9, h: 0.3, fontSize: 11, color: GRAY, align: "center", margin: 0, isTextBox: true });
  };
  const espectro = (s, id, x, y, w) => s.addImage({ path: path.join(FIGS, `espectro_${id}.png`), x, y, w, h: w * 0.34, altText: "espectro de infravermelho" });
  // caixa de alternativa: estrutura (fundo branco, borda colorida) ou texto (fundo colorido)
  function caixa(s, a, k, x, y, w, h, { apagada = false, certa = false, letras = false } = {}) {
    const id = est(a);
    const rot = letras ? { cor: "5C6070", forma: String.fromCharCode(65 + k) } : ALT[k];
    if (id) {
      s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: "FFFFFF", transparency: apagada ? 30 : 0 },
        line: { color: certa ? "000000" : rot.cor, width: certa ? 5 : 3, transparency: apagada ? 70 : 0 }, objectName: `alternativa ${k + 1}` });
      s.addText(rot.forma, { x: x + 0.1, y: y + 0.05, w: 0.5, h: 0.45, fontSize: 22, bold: true, color: rot.cor, margin: 0, isTextBox: true });
      s.addImage({ path: path.join(EST, `${id}.png`), x: x + 0.25, y: y + 0.35, w: w - 0.5, h: h - 0.5, sizing: { type: "contain", w: w - 0.5, h: h - 0.5 },
        transparency: apagada ? 70 : 0, altText: "estrutura" });
      if (certa) s.addText("✓", { x: x + w - 0.6, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 26, bold: true, color: GREEN, margin: 0, isTextBox: true });
    } else {
      s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: rot.cor, transparency: apagada ? 75 : 0 },
        line: certa ? { color: "000000", width: 4 } : { type: "none" }, objectName: `alternativa ${k + 1}` });
      s.addText([{ text: `${rot.forma}  `, options: { fontSize: 20 } }, { text: a, options: { fontSize: 20, bold: true } },
        ...(certa ? [{ text: "   ✓ correta", options: { fontSize: 18, bold: true } }] : [])],
        { x: x + 0.25, y, w: w - 0.4, h, color: apagada ? "6B6B6B" : "FFFFFF", valign: "middle", margin: 0, isTextBox: true });
    }
  }
  function linhaAlternativas(s, alts, y, h, opts = () => ({})) {
    const n = alts.length, gap = 0.2, total = 12.5, x0 = 0.4;
    if (!est(alts[0]) && n > 3) { // texto: grade 2 × 2 (+1)
      const w = (total - gap) / 2, hh = (h - gap) / 2;
      alts.forEach((a, k) => caixa(s, a, k, x0 + (k % 2) * (w + gap), y + Math.floor(k / 2) * (hh + gap), k === 4 ? total : w, k === 4 ? hh * 0.8 : hh, opts(k)));
      return;
    }
    const w = (total - gap * (n - 1)) / n;
    alts.forEach((a, k) => caixa(s, a, k, x0 + k * (w + gap), y, w, h, opts(k)));
  }

  // ---------- registro ----------
  pres.addSection({ title: "Registro" });
  const r = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Registro" });
  r.addText("Quiz IV", { placeholder: "secao" });
  r.addText("Entre agora pelo celular! 📱", { placeholder: "title" });
  r.addImage({ data: QR_QUIZ, x: 0.6, y: 1.9, w: 4.5, h: 4.5, altText: "QR code de entrada no quiz de IV" });
  r.addText(`${SITE}?t=${TURMA}&m=iv#quiz`.replace("https://", ""), { x: 0.4, y: 6.5, w: 4.9, h: 0.35, fontSize: 10, color: GRAY, align: "center", margin: 0, isTextBox: true });
  [["1", "Aponte a câmera para o QR code", "funciona no 4G ou no Wi-Fi"], ["2", "Digite nome e matrícula", "o mesmo registro do UV-vis"],
    ["3", "Escolha seu personagem 🦊🐼🦉", "cada um tem um só dono na turma"], ["4", "Veja o espectro e toque na molécula", "2 opções no começo… até 5 no fim!"]]
    .forEach(([n, t, s2], i) => {
      const y = 1.95 + i * 1.08;
      r.addShape(pres.ShapeType.ellipse, { x: 5.6, y, w: 0.75, h: 0.75, fill: { color: [RED, BLUE, "D89E00", GREEN][i] }, line: { type: "none" }, objectName: `passo ${n}` });
      r.addText(n, { x: 5.6, y, w: 0.75, h: 0.75, fontFace: HEAD, fontSize: 26, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
      r.addText([{ text: t, options: { bold: true, fontSize: 22, color: "000000", breakLine: true } }, { text: s2, options: { fontSize: 15, color: GRAY } }],
        { x: 6.6, y: y - 0.08, w: 6.4, h: 0.95, valign: "middle", margin: 0, isTextBox: true });
    });
  r.addNotes(`Professor: abra ${SITE}professor.html#comp/slides/iv no celular → Criar sala. Os alunos que leram este QR entram sozinhos.`);

  // ---------- rodadas ----------
  const nRod = Math.ceil(seq.length / POR_RODADA);
  for (let rd = 0; rd < nRod; rd++) {
    const tit = `Rodada ${rd + 1}`, qs = seq.slice(rd * POR_RODADA, (rd + 1) * POR_RODADA);
    pres.addSection({ title: tit });
    const d = pres.addSlide({ masterName: "DIVISOR", sectionTitle: tit });
    d.addText(tit, { placeholder: "num" });
    d.addText(rd ? "Médio e difícil" : "Fácil e médio", { placeholder: "title" });
    d.addText(rd ? "Até 5 moléculas parecidas · os pontos da rodada 1 continuam valendo" : "Comece com 2 opções e vá subindo · leia C=O, O–H e N–H primeiro", { placeholder: "sub" });
    d.addImage({ data: QR_QUIZ, x: 9.4, y: 1.7, w: 3.3, h: 3.3, altText: "QR code do quiz" });
    d.addNotes(rd ? "Toque em ▶ Começar rodada 2 no celular." : "Confira a lista e toque em ▶ Começar.");
    qs.forEach((q, i) => {
      const espec = q.subtipo === "espectro";
      const s = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: tit });
      s.addText(`${tit} · Pergunta ${i + 1} de ${qs.length}${espec ? ` · ${q.alternativas.length} opções` : ""}`, { placeholder: "secao" });
      s.addText(q.enunciado, { placeholder: "title" });
      qrCanto(s, QR_QUIZ);
      if (espec) { espectro(s, q.espectro, 1.6, 1.55, 9.0); linhaAlternativas(s, q.alternativas, 4.75, 2.45); }
      else linhaAlternativas(s, q.alternativas, 2.1, 4.6);
      s.addNotes(`Resposta: ${ALT[q.correta].forma} ${espec ? compostos[q.espectro].nome : q.alternativas[q.correta]}.\nNo celular: ${i === 0 ? "▶ Começar" : "Próxima pergunta"}. Depois, veja quantos marcaram cada opção e discuta antes do slide da resposta.`);

      const t = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: tit });
      t.addText(`${tit} · Resposta ${i + 1} de ${qs.length}`, { placeholder: "secao" });
      t.addText(espec ? `É ${compostos[q.espectro].nome}` : q.enunciado, { placeholder: "title" });
      if (espec) { espectro(t, q.espectro, 0.4, 1.6, 5.6); linhaAlternativas(t, q.alternativas, 3.65, 1.75, (k) => ({ apagada: k !== q.correta, certa: k === q.correta })); }
      else linhaAlternativas(t, q.alternativas, 1.7, 3.0, (k) => ({ apagada: k !== q.correta, certa: k === q.correta }));
      const yE = espec ? 5.55 : 4.9;
      t.addShape(pres.ShapeType.roundRect, { x: espec ? 0.4 : 0.4, y: yE, w: 12.5, h: 7.2 - yE, rectRadius: 0.1, fill: { color: "FFF6CC" }, line: { color: YELLOW, width: 1.5 }, objectName: "por que" });
      t.addText([{ text: "Por quê? ", options: { bold: true, color: RED } }, { text: q.explicacao, options: { color: "000000" } }],
        { x: 0.6, y: yE, w: 12.1, h: 7.2 - yE, fontSize: q.explicacao.length > 260 ? 13 : 16, valign: "middle", margin: 0, isTextBox: true });
      if (espec) t.addText("💬 Que banda decidiu? Por que as outras estão erradas?", { x: 6.3, y: 1.75, w: 6.6, h: 0.8, fontSize: 18, italic: true, color: GRAY, margin: 0, isTextBox: true });
      t.addNotes(`${q.explicacao}\nNo celular: ${i + 1 < qs.length ? "Próxima pergunta" : rd === nRod - 1 ? "🏁 Ver pódio final" : "🏆 Pódio da rodada"}.`);
    });
    const fim = rd === nRod - 1;
    pres.addSection({ title: fim ? "Pódio final" : `Pódio da rodada ${rd + 1}` });
    const p = pres.addSlide({ masterName: "DIVISOR", sectionTitle: fim ? "Pódio final" : `Pódio da rodada ${rd + 1}` });
    p.addText(fim ? "🏆 Pódio final" : `🏁 Fim da rodada ${rd + 1}`, { placeholder: "num" });
    p.addText(fim ? "Hora do chocolate! 🍫" : "Pódio parcial", { placeholder: "title" });
    p.addText(fim ? "Somando as duas rodadas." : "Os pontos acumulam: ainda dá para virar na rodada 2!", { placeholder: "sub" });
    p.addNotes(fim ? "Toque em 🏁 Ver pódio final no celular." : "Toque em 🏆 Pódio da rodada 1; depois ▶ Começar rodada 2.");
  }

  // ---------- atividade em grupo ----------
  pres.addSection({ title: "Atividade em grupo" });
  const g = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Atividade em grupo" });
  g.addText("Atividade em grupo", { placeholder: "secao" });
  g.addText("Composto desconhecido 🕵️", { placeholder: "title" });
  g.addImage({ data: QR_GRUPO, x: 0.6, y: 1.9, w: 4.3, h: 4.3, altText: "QR code da atividade em grupo" });
  [["1", "Um celular por grupo: escolha o nº do grupo", "6 grupos, cada um com um problema diferente"],
    ["2", "Calcule as insaturações", "I = C − H/2 + N/2 + 1"],
    ["3", "Atribua as bandas principais", "C=O ~1700? O–H/N–H 3500–3200? C≡N 2250?"],
    ["4", "Escolha a estrutura e envie a justificativa", "~20 min · depois cada grupo apresenta (~3 min)"]]
    .forEach(([n, t, s2], i) => {
      const y = 1.95 + i * 1.08;
      g.addShape(pres.ShapeType.ellipse, { x: 5.4, y, w: 0.75, h: 0.75, fill: { color: [RED, BLUE, "D89E00", GREEN][i] }, line: { type: "none" }, objectName: `passo ${n}` });
      g.addText(n, { x: 5.4, y, w: 0.75, h: 0.75, fontFace: HEAD, fontSize: 26, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
      g.addText([{ text: t, options: { bold: true, fontSize: 21, color: "000000", breakLine: true } }, { text: s2, options: { fontSize: 15, color: GRAY } }],
        { x: 6.4, y: y - 0.08, w: 6.6, h: 0.95, valign: "middle", margin: 0, isTextBox: true });
    });
  g.addNotes(`Professor: ${SITE}professor.html#grupos-iv → escolha 6 problemas → Abrir atividade. Na apresentação: Projetar grupo k → discutir → Revelar.`);
  for (const p of grupoPub) {
    const s = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Atividade em grupo" });
    s.addText(`Problema ${p.n}`, { placeholder: "secao" });
    s.addText(`Fórmula: ${sub(p.formula)}`, { placeholder: "title" });
    qrCanto(s, QR_GRUPO, "atividade em grupo");
    espectro(s, p.espectro, 0.4, 1.55, 8.6);
    s.addShape(pres.ShapeType.roundRect, { x: 9.2, y: 2.0, w: 3.7, h: 2.0, rectRadius: 0.1, fill: { color: "FFF6CC" }, line: { color: YELLOW, width: 1.5 }, objectName: "pista" });
    s.addText([{ text: "Pista: ", options: { bold: true, color: RED } }, { text: p.pista, options: { color: "000000" } }], { x: 9.35, y: 2.0, w: 3.45, h: 2.0, fontSize: 15, valign: "middle", margin: 0, isTextBox: true });
    linhaAlternativas(s, p.candidatas, 4.7, 2.5, () => ({ letras: true }));
    s.addNotes(`Resposta (não mostrar antes da hora): ${compostos[p.espectro].nome}. Ver slide de revelação no fim.`);
  }

  // ---------- para casa ----------
  pres.addSection({ title: "Para casa" });
  const c = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Para casa" });
  c.addText("Para casa", { placeholder: "secao" });
  c.addText("Pratique no seu ritmo 🏠", { placeholder: "title" });
  c.addImage({ data: QR_CASA, x: 0.6, y: 1.9, w: 4.3, h: 4.3, altText: "QR code da página de IV" });
  [["🏠", "Qual molécula é?", "64 espectros + 22 questões teóricas, com explicação em cada resposta", "E6F4EA", GREEN],
    ["🧭", "Do fácil ao difícil", "2 opções nas fáceis, até 5 moléculas parecidas nas difíceis", "F1E8F8", "7030A0"],
    ["🏅", `Sua prática conta — até ${corteTxt}`, "Nota = questões diferentes feitas ÷ total × 10 (separada da do UV-vis)", "FFF6CC", "D89E00"]]
    .forEach(([ic, t, s2, fundo, borda], i) => {
      const y = 2.0 + i * 1.45;
      c.addShape(pres.ShapeType.roundRect, { x: 5.4, y, w: 7.5, h: 1.25, rectRadius: 0.12, fill: { color: fundo }, line: { color: borda, width: 1.5 }, objectName: `cartão ${t}` });
      c.addText(ic, { x: 5.55, y, w: 0.9, h: 1.25, fontSize: 34, align: "center", valign: "middle", margin: 0, isTextBox: true });
      c.addText([{ text: t, options: { bold: true, fontSize: 21, color: "000000", breakLine: true } }, { text: s2, options: { fontSize: 15, color: "404040" } }],
        { x: 6.55, y, w: 6.2, h: 1.25, valign: "middle", margin: 0, isTextBox: true });
    });

  // ---------- revelações (só professor) ----------
  pres.addSection({ title: "Revelações (professor)" });
  const dv = pres.addSlide({ masterName: "DIVISOR", sectionTitle: "Revelações (professor)" });
  dv.addText("🔒 Só para o professor", { placeholder: "num" });
  dv.addText("Revelações da atividade em grupo", { placeholder: "title" });
  dv.addText("Mostre o slide do problema certo depois que o grupo apresentar.", { placeholder: "sub" });
  for (const p of grupoPub) {
    const pr = grupoPriv.find((x) => x.n === p.n);
    const s = pres.addSlide({ masterName: "PERGUNTA", sectionTitle: "Revelações (professor)" });
    s.addText(`Problema ${p.n} — revelação`, { placeholder: "secao" });
    s.addText(`${sub(p.formula)} é ${compostos[p.espectro].nome}`, { placeholder: "title" });
    linhaAlternativas(s, p.candidatas, 1.65, 2.0, (k) => ({ apagada: k !== pr.correta, certa: k === pr.correta, letras: true }));
    s.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 3.95, w: 12.5, h: 3.25, rectRadius: 0.1, fill: { color: "E6F4EA" }, line: { color: GREEN, width: 1.5 }, objectName: "resolução" });
    s.addText([{ text: "Bandas-chave: ", options: { bold: true, color: RED, breakLine: true } },
      ...pr.bandasChave.map((b) => ({ text: `•  ${b}`, options: { breakLine: true } })),
      { text: "Resolução: ", options: { bold: true, color: RED } }, { text: pr.resolucao }],
      { x: 0.6, y: 4.0, w: 12.1, h: 3.15, fontSize: 15, color: "000000", valign: "top", margin: 0, paraSpaceAfter: 3, isTextBox: true });
  }

  await pres.writeFile({ fileName: SAIDA });
  await applyTheme(SAIDA, THEME);
  console.log(`ok: ${SAIDA} (${pres.slides.length} slides)`);
})().catch((e) => { console.error(e); process.exit(1); });
