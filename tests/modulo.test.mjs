import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULOS, moduloDaURL, ehEstrutura } from "../public/js/core/modulo.js";

test("módulo vem só do ?m=; sem ele é sempre UV-vis (QR antigos do UV-vis nunca caem no IV)", () => {
  assert.equal(moduloDaURL("?t=2026-2", null), "uvvis");
  assert.equal(moduloDaURL("?m=iv", "uvvis"), "iv");
  assert.equal(moduloDaURL("?t=2026-2&m=iv", null), "iv");
  assert.equal(moduloDaURL("", "iv"), "uvvis");
  assert.equal(moduloDaURL("?t=2026-2#quiz", "iv"), "uvvis");
  assert.equal(moduloDaURL("?m=xx", null), "uvvis");
  assert.equal(moduloDaURL("", "lixo"), "uvvis");
});

test("módulos conhecidos e caminhos do conteúdo", () => {
  assert.deepEqual(Object.keys(MODULOS), ["uvvis", "iv"]);
  assert.equal(MODULOS.iv.base, "conteudo/iv/");
  assert.equal(MODULOS.uvvis.simuladores, true);
  assert.equal(MODULOS.iv.simuladores, false);
});

test("alternativa de estrutura (@est:id)", () => {
  assert.equal(ehEstrutura("@est:2-pentanona"), "2-pentanona");
  assert.equal(ehEstrutura("A = εbc"), null);
  assert.equal(ehEstrutura("@est:"), null);
});
