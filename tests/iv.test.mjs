import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transmitancia, pontosEspectro } from "../public/js/core/iv.js";

const amostra = JSON.parse(readFileSync(new URL("./fixtures/iv-amostra.json", import.meta.url)));
const comp = JSON.parse(readFileSync(new URL("../public/conteudo/iv/compostos.json", import.meta.url))).compostos;

test("transmitância igual à do gerador em Python", () => {
  for (const [id, pts] of Object.entries(amostra)) {
    for (const [x, T] of pts) assert.ok(Math.abs(transmitancia(x, comp[id].bandas) - T) <= 0.05, `${id} em ${x}: ${transmitancia(x, comp[id].bandas)} ≠ ${T}`);
  }
});

test("pontos do espectro: 1500, de 4000 a 400", () => {
  const p = pontosEspectro(comp["2-pentanona"].bandas);
  assert.equal(p.length, 1500);
  assert.equal(p[0][0], 4000);
  assert.equal(p[p.length - 1][0], 400);
});

test("banda fina de C≡N continua visível (mínimo em 2250 ± 3, T < 60)", () => {
  const p = pontosEspectro(comp.butironitrila.bandas).filter(([x]) => x >= 2200 && x <= 2300);
  const min = p.reduce((m, q) => (q[1] < m[1] ? q : m));
  assert.ok(Math.abs(min[0] - 2250) <= 3, `mínimo em ${min[0]}`);
  assert.ok(min[1] < 60, `T = ${min[1]}`);
});
