import { test } from "node:test";
import assert from "node:assert/strict";
import { validarBanco, prepararCompeticao, perguntaPublica } from "../public/js/core/competicao.js";

const q = (id, bloco) => ({ id, bloco, tipo: "mc", enunciado: `Q${id}`, alternativas: ["certa", "b", "c", "d"], correta: 0, explicacao: "e" });
const banco = { modulo: "uvvis", questoes: [q("a", 1), q("b", 1), q("c", 2), q("d", 3), q("e", 3)] };

test("valida o banco e conta questões por bloco", () => {
  const r = validarBanco(banco);
  assert.equal(r.ok, true);
  assert.deepEqual(r.porBloco, { 1: 2, 2: 1, 3: 2 });
});

test("rejeita banco com questão fora do formato", () => {
  assert.equal(validarBanco({ questoes: [{ ...q("x", 1), correta: 7 }] }).ok, false);
  assert.equal(validarBanco({ questoes: [{ ...q("x", 1), tipo: "num" }] }).ok, false);
  assert.equal(validarBanco({}).ok, false);
});

test("prepara a competição só com os blocos escolhidos, no máximo n, alternativas embaralhadas", () => {
  const sel = prepararCompeticao(banco.questoes, { blocos: [1, 3], n: 3 });
  assert.equal(sel.length, 3);
  sel.forEach((x) => { assert.ok([1, 3].includes(x.bloco)); assert.equal(x.alternativas[x.correta], "certa"); });
  assert.equal(new Set(sel.map((x) => x.id)).size, 3);
  assert.equal(prepararCompeticao(banco.questoes, { blocos: [2], n: 10 }).length, 1);
});

test("a pergunta pública não leva gabarito nem explicação", () => {
  const p = perguntaPublica({ ...q("a", 1), figura: "img/x.png" });
  assert.deepEqual(Object.keys(p).sort(), ["alternativas", "bloco", "enunciado", "figura"]);
  assert.equal("correta" in perguntaPublica(q("b", 2)), false);
});
