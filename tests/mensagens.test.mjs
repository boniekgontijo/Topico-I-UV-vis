import { test } from "node:test";
import assert from "node:assert/strict";
import { incentivo, ENCORAJAR, PARABENS, plural } from "../public/js/core/mensagens.js";

test("mensagens de erro são gentis e variadas", () => {
  assert.ok(ENCORAJAR.length >= 4);
  ENCORAJAR.forEach((m) => assert.doesNotMatch(m, /errou|errado|incorreto/i));
  assert.ok(ENCORAJAR.includes(incentivo(false, () => 0)));
  assert.ok(PARABENS.includes(incentivo(true, () => 0.99)));
});

test("plural em português", () => {
  assert.equal(plural(1, "acerto", "acertos"), "1 acerto");
  assert.equal(plural(0, "acerto", "acertos"), "0 acertos");
  assert.equal(plural(3, "acerto", "acertos"), "3 acertos");
});
