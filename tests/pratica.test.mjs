import { test } from "node:test";
import assert from "node:assert/strict";
import { sortearRodada } from "../public/js/core/pratica.js";

const banco = [];
for (let b = 1; b <= 10; b++) for (let k = 1; k <= 5; k++) banco.push({ id: `k${b}-0${k}`, bloco: b });

test("rodada mista: uma questão de cada bloco, em ordem de bloco", () => {
  const r = sortearRodada(banco);
  assert.deepEqual(r.map((q) => q.bloco), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("rodada de um bloco: todas as questões do bloco, sem repetir", () => {
  const r = sortearRodada(banco, { bloco: "4" });
  assert.equal(r.length, 5);
  assert.ok(r.every((q) => q.bloco === 4));
  assert.equal(new Set(r.map((q) => q.id)).size, 5);
});

test("rodadas variam (sorteio usa rnd)", () => {
  const a = sortearRodada(banco, { rnd: () => 0 }).map((q) => q.id).join();
  const b = sortearRodada(banco, { rnd: () => 0.99 }).map((q) => q.id).join();
  assert.notEqual(a, b);
});
