import { test } from "node:test";
import assert from "node:assert/strict";
import { embaralharQuestao } from "../public/js/core/embaralhar.js";

const q = { id: "x", tipo: "mc", alternativas: ["certa", "b", "c", "d"], correta: 0 };

test("a alternativa correta continua correta depois de embaralhar", () => {
  for (let i = 0; i < 50; i++) {
    const e = embaralharQuestao(q);
    assert.equal(e.alternativas[e.correta], "certa");
    assert.deepEqual([...e.alternativas].sort(), [...q.alternativas].sort());
  }
});

test("a correta não fica sempre na primeira posição", () => {
  const posicoes = new Set(Array.from({ length: 60 }, () => embaralharQuestao(q).correta));
  assert.ok(posicoes.size >= 3);
});

test("não altera a questão original nem questões que não são mc", () => {
  embaralharQuestao(q);
  assert.deepEqual(q.alternativas, ["certa", "b", "c", "d"]);
  const v = { tipo: "vf", correta: true };
  assert.equal(embaralharQuestao(v), v);
});
