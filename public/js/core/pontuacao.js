// Pontuação estilo Kahoot: certa = 1000 × (1 − 0,5 × fração do tempo usado).

export function pontosResposta({ correta, dtMs, limiteMs }) {
  if (!correta) return 0;
  const f = Math.min(1, Math.max(0, dtMs / limiteMs));
  return Math.round(1000 * (1 - 0.5 * f));
}

export function aplicarRodada(placar, respostas, correta, limiteMs, nomes) {
  const novo = structuredClone(placar);
  for (const r of respostas) {
    const atual = novo[r.uid] ?? { nome: nomes[r.uid] ?? "?", pontos: 0, somaDtAcertos: 0, acertos: 0 };
    const acertou = r.alternativa === correta;
    novo[r.uid] = {
      nome: nomes[r.uid] ?? atual.nome,
      pontos: atual.pontos + pontosResposta({ correta: acertou, dtMs: r.dtMs, limiteMs }),
      somaDtAcertos: atual.somaDtAcertos + (acertou ? Math.max(0, r.dtMs) : 0),
      acertos: atual.acertos + (acertou ? 1 : 0),
    };
  }
  return novo;
}

export function ranking(placar) {
  return Object.entries(placar)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((x, y) => y.pontos - x.pontos || x.somaDtAcertos - y.somaDtAcertos)
    .map((p, i) => ({ ...p, posicao: i + 1 }));
}
