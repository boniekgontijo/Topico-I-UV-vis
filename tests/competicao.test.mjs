import { test } from "node:test";
import assert from "node:assert/strict";
import { validarBanco, prepararCompeticao, perguntaPublica } from "../public/js/core/competicao.js";

const q = (id, bloco) => ({ id, bloco, tipo: "mc", enunciado: `Q${id}`, alternativas: ["certa", "b", "c", "d"], correta: 0, explicacao: "e" });
const banco = { modulo: "uvvis", questoes: [q("a", 1), q("b", 1), q("c", 2), q("d", 3), q("e", 3)] };

test("valida o banco e conta questões por bloco", () => {
  const r = validarBanco(banco);
  assert.equal(r.ok, true);
  assert.deepEqual(r.porBloco, { 1: 2, 2: 1, 3: 2 });
});

test("rejeita banco com questão fora do formato", () => {
  assert.equal(validarBanco({ questoes: [{ ...q("x", 1), correta: 7 }] }).ok, false);
  assert.equal(validarBanco({ questoes: [{ ...q("x", 1), tipo: "num" }] }).ok, false);
  assert.equal(validarBanco({}).ok, false);
});

test("prepara a competição só com os blocos escolhidos, no máximo n, alternativas embaralhadas", () => {
  const sel = prepararCompeticao(banco.questoes, { blocos: [1, 3], n: 3 });
  assert.equal(sel.length, 3);
  sel.forEach((x) => { assert.ok([1, 3].includes(x.bloco)); assert.equal(x.alternativas[x.correta], "certa"); });
  assert.equal(new Set(sel.map((x) => x.id)).size, 3);
  assert.equal(prepararCompeticao(banco.questoes, { blocos: [2], n: 10 }).length, 1);
});

test("a pergunta pública não leva gabarito nem explicação", () => {
  const p = perguntaPublica({ ...q("a", 1), figura: "img/x.png" });
  assert.deepEqual(Object.keys(p).sort(), ["alternativas", "bloco", "enunciado", "figura"]);
  assert.equal("correta" in perguntaPublica(q("b", 2)), false);
});

import { decidirFechamento, podeRevelar } from "../public/js/core/competicao.js";
test("fechamento da rodada acontece uma vez só", () => {
  assert.equal(decidirFechamento({ estado: "pergunta", indice: 2 }, 2), "fechar");
  assert.equal(decidirFechamento({ estado: "fechando", indice: 2 }, 2), "retomar");
  assert.equal(decidirFechamento({ estado: "revelada", indice: 2 }, 2), "ignorar");
  assert.equal(decidirFechamento({ estado: "pergunta", indice: 3 }, 2), "ignorar");
  assert.equal(podeRevelar({ estado: "fechando", indice: 2 }, 2), true);
  assert.equal(podeRevelar({ estado: "revelada", indice: 2 }, 2), false);
});

import { infoRodada, AVATARES } from "../public/js/core/competicao.js";
test("rodadas: 2 × 10 perguntas", () => {
  assert.deepEqual(infoRodada(0, 10, 20), { rodada: 1, totalRodadas: 2, posNaRodada: 1, fimDaRodada: false, ultima: false });
  assert.deepEqual(infoRodada(9, 10, 20), { rodada: 1, totalRodadas: 2, posNaRodada: 10, fimDaRodada: true, ultima: false });
  assert.deepEqual(infoRodada(10, 10, 20), { rodada: 2, totalRodadas: 2, posNaRodada: 1, fimDaRodada: false, ultima: false });
  assert.deepEqual(infoRodada(19, 10, 20), { rodada: 2, totalRodadas: 2, posNaRodada: 10, fimDaRodada: true, ultima: true });
});
test("rodadas: sala antiga sem porRodada vira uma rodada só", () => {
  assert.deepEqual(infoRodada(2, undefined, 3), { rodada: 1, totalRodadas: 1, posNaRodada: 3, fimDaRodada: true, ultima: true });
});
test("avatares: ao menos 16, sem repetição, curtos", () => {
  assert.ok(AVATARES.length >= 16);
  assert.equal(new Set(AVATARES.map((a) => a.emoji)).size, AVATARES.length);
  AVATARES.forEach((a) => { assert.ok(a.emoji.length <= 8); assert.ok(a.nome); });
});

test("banco com sequência fixa dos slides é validado", () => {
  const seq = [q("a", 1), { ...q("c", 2), alternativas: ["b", "certa", "c", "d"], correta: 1 }];
  const r = validarBanco({ ...banco, sequencia: seq });
  assert.equal(r.ok, true);
  assert.equal(r.nSequencia, 2);
  assert.equal(validarBanco({ ...banco, sequencia: [{ ...q("x", 1), correta: 9 }] }).ok, false);
  assert.equal(validarBanco(banco).nSequencia, 0);
});
