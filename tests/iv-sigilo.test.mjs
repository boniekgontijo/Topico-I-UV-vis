// O que é público no módulo IV não pode entregar respostas (achados C1/I1 da revisão).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const PUB = new URL("../public/conteudo/iv/", import.meta.url);
const publico = ["grupo.json", "casa.json", "blocos.json"].filter((f) => existsSync(new URL(f, PUB)))
  .map((f) => readFileSync(new URL(f, PUB), "utf8")).join("\n");
const espectros = JSON.parse(readFileSync(new URL("espectros.json", PUB), "utf8"));
const pngs = readdirSync(new URL("estruturas/", PUB)).map((f) => f.replace(/\.png$/, ""));
const PRIV = new URL("../privado/iv-compostos.json", import.meta.url);

test("nenhum arquivo público tem compostos.json com nomes", () => {
  assert.equal(existsSync(new URL("compostos.json", PUB)), false);
});

test("ids de espectro e de estrutura são opacos e nunca coincidem", () => {
  for (const id of Object.keys(espectros)) assert.match(id, /^s[0-9a-f]{10}$/);
  for (const id of pngs) assert.match(id, /^e[0-9a-f]{10}$/);
  const e = new Set(pngs);
  for (const id of Object.keys(espectros)) assert.ok(!e.has(id));
});

test("o grupo.json público não contém nome nem id legível de composto", { skip: !existsSync(PRIV) }, () => {
  const meta = JSON.parse(readFileSync(PRIV, "utf8")).compostos;
  const grupo = readFileSync(new URL("grupo.json", PUB), "utf8");
  for (const c of Object.values(meta).filter((x) => x.grupo)) {
    assert.ok(!grupo.includes(`"${c.id}"`) && !grupo.includes(`:${c.id}"`), `grupo.json cita ${c.id}`);
    assert.ok(!publico.includes(c.nome), `público cita ${c.nome}`);
  }
});
