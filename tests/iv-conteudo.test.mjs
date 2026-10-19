import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ler = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const PRIVC = new URL("../privado/iv-compostos.json", import.meta.url);
const semMeta = process.env.SEM_PRIVADO === "1" || !existsSync(PRIVC);
const meta = semMeta ? { compostos: {} } : ler("../privado/iv-compostos.json");
const porEst = Object.fromEntries(Object.values(meta.compostos).map((c) => [c.estId, c]));
const porEsp = Object.fromEntries(Object.values(meta.compostos).map((c) => [c.espId, c]));
const compostos = porEst;
const casa = ler("../public/conteudo/iv/casa.json").questoes;
const blocos = ler("../public/conteudo/iv/blocos.json");
const PRIV = new URL("../privado/iv-competicao.json", import.meta.url);
const semPrivado = process.env.SEM_PRIVADO === "1";
const sala = semPrivado || !existsSync(PRIV) ? null : ler("../privado/iv-competicao.json");
const NIVEL_OPCOES = { facil: [2], medio: [3, 4], dificil: [5] };
const PROIBIDAS = ["cetona", "aldeído", "ácido", "éster", "amina", "amida", "álcool", "nitrila", "fenol", "éter"];
const est = (a) => (a.startsWith("@est:") ? a.slice(5) : null);
const alvoDe = (q) => (q.alvo ? meta.compostos[q.alvo] : porEsp[q.espectro]);

function validarEspectro(q) {
  const alvo = alvoDe(q);
  assert.ok(alvo, `${q.id}: espectro ${q.espectro ?? q.alvo}`);
  assert.equal(q.alternativas[q.correta], "@est:" + alvo.estId, q.id);
  if (q.alvo) assert.ok(typeof q.bandas === "string" && q.bandas.split(";").length > 5, `${q.id}: sala sem bandas (texto)`);
  assert.ok(NIVEL_OPCOES[q.nivel].includes(q.alternativas.length), `${q.id}: ${q.nivel} com ${q.alternativas.length}`);
  assert.equal(new Set(q.alternativas).size, q.alternativas.length, `${q.id}: repetidas`);
  for (const a of q.alternativas) {
    const c = compostos[est(a)];
    assert.ok(c, `${q.id}: ${a} não existe`);
    assert.equal(c.grupo, false, `${q.id}: ${a} é de grupo`);
    if (a !== "@est:" + alvo.estId) assert.notEqual(c.funcao, alvo.funcao, `${q.id}: ${a} tem a mesma função do alvo`);
    if (q.nivel !== "facil") assert.ok(Math.abs(c.nC - alvo.nC) <= 1, `${q.id}: ${a} nC ${c.nC} × ${alvo.nC}`);
  }
  if (q.nivel === "facil") assert.notEqual(compostos[est(q.alternativas[1 - q.correta])].familia, alvo.familia, `${q.id}: fácil da mesma família`);
}

function validarTeorica(q) {
  assert.equal(q.tipo, "mc");
  assert.ok(q.alternativas.length >= 2 && q.alternativas.length <= 5 && q.correta >= 0 && q.correta < q.alternativas.length, q.id);
  assert.ok(q.explicacao?.trim(), q.id);
}

const validar = (q) => {
  if (semMeta && q.subtipo === "espectro") return; // CI (sem dados privados): só as teóricas
  assert.ok(["facil", "medio", "dificil"].includes(q.nivel), `${q.id}: nível`);
  assert.ok(Number.isInteger(q.bloco) && q.bloco >= 1 && q.bloco <= 9, `${q.id}: bloco`);
  assert.ok(q.explicacao?.trim(), q.id);
  for (const p of PROIBIDAS) assert.ok(!q.enunciado.toLowerCase().includes(p) || q.subtipo !== "espectro", `${q.id}: enunciado cita "${p}"`);
  (q.subtipo === "espectro" ? validarEspectro : validarTeorica)(q);
};

test("9 blocos do IV", () => assert.equal(blocos.length, 9));

test("casa: questões válidas, ≥ 60 de espectro, ≥ 20 teóricas, ≥ 4 por bloco", () => {
  casa.forEach(validar);
  assert.ok(casa.filter((q) => q.subtipo === "espectro").length >= 60);
  assert.ok(casa.filter((q) => q.subtipo !== "espectro").length >= 20);
  for (let b = 1; b <= 9; b++) assert.ok(casa.filter((q) => q.bloco === b).length >= 4, `bloco ${b}`);
  assert.equal(new Set(casa.map((q) => q.id)).size, casa.length);
});

test("explicação das questões de espectro cita as outras opções", () => {
  for (const q of casa.filter((x) => x.subtipo === "espectro")) assert.match(q.explicacao, /As outras:/, q.id);
});

test("sala: pool ≥ 30 válido e sequência de 2 rodadas com progressão de nível", { skip: !sala || semMeta }, () => {
  sala.questoes.forEach(validar);
  assert.ok(sala.questoes.length >= 30);
  const s = sala.sequencia;
  assert.equal(s.length, 20);
  s.forEach(validar);
  const r1 = s.slice(0, 10), r2 = s.slice(10);
  assert.ok(r1.every((q) => q.subtipo !== "espectro" || ["facil", "medio"].includes(q.nivel)));
  assert.ok(r2.every((q) => q.subtipo !== "espectro" || ["medio", "dificil"].includes(q.nivel)));
  assert.ok(r1.filter((q) => q.subtipo !== "espectro").length >= 2 && r2.filter((q) => q.subtipo !== "espectro").length >= 2);
  assert.ok(r2.some((q) => q.nivel === "dificil" && q.alternativas.length === 5));
});

test("nenhuma questão idêntica entre casa e sala; ids diferentes", { skip: !sala || semMeta }, () => {
  const chave = (q) => q.subtipo === "espectro" ? `${alvoDe(q).id}|${[...q.alternativas].sort().join(",")}` : q.enunciado;
  const casaK = new Set(casa.map(chave));
  for (const q of [...sala.questoes, ...sala.sequencia]) assert.ok(!casaK.has(chave(q)), `repetida: ${q.id}`);
  const ids = new Set(casa.map((q) => q.id));
  for (const q of sala.questoes) assert.ok(!ids.has(q.id));
});

const temListaAninhada = (v) => Array.isArray(v) ? v.some((x) => Array.isArray(x) || temListaAninhada(x)) : v && typeof v === "object" ? Object.values(v).some(temListaAninhada) : false;
test("nada que vai para o Firestore (banco do quiz) tem lista dentro de lista", { skip: !sala }, () => {
  for (const q of [...sala.questoes, ...sala.sequencia]) assert.equal(temListaAninhada(q), false, q.id);
});
