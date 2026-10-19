import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { consolidar } from "../public/js/core/grupo-iv.js";

const ler = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const PRIVC = new URL("../privado/iv-compostos.json", import.meta.url);
const meta = existsSync(PRIVC) ? ler("../privado/iv-compostos.json") : null;
const porEst = meta ? Object.fromEntries([...Object.values(meta.compostos), ...Object.values(meta.extras)].map((c) => [c.estId, c])) : {};
const porEsp = meta ? Object.fromEntries(Object.values(meta.compostos).map((c) => [c.espId, c])) : {};
const grupo = ler("../public/conteudo/iv/grupo.json");
const PRIV = new URL("../privado/iv-grupo.json", import.meta.url);

test("6 grupos sempre presentes; quem não entregou aparece como 'sem entrega'", () => {
  const problemas = [3, 1, 4, 2, 6, 5];
  const linhas = consolidar(problemas, [
    { grupo: 1, problema: 3, escolha: 2, justificativa: "1715 = C=O", membros: [{ nome: "Ana", matricula: "1" }], quando: 1 },
    { grupo: 3, problema: 4, escolha: 0, justificativa: "x", membros: [], quando: 2 },
  ]);
  assert.equal(linhas.length, 6);
  assert.deepEqual(linhas.map((l) => [l.grupo, l.problema, l.entregue]), [[1, 3, true], [2, 1, false], [3, 4, true], [4, 2, false], [5, 6, false], [6, 5, false]]);
  assert.equal(linhas[0].escolha, 2);
});

test("duas entregas do mesmo grupo: vale a mais recente", () => {
  const l = consolidar([1, 2, 3, 4, 5, 6], [
    { grupo: 2, problema: 2, escolha: 1, justificativa: "velha", quando: 10 },
    { grupo: 2, problema: 2, escolha: 3, justificativa: "nova", quando: 20 },
  ]);
  assert.equal(l[1].escolha, 3);
  assert.equal(l[1].justificativa, "nova");
});

test("grupo.json público não traz resposta; espectro é de composto reservado; candidatas são isômeros", { skip: !meta }, () => {
  assert.equal(grupo.problemas.length, 8);
  for (const p of grupo.problemas) {
    assert.ok(!("correta" in p) && !("resolucao" in p) && !("bandasChave" in p) && !("alvo" in p), `problema ${p.n}`);
    const alvo = porEsp[p.espectro];
    assert.equal(alvo?.grupo, true, `problema ${p.n}: espectro não reservado`);
    assert.ok(p.candidatas.includes("@est:" + alvo.estId));
    for (const c of p.candidatas) {
      const d = porEst[c.slice(5)];
      assert.ok(d, c);
      assert.equal(d.formula, p.formula, `${c} não é isômero`);
    }
    assert.ok(p.pista?.trim());
  }
});

test("resposta privada aponta para o espectro certo", { skip: !existsSync(PRIV) || !meta }, () => {
  const priv = ler("../privado/iv-grupo.json").problemas;
  for (const p of grupo.problemas) {
    const r = priv.find((x) => x.n === p.n);
    assert.equal(p.candidatas[r.correta], "@est:" + meta.compostos[r.alvo].estId, `problema ${p.n}`);
    assert.equal(porEsp[p.espectro].id, r.alvo);
    assert.ok(r.resolucao.length > 40 && r.bandasChave.length >= 2);
  }
});
