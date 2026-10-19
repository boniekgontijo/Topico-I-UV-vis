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

// Fechamento da rodada em duas etapas ("pergunta" → "fechando" → "revelada"):
// impede pontuar duas vezes (duas abas, clique repetido, falha de rede no meio).
export function decidirFechamento(sala, indice) {
  if (sala?.indice !== indice) return "ignorar";
  if (sala.estado === "pergunta") return "fechar";
  if (sala.estado === "fechando") return "retomar";
  return "ignorar";
}
export const podeRevelar = (sala, indice) => sala?.estado === "fechando" && sala.indice === indice;

// Rodadas: a pontuação acumula; ao fim de cada rodada aparece o pódio (parcial ou final).
export function infoRodada(indice, porRodada, total) {
  const n = porRodada || total;
  const totalRodadas = Math.ceil(total / n);
  const rodada = Math.floor(indice / n) + 1;
  const posNaRodada = (indice % n) + 1;
  const ultima = indice + 1 >= total;
  return { rodada, totalRodadas, posNaRodada, fimDaRodada: posNaRodada === n || ultima, ultima };
}

// Avatares que o aluno escolhe ao entrar no quiz
export const AVATARES = [
  ["🦊", "raposa"], ["🐼", "panda"], ["🦉", "coruja"], ["🐙", "polvo"], ["🦁", "leão"], ["🐸", "sapo"],
  ["🐧", "pinguim"], ["🦄", "unicórnio"], ["🐢", "tartaruga"], ["🐝", "abelha"], ["🦖", "dinossauro"], ["🐬", "golfinho"],
  ["🦜", "papagaio"], ["🐨", "coala"], ["🦦", "lontra"], ["🐞", "joaninha"], ["⚗️", "balão"], ["🔬", "microscópio"],
  ["🧪", "tubo de ensaio"], ["🌈", "arco-íris"], ["💡", "lâmpada"], ["🚀", "foguete"], ["⭐", "estrela"], ["🔥", "fogo"],
].map(([emoji, nome]) => ({ emoji, nome }));
