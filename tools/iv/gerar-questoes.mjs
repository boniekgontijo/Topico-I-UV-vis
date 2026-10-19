// Gera as questões de IV "qual molécula corresponde ao espectro?" + teóricas, para casa e sala.
// Uso: node tools/iv/gerar-questoes.mjs [semente]
//   → public/conteudo/iv/casa.json   (público; corrigido no celular)
//   → privado/iv-competicao.json     (quiz de sala: pool + sequência fixa dos slides; fora do site)
// Regras (design do IV): fácil 2 opções de famílias diferentes; médio 3–4 da mesma família; difícil 5 com
// famílias vizinhas; médio/difícil com nº de C ±1; nenhum distrator com a mesma função do alvo;
// compostos de grupo nunca entram; nenhuma questão idêntica entre casa e sala.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { embaralharQuestao } from "../../public/js/core/embaralhar.js";

const raiz = new URL("../../", import.meta.url);
const { compostos } = JSON.parse(readFileSync(new URL("public/conteudo/iv/compostos.json", raiz)));
const teoricas = JSON.parse(readFileSync(new URL("tools/iv/teoricas.json", raiz)));
const semente = Number(process.argv[2] ?? 20262);
let t = semente >>> 0;
const rnd = () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
const embaralhar = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const BLOCO = { alcano: 5, alceno: 5, alcino: 5, aromatico: 5, haleto: 5, alcool: 6, fenol: 6, eter: 6 };
const blocoDe = (c, nivel) => (nivel === "dificil" && rnd() < 0.35 ? 9 : BLOCO[c.funcao] ?? (c.familia === "nitrogenado" ? 8 : 7));
const VIZINHAS = { hidrocarboneto: ["oxigenado"], oxigenado: ["hidrocarboneto", "carbonila"], carbonila: ["oxigenado", "nitrogenado"], nitrogenado: ["carbonila"] };
// pares que mais se confundem: no difícil, entram primeiro
const CONFUNDE = {
  acido: ["ester", "alcool", "cetona", "lactona"], ester: ["acido", "cetona", "lactona", "anidrido"], aldeido: ["cetona", "ester", "cetona_conjugada"],
  cetona: ["aldeido", "ester", "cetona_conjugada", "acido"], cetona_conjugada: ["cetona", "aldeido", "alceno"],
  amina1: ["amina2", "amina3", "amida1", "alcool"], amina2: ["amina1", "amina3", "amida2"], amina3: ["amina2", "amina1", "eter"],
  alcool: ["fenol", "eter", "acido", "amina1"], fenol: ["alcool", "eter", "aromatico"], eter: ["alcool", "alcano", "ester"],
  amida1: ["amida2", "amina1", "acido"], amida2: ["amida1", "amida3", "ester"], amida3: ["amida2", "cetona", "ester"],
  nitrila: ["alcino", "amida1", "amina3"], alcino: ["nitrila", "alceno"], alceno: ["alcino", "alcano", "aromatico"],
  anidrido: ["ester", "cloreto_acila", "acido"], cloreto_acila: ["anidrido", "ester", "lactona"], lactona: ["ester", "anidrido", "cetona"],
};
const EVIDENCIA = {
  alcano: "só C–H sp³, sem outras bandas fortes", alceno: "=C–H acima de 3000 e C=C perto de 1650",
  alcino: "≡C–H fino em 3300 e C≡C perto de 2120", aromatico: "C=C do anel em 1600/1500 e C–H acima de 3000",
  haleto: "C–X forte abaixo de 800 e nenhum grupo oxigenado", alcool: "O–H larga perto de 3300 e C–O em 1050–1150",
  fenol: "O–H larga junto com bandas de anel aromático", eter: "C–O forte em 1050–1150 sem O–H e sem C=O",
  aldeido: "C=O perto de 1730 e o par de C–H em 2820/2720", cetona: "C=O forte perto de 1715, sem O–H",
  cetona_conjugada: "C=O perto de 1680 (conjugada)", acido: "O–H larguíssima de 3300 a 2500 e C=O perto de 1710",
  ester: "C=O perto de 1740 e C–O forte em 1300–1150", lactona: "C=O alta, perto de 1770",
  anidrido: "duas C=O (perto de 1820 e 1760)", cloreto_acila: "C=O muito alta, perto de 1800",
  amida1: "duas N–H e C=O perto de 1660", amida2: "uma N–H, C=O perto de 1650 e banda em ~1550",
  amida3: "C=O perto de 1650 e nenhuma N–H", amina1: "duas N–H entre 3400 e 3300", amina2: "uma só N–H fraca perto de 3300",
  amina3: "nenhuma N–H nem C=O, com C–N em 1200–1000", nitrila: "C≡N fina perto de 2250", nitro: "duas bandas fortes perto de 1550 e 1380",
};

const L = Object.values(compostos).filter((c) => !c.grupo);
const NOPC = { facil: () => 2, medio: () => (rnd() < 0.5 ? 3 : 4), dificil: () => 5 };

function distratores(alvo, nivel) {
  const n = NOPC[nivel]() - 1;
  const ok = (c) => c.id !== alvo.id && c.funcao !== alvo.funcao;
  let pool;
  if (nivel === "facil") pool = L.filter((c) => ok(c) && c.familia !== alvo.familia);
  else {
    const fams = nivel === "medio" ? [alvo.familia] : [alvo.familia, ...(VIZINHAS[alvo.familia] ?? [])];
    pool = L.filter((c) => ok(c) && fams.includes(c.familia) && Math.abs(c.nC - alvo.nC) <= 1);
  }
  const conf = CONFUNDE[alvo.funcao] ?? [];
  const peso = (c) => (nivel !== "facil" && conf.includes(c.funcao) ? 0 : 1) + rnd();
  const escolhidos = [], funcoes = new Set();
  for (const c of [...pool].sort((a, b) => peso(a) - peso(b))) {
    if (funcoes.has(c.funcao)) continue; // funções diferentes entre si
    escolhidos.push(c); funcoes.add(c.funcao);
    if (escolhidos.length === n) return escolhidos;
  }
  return null;
}

let seq = 0;
function questao(alvo, nivel, prefixo) {
  const ds = distratores(alvo, nivel);
  if (!ds) return null;
  const ops = embaralhar([alvo, ...ds]);
  return {
    id: `${prefixo}-${String(++seq).padStart(3, "0")}`, bloco: blocoDe(alvo, nivel), tipo: "mc", subtipo: "espectro", nivel,
    espectro: alvo.id, enunciado: "Qual molécula corresponde a este espectro?",
    alternativas: ops.map((c) => "@est:" + c.id), correta: ops.indexOf(alvo),
    explicacao: `${alvo.diagnostico} As outras: ${ds.map((d) => `${d.nome} mostraria ${EVIDENCIA[d.funcao]}`).join("; ")}.`,
  };
}
const chave = (q) => `${q.espectro}|${[...q.alternativas].sort().join(",")}`;

// ---------- sala: 8 fácil, 10 médio, 8 difícil (+ teóricas) ----------
const usadas = new Set();
const sala = [];
const metaSala = { facil: 8, medio: 10, dificil: 8 };
for (const [nivel, meta] of Object.entries(metaSala)) {
  for (const alvo of embaralhar(L)) {
    if (sala.filter((q) => q.nivel === nivel).length >= meta) break;
    if (sala.some((q) => q.espectro === alvo.id)) continue; // na sala, cada composto uma vez
    const q = questao(alvo, nivel, "iv-s");
    if (q && !usadas.has(chave(q))) { sala.push(q); usadas.add(chave(q)); }
  }
}
const teoSala = teoricas.filter((x) => x.uso === "sala").map((x, i) => ({ ...x, id: `iv-st-${i + 1}` }));
for (const x of teoSala) delete x.uso;

// ---------- casa: cada composto da biblioteca é alvo de uma questão (níveis em rodízio) + teóricas ----------
const casa = [];
const NIVEIS = ["facil", "medio", "dificil"];
embaralhar(L).forEach((alvo, i) => {
  for (let k = 0; k < 3; k++) { // se o nível da vez não tiver distratores, tenta o próximo
    const q = questao(alvo, NIVEIS[(i + k) % 3], "iv-c");
    if (q && !usadas.has(chave(q))) { casa.push(q); usadas.add(chave(q)); return; }
  }
});
const teoCasa = teoricas.filter((x) => x.uso === "casa").map((x, i) => { const { uso, ...r } = x; return { ...r, id: `iv-ct-${i + 1}` }; });
casa.push(...teoCasa);

// ---------- sequência fixa dos slides: R1 = 2 teóricas + 4 fácil + 4 médio; R2 = 2 teóricas + 4 médio + 4 difícil ----------
const pega = (nivel, n, excl) => sala.filter((q) => q.nivel === nivel && !excl.has(q.id)).slice(0, n);
const ja = new Set();
const r1e = [...pega("facil", 4, ja), ...pega("medio", 4, ja)]; r1e.forEach((q) => ja.add(q.id));
const r2e = [...pega("medio", 4, ja), ...pega("dificil", 4, ja)];
const ts = teoSala.filter((x) => x.bloco <= 2), td = teoSala.filter((x) => x.bloco >= 3);
const r1 = [ts[0], ...r1e.slice(0, 4), ts[1], ...r1e.slice(4)];
const r2 = [td[0], ...r2e.slice(0, 4), td[1], ...r2e.slice(4)];
const sequencia = [...r1, ...r2].map((q) => embaralharQuestao(q, rnd));

writeFileSync(new URL("public/conteudo/iv/casa.json", raiz), JSON.stringify({ modulo: "iv", questoes: casa }, null, 1));
mkdirSync(new URL("privado/", raiz), { recursive: true });
writeFileSync(new URL("privado/iv-competicao.json", raiz), JSON.stringify({ modulo: "iv", semente, questoes: [...sala, ...teoSala], sequencia }, null, 1));
const cont = (arr) => ["facil", "medio", "dificil"].map((n) => `${n} ${arr.filter((q) => q.nivel === n && q.subtipo === "espectro").length}`).join(", ");
console.log(`semente ${semente}\nsala: ${cont(sala)} + ${teoSala.length} teóricas\ncasa: ${cont(casa)} + ${teoCasa.length} teóricas`);
const porBloco = {}; casa.forEach((q) => (porBloco[q.bloco] = (porBloco[q.bloco] ?? 0) + 1));
console.log("casa por bloco:", JSON.stringify(porBloco));
