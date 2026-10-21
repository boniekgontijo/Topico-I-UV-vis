import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as uv from "../public/js/core/uvvis.js";

const BASE = new URL("../public/conteudo/uvvis/", import.meta.url);
const ler = (u) => JSON.parse(readFileSync(u, "utf8"));
const PRIV = new URL("../privado/uvvis-competicao.json", import.meta.url);

const blocos = ler(new URL("blocos.json", BASE));
const casa = ler(new URL("casa.json", BASE)).questoes;
const grupo = ler(new URL("grupo.json", BASE)).estacoes;
// No GitHub (SEM_PRIVADO=1) o banco do quiz não existe: ele fica só no computador do professor.
const semPrivado = process.env.SEM_PRIVADO === "1";
assert.ok(semPrivado || existsSync(PRIV), "crie privado/uvvis-competicao.json");
const comp = semPrivado ? [] : ler(PRIV).questoes;
const quizPratica = ler(new URL("quiz.json", BASE)).questoes; // quiz de prática (público); mesmas questões do banco dos slides
const todasGrupo = grupo.flatMap((e) => e.questoes);
const todas = [...casa, ...todasGrupo, ...comp];

function validarQuestao(q) {
  assert.ok(["mc", "num", "vf"].includes(q.tipo), `${q.id}: tipo ${q.tipo}`);
  assert.ok(Number.isInteger(q.bloco) && q.bloco >= 1 && q.bloco <= 10, `${q.id}: bloco`);
  assert.ok(q.enunciado?.trim(), `${q.id}: enunciado`);
  assert.ok(q.explicacao?.trim(), `${q.id}: explicação`);
  if (q.tipo === "mc") {
    assert.ok(q.alternativas.length >= 2 && q.alternativas.length <= 4, `${q.id}: nº alternativas`);
    assert.ok(Number.isInteger(q.correta) && q.correta >= 0 && q.correta < q.alternativas.length, `${q.id}: correta`);
    assert.equal(new Set(q.alternativas).size, q.alternativas.length, `${q.id}: alternativas repetidas`);
  }
  if (q.tipo === "vf") assert.equal(typeof q.correta, "boolean", `${q.id}: vf`);
  if (q.tipo === "num") {
    assert.equal(typeof q.resposta, "number", `${q.id}: resposta`);
    assert.ok(q.calc && typeof uv[q.calc.fn] === "function", `${q.id}: calc.fn ${q.calc?.fn}`);
    const v = uv[q.calc.fn](...q.calc.args);
    const tol = q.tol ?? 0.02;
    assert.ok(Math.abs(v - q.resposta) <= tol * Math.abs(q.resposta), `${q.id}: gabarito ${q.resposta} ≠ calc ${v}`);
  }
  if (q.figura) assert.ok(existsSync(new URL(q.figura, BASE)), `${q.id}: figura ${q.figura} não existe`);
}

test("10 blocos", () => assert.equal(blocos.length, 10));

test("ids únicos", () => {
  const ids = todas.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, "ids repetidos");
});

test("todas as questões são válidas e o gabarito numérico confere com o cálculo", () => {
  todas.forEach(validarQuestao);
});

test("casa: ≥ 8 questões por bloco", () => {
  for (let b = 1; b <= 10; b++) assert.ok(casa.filter((q) => q.bloco === b).length >= 8, `bloco ${b}`);
});

test("casa: toda questão pede raciocínio (T1–T6) e todos os tipos aparecem", () => {
  const tipos = ["T1", "T2", "T3", "T4", "T5", "T6"];
  for (const q of casa) assert.ok(tipos.includes(q.raciocinio), `${q.id}: raciocinio ${q.raciocinio}`);
  for (const t of tipos) assert.ok(casa.filter((q) => q.raciocinio === t).length >= 8, `poucas questões ${t}`);
});

test("quiz: só múltipla escolha, ≥ 40, ≥ 4 por bloco, textos curtos", { skip: semPrivado }, () => {
  assert.ok(comp.length >= 40);
  for (const q of comp) {
    assert.equal(q.tipo, "mc", q.id);
    assert.ok(q.enunciado.length <= 140, `${q.id}: enunciado longo (${q.enunciado.length})`);
    q.alternativas.forEach((a) => assert.ok(a.length <= 60, `${q.id}: alternativa longa: ${a}`));
  }
  for (let b = 1; b <= 10; b++) assert.ok(comp.filter((q) => q.bloco === b).length >= 4, `bloco ${b}`);
});

test("quiz de prática: válido, curto, ≥ 4 por bloco, raciocínio T1–T6, sem repetir ids da casa", () => {
  const tipos = ["T1", "T2", "T3", "T4", "T5", "T6"];
  const idsCasa = new Set(casa.map((q) => q.id));
  assert.ok(quizPratica.length >= 40);
  for (const q of quizPratica) {
    validarQuestao(q);
    assert.equal(q.tipo, "mc", q.id);
    assert.ok(!idsCasa.has(q.id), `${q.id} repete id da casa`);
    assert.ok(tipos.includes(q.raciocinio), `${q.id}: raciocinio ${q.raciocinio}`);
    assert.ok(q.enunciado.length <= 140, `${q.id}: enunciado longo`);
    q.alternativas.forEach((a) => assert.ok(a.length <= 60, `${q.id}: alternativa longa: ${a}`));
    if (q.figuraResposta) assert.ok(existsSync(new URL(q.figuraResposta, BASE)), `${q.id}: figura ${q.figuraResposta} não existe`);
  }
  for (let b = 1; b <= 10; b++) assert.ok(quizPratica.filter((q) => q.bloco === b).length >= 4, `bloco ${b}`);
  for (const t of tipos) assert.ok(quizPratica.filter((q) => q.raciocinio === t).length >= 5, `poucas questões ${t}`);
});

test("quiz de prática = banco dos slides (gerados juntos por Revisao_questoes/uv_quiz.py)", { skip: semPrivado }, () => {
  assert.deepEqual(quizPratica, comp);
});

test("grupo: estações A–E e Plenário, sem questões abertas", () => {
  assert.deepEqual(grupo.map((e) => e.id), ["A", "B", "C", "D", "E", "P"]);
  grupo.forEach((e) => assert.ok(e.questoes.length >= 4, `estação ${e.id}`));
});
