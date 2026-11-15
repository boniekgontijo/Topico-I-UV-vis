import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULOS, moduloDaURL, ehEstrutura, capa } from "../public/js/core/modulo.js";

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
  assert.deepEqual(Object.keys(MODULOS), ["uvvis", "iv", "em"]);
  assert.equal(MODULOS.em.base, "conteudo/em/");
  assert.equal(MODULOS.em.simuladores, false);
  assert.equal(MODULOS.iv.base, "conteudo/iv/");
  assert.equal(MODULOS.uvvis.simuladores, true);
  assert.equal(MODULOS.iv.simuladores, false);
});

test("EM: aba própria pelo ?m=em, com quiz de prática (como o UV-vis); IV segue com o quiz ao vivo", () => {
  assert.equal(moduloDaURL("?m=em", null), "em");
  assert.equal(moduloDaURL("?t=2026-2&m=em", "iv"), "em");
  assert.equal(MODULOS.em.pratica, true);
  assert.equal(MODULOS.em.titulo, "Espectrometria de massas");
  assert.equal(MODULOS.uvvis.pratica, true);
  assert.ok(!MODULOS.iv.pratica);
});

test("tela de entrada mostra o módulo do endereço (?m=em não pode aparecer como UV-vis)", () => {
  assert.equal(capa("em").titulo, "Espectrometria de massas em jogo");
  assert.equal(capa("iv").titulo, "IV em jogo");
  assert.equal(capa("uvvis").titulo, "UV-vis em jogo");
  assert.equal(capa("xx").titulo, "UV-vis em jogo");
  assert.ok(capa("em").icone);
});

test("alternativa de estrutura (@est:id)", () => {
  assert.equal(ehEstrutura("@est:2-pentanona"), "2-pentanona");
  assert.equal(ehEstrutura("A = εbc"), null);
  assert.equal(ehEstrutura("@est:"), null);
});
