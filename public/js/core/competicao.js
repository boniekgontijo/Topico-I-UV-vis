// Preparação da competição ao vivo (puro: sem DOM nem Firebase).
import { embaralharQuestao } from "./embaralhar.js";

const mcValida = (x) => x?.tipo === "mc" && Array.isArray(x.alternativas) && x.alternativas.length >= 2 && x.alternativas.length <= 4
  && Number.isInteger(x.correta) && x.correta >= 0 && x.correta < x.alternativas.length && !!x.enunciado && Number.isInteger(x.bloco);

// "sequencia" (opcional): perguntas já sorteadas, na ordem e com as alternativas na posição dos slides
export function validarBanco(banco) {
  const erros = [];
  const qs = banco?.questoes;
  if (!Array.isArray(qs) || !qs.length) return { ok: false, erros: ["arquivo sem lista 'questoes'"], porBloco: {}, nSequencia: 0 };
  const porBloco = {};
  for (const x of qs) {
    if (!mcValida(x)) erros.push(`questão ${x.id ?? "?"} inválida`);
    else porBloco[x.bloco] = (porBloco[x.bloco] ?? 0) + 1;
  }
  const seq = banco.sequencia ?? [];
  seq.forEach((x, i) => { if (!mcValida(x)) erros.push(`sequência: pergunta ${i + 1} inválida`); });
  return { ok: erros.length === 0, erros, porBloco, nSequencia: seq.length };
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

// Personagens: cada aluno escolhe um no registro; na turma, cada personagem tem um só dono.
export const AVATARES = [
  ["🦊", "raposa"], ["🐼", "panda"], ["🦉", "coruja"], ["🐙", "polvo"], ["🦁", "leão"], ["🐸", "sapo"],
  ["🐧", "pinguim"], ["🦄", "unicórnio"], ["🐢", "tartaruga"], ["🐝", "abelha"], ["🦖", "dinossauro"], ["🐬", "golfinho"],
  ["🦜", "papagaio"], ["🐨", "coala"], ["🦦", "lontra"], ["🐞", "joaninha"], ["🐯", "tigre"], ["🐺", "lobo"],
  ["🦒", "girafa"], ["🦓", "zebra"], ["🐘", "elefante"], ["🦩", "flamingo"], ["🦋", "borboleta"], ["🐳", "baleia"],
  ["🦀", "caranguejo"], ["🦔", "ouriço"], ["🐿️", "esquilo"], ["🦥", "bicho-preguiça"],
  ["⚗️", "balão"], ["🔬", "microscópio"], ["🧪", "tubo de ensaio"], ["🌈", "arco-íris"], ["💡", "lâmpada"],
  ["🚀", "foguete"], ["⭐", "estrela"], ["🔥", "fogo"], ["🧲", "ímã"], ["💎", "diamante"], ["🌋", "vulcão"], ["☄️", "cometa"],
].map(([emoji, nome], i) => ({ id: `a${String(i + 1).padStart(2, "0")}`, emoji, nome }));
