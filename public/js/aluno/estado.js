// Módulo atual do aluno (UV-vis ou IV): vem do ?m= e fica lembrado no aparelho.
import { ls } from "../ui/dom.js";
import { MODULOS, moduloDaURL } from "../core/modulo.js";

export function moduloAtual() {
  const m = moduloDaURL(location.search, ls.get("modulo"));
  ls.set("modulo", m);
  return m;
}
export function trocarModulo(m) {
  if (!(m in MODULOS)) return;
  ls.set("modulo", m);
  const u = new URL(location.href);
  u.searchParams.set("m", m);
  history.replaceState(null, "", u);
}
export const baseAtual = () => MODULOS[moduloAtual()].base;
