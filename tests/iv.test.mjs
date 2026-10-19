import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transmitancia, pontosEspectro } from "../public/js/core/iv.js";

const { ids, pontos: amostra } = JSON.parse(readFileSync(new URL("./fixtures/iv-amostra.json", import.meta.url)));
const esp = JSON.parse(readFileSync(new URL("../public/conteudo/iv/espectros.json", import.meta.url)));

test("transmitância igual à do gerador em Python", () => {
  for (const [id, pts] of Object.entries(amostra)) {
    for (const [x, T] of pts) assert.ok(Math.abs(transmitancia(x, esp[id]) - T) <= 0.05, `${id} em ${x}: ${transmitancia(x, esp[id])} ≠ ${T}`);
  }
});

test("pontos do espectro: 1500, de 4000 a 400", () => {
  const p = pontosEspectro(esp[ids["2-pentanona"]]);
  assert.equal(p.length, 1500);
  assert.equal(p[0][0], 4000);
  assert.equal(p[p.length - 1][0], 400);
});

test("banda fina de C≡N continua visível (mínimo em 2250 ± 3, T < 60)", () => {
  const p = pontosEspectro(esp[ids.butironitrila]).filter(([x]) => x >= 2200 && x <= 2300);
  const min = p.reduce((m, q) => (q[1] < m[1] ? q : m));
  assert.ok(Math.abs(min[0] - 2250) <= 3, `mínimo em ${min[0]}`);
  assert.ok(min[1] < 60, `T = ${min[1]}`);
});

import { codificarBandas, decodificarBandas } from "../public/js/core/iv.js";
test("bandas viram texto para o Firestore (que não aceita lista dentro de lista) e voltam iguais", () => {
  const b = [[1715, 1.7, 10], [3330, 1.1, 130, "g"], [1058.25, 0.05, 6.4]];
  const t = codificarBandas(b);
  assert.equal(typeof t, "string");
  assert.deepEqual(decodificarBandas(t), [[1715, 1.7, 10, "l"], [3330, 1.1, 130, "g"], [1058.25, 0.05, 6.4, "l"]]);
  assert.deepEqual(decodificarBandas(b), b); // já é lista: passa direto
});
