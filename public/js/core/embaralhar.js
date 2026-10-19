// As questões são escritas com a correta no índice 0; aqui a ordem é sorteada.
export function embaralharQuestao(q, rnd = Math.random) {
  if (q.tipo !== "mc") return q;
  const ordem = q.alternativas.map((_, i) => i);
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return { ...q, alternativas: ordem.map((i) => q.alternativas[i]), correta: ordem.indexOf(q.correta) };
}
