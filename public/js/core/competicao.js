// Preparação da competição ao vivo (puro: sem DOM nem Firebase).
import { embaralharQuestao } from "./embaralhar.js";

export function validarBanco(banco) {
  const erros = [];
  const qs = banco?.questoes;
  if (!Array.isArray(qs) || !qs.length) return { ok: false, erros: ["arquivo sem lista 'questoes'"], porBloco: {} };
  const porBloco = {};
  for (const x of qs) {
    const ok = x.tipo === "mc" && Array.isArray(x.alternativas) && x.alternativas.length >= 2 && x.alternativas.length <= 4
      && Number.isInteger(x.correta) && x.correta >= 0 && x.correta < x.alternativas.length && x.enunciado && Number.isInteger(x.bloco);
    if (!ok) erros.push(`questão ${x.id ?? "?"} inválida`);
    else porBloco[x.bloco] = (porBloco[x.bloco] ?? 0) + 1;
  }
  return { ok: erros.length === 0, erros, porBloco };
}

export function prepararCompeticao(questoes, { blocos, n, rnd = Math.random }) {
  const pool = questoes.filter((x) => blocos.includes(x.bloco));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((x) => embaralharQuestao(x, rnd));
}

// O que vai para o documento da sala (os alunos leem): sem gabarito
export function perguntaPublica({ enunciado, alternativas, figura, bloco }) {
  return figura ? { enunciado, alternativas, figura, bloco } : { enunciado, alternativas, bloco };
}
