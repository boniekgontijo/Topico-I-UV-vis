// Quiz de prática (puro: sem DOM nem Firebase). Rodada mista = uma questão de cada bloco, em ordem de bloco.
export function sortearRodada(questoes, { bloco = null, rnd = Math.random } = {}) {
  const embaralhar = (xs) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  if (bloco != null) return embaralhar(questoes.filter((q) => q.bloco === Number(bloco)));
  const blocos = [...new Set(questoes.map((q) => q.bloco))].sort((a, b) => a - b);
  return blocos.map((b) => embaralhar(questoes.filter((q) => q.bloco === b))[0]);
}
