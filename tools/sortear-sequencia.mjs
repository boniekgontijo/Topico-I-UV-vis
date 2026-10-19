// Sorteia a sequência fixa do quiz (2 rodadas × 10) e grava em privado/uvvis-competicao.json.
// Uso: node tools/sortear-sequencia.mjs [semente]
// Rodada 1 = blocos 1–5, rodada 2 = blocos 6–10 (acompanha a ordem da aula); dentro da rodada, ordem dos blocos.
import { readFileSync, writeFileSync } from "node:fs";
import { prepararCompeticao } from "../public/js/core/competicao.js";

const ARQ = new URL("../privado/uvvis-competicao.json", import.meta.url);
const semente = Number(process.argv[2] ?? Date.now() % 1e9);
let t = semente >>> 0; // mulberry32: mesma semente → mesmo sorteio
const rnd = () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };

const banco = JSON.parse(readFileSync(ARQ, "utf8"));
const rodada = (blocos) => prepararCompeticao(banco.questoes, { blocos, n: 10, rnd }).sort((a, b) => a.bloco - b.bloco);
const sequencia = [...rodada([1, 2, 3, 4, 5]), ...rodada([6, 7, 8, 9, 10])];
writeFileSync(ARQ, JSON.stringify({ ...banco, semente, sequencia }, null, 1));
console.log(`semente ${semente}: ${sequencia.length} perguntas`);
sequencia.forEach((q, i) => console.log(`${String(i + 1).padStart(2)}. [B${q.bloco}] ${q.enunciado} → ${["▲", "◆", "●", "■"][q.correta]} ${q.alternativas[q.correta]}`));
