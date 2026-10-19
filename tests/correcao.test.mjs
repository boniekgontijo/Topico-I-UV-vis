import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNumeroBR, corrigir } from "../public/js/core/correcao.js";

const perto = (x, y) => assert.ok(Math.abs(x - y) <= Math.abs(y) * 1e-9, `${x} ≉ ${y}`);

test("aceita números no formato brasileiro e científico", () => {
  perto(parseNumeroBR("0,523"), 0.523);
  perto(parseNumeroBR("3,0×10⁻⁵"), 3e-5);
  perto(parseNumeroBR("3,0 x 10^-5"), 3e-5);
  perto(parseNumeroBR("3,0·10^-5"), 3e-5);
  perto(parseNumeroBR("3e-5"), 3e-5);
  perto(parseNumeroBR("3.0E-5"), 3e-5);
  perto(parseNumeroBR(" 35,5 % "), 35.5);
  perto(parseNumeroBR("-0,25"), -0.25);
  perto(parseNumeroBR("234"), 234);
});

test("rejeita texto que não é número", () => {
  assert.ok(Number.isNaN(parseNumeroBR("")));
  assert.ok(Number.isNaN(parseNumeroBR("abc")));
  assert.ok(Number.isNaN(parseNumeroBR("1.234,5")));
  assert.ok(Number.isNaN(parseNumeroBR("3,0×")));
});

const qNum = { tipo: "num", resposta: 3.0e-5, tol: 0.02 };
test("numérica dentro e fora da tolerância", () => {
  assert.deepEqual(corrigir(qNum, "3,05e-5"), { valida: true, correta: true });
  assert.deepEqual(corrigir(qNum, "3,1e-5"), { valida: true, correta: false });
  assert.deepEqual(corrigir(qNum, "abc"), { valida: false, correta: false });
});

test("numérica usa tolerância padrão de 2 %", () => {
  const q = { tipo: "num", resposta: 100 };
  assert.equal(corrigir(q, "101,9").correta, true);
  assert.equal(corrigir(q, "102,1").correta, false);
});

test("múltipla escolha e verdadeiro/falso", () => {
  assert.deepEqual(corrigir({ tipo: "mc", correta: 2 }, 2), { valida: true, correta: true });
  assert.deepEqual(corrigir({ tipo: "mc", correta: 2 }, 0), { valida: true, correta: false });
  assert.deepEqual(corrigir({ tipo: "vf", correta: false }, false), { valida: true, correta: true });
  assert.deepEqual(corrigir({ tipo: "vf", correta: true }, false), { valida: true, correta: false });
});
