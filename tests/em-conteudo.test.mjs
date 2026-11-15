// Conteúdo do módulo EM (espectrometria de massas): quiz de prática, público, sem nota.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BASE = new URL("../public/conteudo/em/", import.meta.url);
const ler = (arq) => JSON.parse(readFileSync(new URL(arq, BASE), "utf8"));

test("EM: blocos numerados 1..n, com título", () => {
  const blocos = ler("blocos.json");
  assert.ok(blocos.length >= 5);
  blocos.forEach((b, i) => { assert.equal(b.n, i + 1); assert.ok(b.titulo.trim()); });
});

test("EM: quiz de prática com as 16 questões aprovadas, todas de múltipla escolha e com explicação", () => {
  const { modulo, questoes } = ler("quiz.json");
  const nBlocos = ler("blocos.json").length;
  assert.equal(modulo, "em");
  assert.equal(questoes.length, 16);
  assert.equal(new Set(questoes.map((q) => q.id)).size, questoes.length, "ids repetidos");
  for (const q of questoes) {
    assert.match(q.id, /^em-q\d{2}$/);
    assert.equal(q.tipo, "mc", q.id);
    assert.ok(Number.isInteger(q.bloco) && q.bloco >= 1 && q.bloco <= nBlocos, `${q.id}: bloco`);
    assert.equal(q.alternativas.length, 4, `${q.id}: 4 alternativas`);
    assert.equal(new Set(q.alternativas).size, 4, `${q.id}: alternativas repetidas`);
    assert.ok(Number.isInteger(q.correta) && q.correta >= 0 && q.correta < 4, `${q.id}: correta`);
    assert.ok(q.enunciado.trim() && q.explicacao.trim(), q.id);
    assert.ok(q.enunciado.replace(/<[^>]+>/g, "").length <= 230, `${q.id}: enunciado longo`);
    q.alternativas.forEach((a) => assert.ok(a.replace(/<[^>]+>/g, "").length <= 70, `${q.id}: alternativa longa: ${a}`));
  }
  for (let b = 1; b <= nBlocos; b++) assert.ok(questoes.some((q) => q.bloco === b), `bloco ${b} vazio`);
});

test("EM: todo m/z do texto em itálico (<i>m/z</i>)", () => {
  const { questoes } = ler("quiz.json");
  for (const q of questoes)
    for (const t of [q.enunciado, q.explicacao, ...q.alternativas])
      assert.ok(!/(^|[^>])m\/z/.test(t), `${q.id}: m/z sem itálico em "${t.slice(0, 60)}"`);
});
