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
  assert.equal(ana.casaPctPorBloco.uvvis[4], 50); // c4-01 errou na 1ª, c4-02 acertou
  assert.equal(ana.casaPctPorBloco.uvvis[1], null);
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
  assert.ok(cab.includes("uv_bloco4_%") && cab.includes("iv_bloco9_%"));
  assert.match(l1, /^111;Ana;/);
  assert.ok(l1.includes(";50;") || l1.includes(";50,0;"));
});

test("primeira tentativa é a mais antiga por matrícula, mesmo vinda de outro celular", () => {
  const rs = [
    { ...r("111", "c1-01", 1, false, 1), quando: t("2026-10-04T10:00:00Z") }, // primeira de verdade
    { ...r("111", "c1-01", 1, true, 1), quando: t("2026-10-05T10:00:00Z") },  // refez no 2º celular
  ];
  const [ana] = montarLinhas(alunos, [], rs, []);
  assert.equal(ana.casaPctPorBloco.uvvis[1], 0);
});

test("quiz conta uma vez por aluno mesmo se ele entrou com dois celulares", () => {
  const q = [{ codigo: "1", modo: "individual", jogadores: [{ uid: "a", matricula: "111" }, { uid: "b", matricula: "111" }],
    placar: { a: { pontos: 300 }, b: { pontos: 900 } } }];
  const [ana] = montarLinhas(alunos, [], [], q);
  assert.deepEqual([ana.quizzes, ana.quizPontos], [1, 900]);
});

test("CSV neutraliza células que viram fórmula no Excel", () => {
  const csv = paraCSV(montarLinhas([{ matricula: "999", nome: "=HYPERLINK(\"x\")" }], [], [], []));
  assert.ok(csv.includes("'=HYPERLINK"));
});

test("nota de prática (0–10) = questões diferentes de casa feitas ÷ total, refazer não conta", () => {
  const rs = [r("111", "c1-01", 1, false, 1), r("111", "c1-01", 1, true, 2), r("111", "c1-02", 1, true, 1),
    r("222", "c1-01", 1, true, 1)];
  const linhas = montarLinhas(alunos, [], rs, [], { totais: { uvvis: 8, iv: 80 } });
  const por = (m) => linhas.find((l) => l.matricula === m);
  assert.equal(por("111").casaFeitas.uvvis, 2);
  assert.equal(por("111").pratica.uvvis, 2.5);  // 10 × 2/8
  assert.equal(por("222").pratica.uvvis, 1.3);  // 10 × 1/8 = 1,25 → 1,3
  assert.equal(por("333").pratica.uvvis, 0);
});

test("simuladores diferentes abertos contam pelos acessos", () => {
  const ac = [{ matricula: "111", pagina: "#sim/beer" }, { matricula: "111", pagina: "#sim/beer" },
    { matricula: "111", pagina: "#sim/curva" }, { matricula: "111", pagina: "#sim" }, { matricula: "222", pagina: "#casa/1" }];
  const linhas = montarLinhas(alunos, ac, [], [], { totais: { uvvis: 88, iv: 86 } });
  assert.equal(linhas.find((l) => l.matricula === "111").simuladores, 2);
  assert.equal(linhas.find((l) => l.matricula === "222").simuladores, 0);
});

test("CSV traz a nota de prática com vírgula decimal", () => {
  const csv = paraCSV(montarLinhas(alunos, [], [r("111", "c1-01", 1, true, 1), r("111", "c1-02", 1, true, 1)], [], { totais: { uvvis: 8, iv: 80 } }));
  const [cab, l1] = csv.slice(1).split("\r\n");
  assert.ok(cab.includes("pratica_uvvis_0a10") && cab.includes("pratica_iv_0a10") && cab.includes("questoes_casa_iv") && cab.includes("simuladores"));
  assert.ok(l1.split(";").includes("2,5"));
});

import { rotuloCorte } from "../public/js/core/painel-dados.js";
test("prática do IV separada; resposta antiga sem módulo conta no UV-vis", () => {
  const rs = [r("111", "c1-01", 1, true, 1),                                            // antiga, sem modulo → UV-vis
    { ...r("111", "iv-c-001", 7, true, 1), modulo: "iv", atividade: "iv-casa-7" },
    { ...r("111", "iv-c-002", 7, false, 1), modulo: "iv", atividade: "iv-casa-7" }];
  const [ana] = montarLinhas(alunos, [], rs, [], { totais: { uvvis: 88, iv: 80 } });
  assert.deepEqual(ana.casaFeitas, { uvvis: 1, iv: 2 });
  assert.equal(ana.pratica.iv, 0.3);   // 10 × 2/80 = 0,25 → 0,3
  assert.equal(ana.pratica.uvvis, 0.1);
  assert.equal(ana.casaPctPorBloco.iv[7], 50);
  assert.equal(ana.casaPctPorBloco.uvvis[7], null);
});
test("mesma questãoId em módulos diferentes não se mistura", () => {
  const rs = [r("111", "x1", 1, true, 1), { ...r("111", "x1", 1, false, 1), modulo: "iv" }];
  const [ana] = montarLinhas(alunos, [], rs, [], { totais: { uvvis: 10, iv: 10 } });
  assert.deepEqual(ana.casaFeitas, { uvvis: 1, iv: 1 });
});
test("data de corte: null vira 'a definir'", () => {
  assert.equal(rotuloCorte(null), "a definir");
  assert.equal(rotuloCorte("2026-11-09"), "09/11/2026");
});
