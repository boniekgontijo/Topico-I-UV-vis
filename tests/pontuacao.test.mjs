import { test } from "node:test";
import assert from "node:assert/strict";
import { pontosResposta, aplicarRodada, ranking } from "../public/js/core/pontuacao.js";

test("pontos estilo Kahoot conforme a rapidez", () => {
  assert.equal(pontosResposta({ correta: true, dtMs: 0, limiteMs: 20000 }), 1000);
  assert.equal(pontosResposta({ correta: true, dtMs: 10000, limiteMs: 20000 }), 750);
  assert.equal(pontosResposta({ correta: true, dtMs: 20000, limiteMs: 20000 }), 500);
  assert.equal(pontosResposta({ correta: true, dtMs: 25000, limiteMs: 20000 }), 500);
  assert.equal(pontosResposta({ correta: true, dtMs: -300, limiteMs: 20000 }), 1000);
  assert.equal(pontosResposta({ correta: false, dtMs: 0, limiteMs: 20000 }), 0);
});

test("rodada atualiza placar sem mutar a entrada", () => {
  const placar = { u3: { nome: "Caio", pontos: 400, somaDtAcertos: 5000, acertos: 1 } };
  const copia = structuredClone(placar);
  const novo = aplicarRodada(placar,
    [{ uid: "u1", alternativa: 1, dtMs: 2000 }, { uid: "u2", alternativa: 0, dtMs: 1000 }],
    1, 20000, { u1: "Ana", u2: "Bia", u3: "Caio" });
  assert.deepEqual(placar, copia);
  assert.deepEqual(novo.u1, { nome: "Ana", pontos: 950, somaDtAcertos: 2000, acertos: 1 });
  assert.deepEqual(novo.u2, { nome: "Bia", pontos: 0, somaDtAcertos: 0, acertos: 0 });
  assert.deepEqual(novo.u3, placar.u3);
});

test("ranking desempata pela menor soma de tempos", () => {
  const r = ranking({
    a: { nome: "A", pontos: 900, somaDtAcertos: 9000, acertos: 1 },
    b: { nome: "B", pontos: 900, somaDtAcertos: 3000, acertos: 1 },
    c: { nome: "C", pontos: 1900, somaDtAcertos: 4000, acertos: 2 },
  });
  assert.deepEqual(r.map((x) => [x.uid, x.posicao]), [["c", 1], ["b", 2], ["a", 3]]);
});
