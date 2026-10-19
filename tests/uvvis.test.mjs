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

test("auxiliares das contas do Workshop", () => {
  perto(uv.inclinacao2p(10, 0.198, 15, 0.292), 0.0188, 1e-9);
  perto(uv.concentracaoDaCurva(0.250, 0.0188, 0), 13.298, 1e-3);
  perto(uv.concentracaoDaCurva(0.47, 0.0817, -0.0031), 5.79, 0.01);
  perto(uv.diferenca(0.462, 0.032), 0.430, 1e-12);
  perto(uv.lambdaDeEnergiaKJmol(398.8), 300, 0.5);
});

test("Woodward-Fieser: tabelas completas dos slides 61, 63 e 64", () => {
  assert.equal(uv.woodwardFieser("dieno-homo", { alquila: 3, exociclica: 1 }), 273);
  assert.equal(uv.woodwardFieser("dieno-hetero", { OR: 1, alquila: 2 }), 230);
  assert.equal(uv.woodwardFieser("dieno-hetero", { NR2: 1 }), 274);
  assert.equal(uv.woodwardFieser("dieno-hetero", { SR: 1, Cl: 1, OCOR: 1 }), 249);
  assert.equal(uv.woodwardFieser("enona-anel5", { beta: 1 }), 214);
  assert.equal(uv.woodwardFieser("aldeido", { alfa: 1 }), 220);
  assert.equal(uv.woodwardFieser("acido-ester", { beta: 2 }), 219);
  assert.equal(uv.woodwardFieser("enona", { extensao: 1, homoanular: 1, gamaDelta: 1 }), 302);
  assert.throws(() => uv.woodwardFieser("enona", { inexistente: 1 }));
});

test("absortividade a partir de A e diluição C₁V₁ = C₂V₂", () => {
  perto(uv.absortividade(0.62, 1.0, 5e-5), 12400, 1e-6);
  perto(uv.diluicaoV1(100, 5, 50), 2.5, 1e-12);
});
