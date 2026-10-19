import { test } from "node:test";
import assert from "node:assert/strict";
import * as uv from "../public/js/core/uvvis.js";

const perto = (x, y, tol) => assert.ok(Math.abs(x - y) <= tol, `${x} ≉ ${y} (±${tol})`);

test("concentração e %T do exemplo do slide 23", () => {
  perto(uv.concentracao(0.450, 15000, 1.0), 3.0e-5, 3e-8);
  perto(uv.percentT(0.450), 35.5, 0.05);
});

test("absorbância da Estação A", () => {
  perto(uv.absorbancia(12000, 1.0, 2.5e-5), 0.300, 1e-9);
});

test("transmitância a partir de A e volta", () => {
  perto(uv.transmitancia(0.523), 0.300, 0.001);
  perto(uv.absDeT(0.300), 0.523, 0.001);
});

test("energia de um fóton de 300 nm em kJ/mol", () => {
  perto(uv.energiaKJmol(300), 398.8, 0.5);
});

test("λmáx de polienos segue os slides e cresce com a conjugação", () => {
  assert.equal(uv.lambdaPolieno(1), 171);
  assert.equal(uv.lambdaPolieno(2), 217);
  assert.equal(uv.lambdaPolieno(3), 258);
  assert.equal(uv.lambdaPolieno(11), 452);
  for (let n = 1; n < 11; n++) assert.ok(uv.lambdaPolieno(n + 1) > uv.lambdaPolieno(n));
});

test("cor complementar da roda de cores", () => {
  assert.equal(uv.corComplementar(452).observada, "laranja");
  assert.equal(uv.corComplementar(530).observada, "púrpura");
  assert.equal(uv.corComplementar(300).observada, "incolor");
});

test("banda gaussiana tem máximo em λmáx", () => {
  perto(uv.banda(450, 450, 0.8), 0.8, 1e-12);
  assert.ok(uv.banda(500, 450, 0.8) < 0.8);
});

test("regressão linear", () => {
  const r = uv.regressaoLinear([0, 1, 2, 3], [0.1, 0.3, 0.5, 0.7]);
  perto(r.a, 0.2, 1e-9); perto(r.b, 0.1, 1e-9); perto(r.r2, 1, 1e-9);
  assert.equal(r.residuos.length, 4);
});

test("LOD e LOQ", () => {
  perto(uv.lod(0.002, 0.0817), 0.0808, 1e-4);
  perto(uv.loq(0.002, 0.0817), 0.2448, 1e-4);
});

test("Woodward-Fieser: exemplos dos slides 62 e 65", () => {
  assert.equal(uv.woodwardFieser("dieno-hetero", { alquila: 4 }), 234);
  assert.equal(uv.woodwardFieser("dieno-homo", {}), 253);
  assert.equal(uv.woodwardFieser("enona", { beta: 1 }), 227);
  assert.equal(uv.woodwardFieser("enona", { beta: 2 }), 239);
  assert.equal(uv.woodwardFieser("enona", { beta: 2, exociclica: 1 }), 244);
});
