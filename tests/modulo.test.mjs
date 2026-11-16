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

test("rota do painel: #comp/<módulo> e #comp/slides/<módulo>; sem módulo é UV-vis", async () => {
  const { moduloDaRota } = await import("../public/js/core/modulo.js");
  assert.equal(moduloDaRota([]), "uvvis");
  assert.equal(moduloDaRota(["iv"]), "iv");
  assert.equal(moduloDaRota(["em"]), "em");
  assert.equal(moduloDaRota(["slides", "em"]), "em");
  assert.equal(moduloDaRota(["slides"]), "uvvis");
  assert.equal(moduloDaRota(["xx"]), "uvvis");
});

test("link fixo do aluno para o quiz ao vivo leva o ?m= do módulo (exceto UV-vis)", async () => {
  const { linkQuizAoVivo } = await import("../public/js/core/modulo.js");
  const b = "https://x.github.io/Topico-I-UV-vis/";
  assert.equal(linkQuizAoVivo(b, "2026-2", "uvvis"), b + "?t=2026-2#quiz");
  assert.equal(linkQuizAoVivo(b, "2026-2", "iv"), b + "?t=2026-2&m=iv#quiz");
  assert.equal(linkQuizAoVivo(b, "2026-2", "em"), b + "?t=2026-2&m=em#quiz");
});
