import { test } from "node:test";
import assert from "node:assert/strict";
import { montarLinhas, paraCSV } from "../public/js/core/painel-dados.js";

const t = (iso) => ({ toMillis: () => Date.parse(iso) });
const alunos = [
  { matricula: "111", nome: "Ana", primeiroAcesso: t("2026-10-01T10:00:00Z"), ultimoAcesso: t("2026-10-05T10:00:00Z") },
  { matricula: "222", nome: "Bia", primeiroAcesso: t("2026-10-02T10:00:00Z"), ultimoAcesso: t("2026-10-02T10:00:00Z") },
  { matricula: "333", nome: "Caio", primeiroAcesso: t("2026-10-03T10:00:00Z"), ultimoAcesso: t("2026-10-03T10:00:00Z") },
];
const acessos = [{ matricula: "111" }, { matricula: "111" }, { matricula: "222" }];
const r = (matricula, questaoId, bloco, correta, tentativa, extra = {}) =>
  ({ tipo: "casa", atividade: `casa-${bloco}`, questaoId, bloco, correta, tentativa, membros: [{ nome: "?", matricula }], ...extra });
const respostas = [
  r("111", "c4-01", 4, false, 1), r("111", "c4-01", 4, true, 2), r("111", "c4-02", 4, true, 1),
  { tipo: "grupo", atividade: "grupo-A", questaoId: "gA-1", bloco: 4, correta: true, tentativa: 1, equipe: "X",
    membros: [{ nome: "Bia", matricula: "222" }, { nome: "Caio", matricula: "333" }] },
];
const quizzes = [
  { codigo: "100000", modo: "individual", jogadores: [{ uid: "u1", matricula: "111", nome: "Ana" }], placar: { u1: { pontos: 1500 } } },
  { codigo: "200000", modo: "equipe", jogadores: [{ uid: "e1", matricula: "222", nome: "Equipe", membros: [{ matricula: "222" }, { matricula: "333" }] }], placar: { e1: { pontos: 800 } } },
];

test("conta acessos e só a primeira tentativa de casa", () => {
  const [ana] = montarLinhas(alunos, acessos, respostas, quizzes);
  assert.equal(ana.nAcessos, 2);
  assert.equal(ana.casaPctPorBloco[4], 50); // c4-01 errou na 1ª, c4-02 acertou
  assert.equal(ana.casaPctPorBloco[1], null);
});

test("atividade em grupo credita todos os membros", () => {
  const linhas = montarLinhas(alunos, acessos, respostas, quizzes);
  assert.deepEqual(linhas.find((l) => l.matricula === "222").grupoAtividades, ["grupo-A"]);
  assert.deepEqual(linhas.find((l) => l.matricula === "333").grupoAtividades, ["grupo-A"]);
});

test("quiz individual e em equipe somam para cada integrante", () => {
  const linhas = montarLinhas(alunos, acessos, respostas, quizzes);
  const por = (m) => linhas.find((l) => l.matricula === m);
  assert.deepEqual([por("111").quizzes, por("111").quizPontos], [1, 1500]);
  assert.deepEqual([por("333").quizzes, por("333").quizPontos], [1, 800]);
});

test("CSV com BOM, ponto e vírgula e vírgula decimal", () => {
  const csv = paraCSV(montarLinhas(alunos, acessos, respostas, quizzes));
  assert.ok(csv.startsWith("﻿"));
  const [cab, l1] = csv.slice(1).split("\r\n");
  assert.match(cab, /^matricula;nome;/);
  assert.ok(cab.includes("bloco4_%"));
  assert.match(l1, /^111;Ana;/);
  assert.ok(l1.includes(";50;") || l1.includes(";50,0;"));
});
