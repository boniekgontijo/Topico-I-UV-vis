// Consolida acessos, exercícios e quizzes por aluno (puro: roda no navegador e no Node).

const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : null);

export const MODS = ["uvvis", "iv"];
const NBLOCOS = { uvvis: 10, iv: 9 };

// opcoes.totais: nº de questões de casa de cada módulo (normaliza a nota de prática 0–10)
export function montarLinhas(alunos, acessos, respostas, quizzes = [], { totais = { uvvis: 88, iv: 86 } } = {}) {
  const nAcessos = {};
  const sims = {}; // matricula → Set(simulador aberto)
  for (const a of acessos) {
    nAcessos[a.matricula] = (nAcessos[a.matricula] ?? 0) + 1;
    const m = /^#sim\/(\w+)/.exec(a.pagina ?? "");
    if (m) (sims[a.matricula] ??= new Set()).add(m[1]);
  }

  // casa: a resposta MAIS ANTIGA de cada questão, por aluno e módulo (vale mesmo com outro celular).
  // Resposta antiga sem "modulo" é do UV-vis.
  const primeira = {}; // matricula → "modulo:questaoId" → {modulo, bloco, correta, t}
  const grupo = {};    // matricula → Set(atividade)
  for (const r of respostas) {
    const t = ms(r.quando) ?? (r.tentativa === 1 ? -1 : Infinity);
    for (const m of r.membros ?? []) {
      if (r.tipo === "casa") {
        const p = (primeira[m.matricula] ??= {});
        const mod = r.modulo ?? (String(r.atividade ?? "").startsWith("iv-") ? "iv" : "uvvis"), k = `${mod}:${r.questaoId}`;
        if (!p[k] || t < p[k].t) p[k] = { modulo: mod, bloco: r.bloco, correta: r.correta, t };
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
    const feitas = Object.values(primeira[a.matricula] ?? {});
    const casaPctPorBloco = {}, casaFeitas = {}, pratica = {};
    for (const mod of MODS) {
      const fm = feitas.filter((x) => x.modulo === mod);
      casaFeitas[mod] = fm.length;
      pratica[mod] = Math.round((100 * fm.length) / (totais[mod] || 1)) / 10; // 0–10, 1 casa decimal
      casaPctPorBloco[mod] = {};
      for (let b = 1; b <= NBLOCOS[mod]; b++) {
        const qs = fm.filter((x) => x.bloco === b);
        casaPctPorBloco[mod][b] = qs.length ? Math.round((100 * qs.filter((x) => x.correta).length) / qs.length) : null;
      }
    }
    return {
      matricula: a.matricula, nome: a.nome,
      primeiroAcesso: ms(a.primeiroAcesso), ultimoAcesso: ms(a.ultimoAcesso),
      nAcessos: nAcessos[a.matricula] ?? 0,
      casaPctPorBloco,
      casaFeitas, pratica,
      simuladores: sims[a.matricula]?.size ?? 0,
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
  const bl = (mod) => Array.from({ length: NBLOCOS[mod] }, (_, i) => i + 1);
  const cab = ["matricula", "nome", "primeiro_acesso", "ultimo_acesso", "acessos",
    "pratica_uvvis_0a10", "questoes_casa_uvvis", "pratica_iv_0a10", "questoes_casa_iv", "simuladores",
    ...bl("uvvis").map((b) => `uv_bloco${b}_%`), ...bl("iv").map((b) => `iv_bloco${b}_%`), "atividades_grupo", "quizzes", "pontos_quiz"];
  const corpo = linhas.map((l) => [l.matricula, l.nome, dataBR(l.primeiroAcesso), dataBR(l.ultimoAcesso), l.nAcessos,
    l.pratica.uvvis, l.casaFeitas.uvvis, l.pratica.iv, l.casaFeitas.iv, l.simuladores,
    ...bl("uvvis").map((b) => l.casaPctPorBloco.uvvis[b]), ...bl("iv").map((b) => l.casaPctPorBloco.iv[b]),
    l.grupoAtividades.join(" "), l.quizzes, l.quizPontos].map(cel).join(";"));
  return "﻿" + [cab.join(";"), ...corpo].join("\r\n");
}

// data de corte da prática ("AAAA-MM-DD" ou null)
export const rotuloCorte = (d) => (d ? d.split("-").reverse().join("/") : "a definir");
