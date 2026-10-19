// Consolida acessos, exercícios e quizzes por aluno (puro: roda no navegador e no Node).

const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : null);

export function montarLinhas(alunos, acessos, respostas, quizzes = []) {
  const nAcessos = {};
  for (const a of acessos) nAcessos[a.matricula] = (nAcessos[a.matricula] ?? 0) + 1;

  // casa: a resposta MAIS ANTIGA de cada questão, por aluno (vale mesmo com outro celular)
  const primeira = {}; // matricula → questaoId → {bloco, correta, t}
  const grupo = {};    // matricula → Set(atividade)
  for (const r of respostas) {
    const t = ms(r.quando) ?? (r.tentativa === 1 ? -1 : Infinity);
    for (const m of r.membros ?? []) {
      if (r.tipo === "casa") {
        const p = (primeira[m.matricula] ??= {});
        if (!p[r.questaoId] || t < p[r.questaoId].t) p[r.questaoId] = { bloco: r.bloco, correta: r.correta, t };
      }
      if (r.tipo === "grupo") (grupo[m.matricula] ??= new Set()).add(r.atividade);
    }
  }

  const quiz = {}; // matricula → {n, pontos}; um quiz conta uma vez por aluno (melhor pontuação)
  for (const q of quizzes) {
    const melhor = {};
    for (const j of q.jogadores ?? []) {
      const mats = j.membros?.length ? j.membros.map((m) => m.matricula) : [j.matricula];
      const pts = q.placar?.[j.uid]?.pontos ?? 0;
      for (const m of mats) melhor[m] = Math.max(melhor[m] ?? 0, pts);
    }
    for (const [m, pts] of Object.entries(melhor)) {
      const x = (quiz[m] ??= { n: 0, pontos: 0 });
      x.n += 1; x.pontos += pts;
    }
  }

  return alunos.map((a) => {
    const casaPctPorBloco = {};
    for (let b = 1; b <= 10; b++) {
      const qs = Object.values(primeira[a.matricula] ?? {}).filter((x) => x.bloco === b);
      casaPctPorBloco[b] = qs.length ? Math.round((100 * qs.filter((x) => x.correta).length) / qs.length) : null;
    }
    return {
      matricula: a.matricula, nome: a.nome,
      primeiroAcesso: ms(a.primeiroAcesso), ultimoAcesso: ms(a.ultimoAcesso),
      nAcessos: nAcessos[a.matricula] ?? 0,
      casaPctPorBloco,
      casaFeitas: Object.keys(primeira[a.matricula] ?? {}).length,
      grupoAtividades: [...(grupo[a.matricula] ?? [])].sort(),
      quizzes: quiz[a.matricula]?.n ?? 0, quizPontos: quiz[a.matricula]?.pontos ?? 0,
    };
  });
}

const dataBR = (m) => (m == null ? "" : new Date(m).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }));
const cel = (v) => {
  let s = v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // não vira fórmula no Excel
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function paraCSV(linhas) {
  const blocos = Array.from({ length: 10 }, (_, i) => i + 1);
  const cab = ["matricula", "nome", "primeiro_acesso", "ultimo_acesso", "acessos", "questoes_casa",
    ...blocos.map((b) => `bloco${b}_%`), "atividades_grupo", "quizzes", "pontos_quiz"];
  const corpo = linhas.map((l) => [l.matricula, l.nome, dataBR(l.primeiroAcesso), dataBR(l.ultimoAcesso), l.nAcessos, l.casaFeitas,
    ...blocos.map((b) => l.casaPctPorBloco[b]), l.grupoAtividades.join(" "), l.quizzes, l.quizPontos].map(cel).join(";"));
  return "﻿" + [cab.join(";"), ...corpo].join("\r\n");
}
