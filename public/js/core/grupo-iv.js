// Atividade em grupo do IV: consolida as entregas para o professor (puro).
// problemas[i] = nº do problema do grupo i+1 (6 grupos)

export function consolidar(problemas, entregas) {
  const ultima = {};
  for (const e of entregas) {
    const q = ultima[e.grupo];
    if (!q || (e.quando ?? 0) >= (q.quando ?? 0)) ultima[e.grupo] = e;
  }
  return problemas.map((problema, i) => {
    const e = ultima[i + 1];
    return { grupo: i + 1, problema, entregue: !!e, escolha: e?.escolha ?? null, justificativa: e?.justificativa ?? "", membros: e?.membros ?? [] };
  });
}
