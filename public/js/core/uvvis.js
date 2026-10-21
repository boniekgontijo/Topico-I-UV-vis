// Física e química do UV-vis, sem DOM nem Firebase (roda no navegador e no Node).

const H = 6.62607015e-34, C = 2.99792458e8, NA = 6.02214076e23;

// Lei de Beer: A = ε·b·c
export const absorbancia = (eps, b, c) => eps * b * c;
export const concentracao = (A, eps, b) => A / (eps * b);
export const transmitancia = (A) => Math.pow(10, -A);
export const percentT = (A) => 100 * transmitancia(A);
export const absDeT = (T) => -Math.log10(T);

// E = hc/λ, por mol de fótons
export const energiaKJmol = (lambdaNm) => (H * C * NA) / (lambdaNm * 1e-9) / 1000;

// λmáx de polienos: valores dos slides (eteno, butadieno, hexatrieno, β-caroteno);
// entre 3 e 11 duplas, interpolação linear (aproximação didática).
const POLIENOS = { 1: 171, 2: 217, 3: 258, 11: 452 };
export function lambdaPolieno(n) {
  if (POLIENOS[n]) return POLIENOS[n];
  return Math.round(258 + ((452 - 258) * (n - 3)) / 8);
}

// Roda de cores: faixa absorvida → cor observada (complementar)
const RODA = [
  { de: 400, ate: 435, absorvida: "violeta", observada: "amarelo-esverdeado", hex: "#B5D334" },
  { de: 435, ate: 480, absorvida: "azul", observada: "laranja", hex: "#F7931E" },
  { de: 480, ate: 500, absorvida: "verde-azulado", observada: "vermelho", hex: "#E0301E" },
  { de: 500, ate: 560, absorvida: "verde", observada: "púrpura", hex: "#8E2C8E" },
  { de: 560, ate: 595, absorvida: "amarelo", observada: "azul", hex: "#2E5BD8" },
  { de: 595, ate: 800.0001, absorvida: "laranja/vermelho", observada: "verde-azulado", hex: "#1FA39A" },
];
export function corComplementar(lambdaNm) {
  if (lambdaNm < 400) return { faixa: "UV", absorvida: "ultravioleta", observada: "incolor", hexObservada: "#FFFFFF" };
  const f = RODA.find((r) => lambdaNm >= r.de && lambdaNm < r.ate) ?? RODA[RODA.length - 1];
  return { faixa: `${f.de}–${Math.round(f.ate)} nm`, absorvida: f.absorvida, observada: f.observada, hexObservada: f.hex };
}

export const banda = (lambda, lambdaMax, Amax, largura = 25) =>
  Amax * Math.exp(-((lambda - lambdaMax) ** 2) / (2 * largura ** 2));

// Mínimos quadrados: A = a·c + b
export function regressaoLinear(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const a = sxy / sxx;
  const b = my - a * mx;
  const residuos = xs.map((x, i) => ys[i] - (a * x + b));
  const ssRes = residuos.reduce((s, r) => s + r * r, 0);
  const r2 = syy === 0 ? 1 : 1 - ssRes / syy;
  return { a, b, r2, residuos };
}
export const concentracaoDaCurva = (A, a, b) => (A - b) / a;

export const lod = (s, a) => (3.3 * s) / a;
export const loq = (s, a) => (10 * s) / a;

// Woodward-Fieser (slides 61–64): λ = base + Σ incrementos
const WF_BASE = {
  "dieno-hetero": 214, "dieno-homo": 253,          // slide 61
  enona: 215, "enona-anel5": 202, aldeido: 208, "acido-ester": 195, // slide 64
};
const WF_INC = {
  extensao: 30, exociclica: 5, homoanular: 39,
  alquila: 5, OR: 6, SR: 30, Cl: 5, Br: 5, NR2: 60, OCOR: 0, // dienos
  alfa: 10, beta: 12, gamaDelta: 18,                          // enonas: alquila/resíduo de anel
};
// Aldeídos α,β-insaturados: Pavia, Tab. 7.8 (valores por nº de alquilas em α/β, não aditivos)
const WF_ALDEIDO = [208, 220, 230, 242];
export function woodwardFieser(tipo, inc = {}) {
  if (!(tipo in WF_BASE)) throw new Error(`tipo desconhecido: ${tipo}`);
  if (tipo === "aldeido") return WF_ALDEIDO[(inc.alfa ?? 0) + (inc.beta ?? 0)];
  return Object.entries(inc).reduce((s, [k, n]) => {
    if (!(k in WF_INC)) throw new Error(`incremento desconhecido: ${k}`);
    return s + WF_INC[k] * n;
  }, WF_BASE[tipo]);
}

// Auxiliares das contas dos exercícios
export const inclinacao2p = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);
export const diferenca = (a, b) => a - b;
export const lambdaDeEnergiaKJmol = (kJ) => (H * C * NA) / (kJ * 1000) * 1e9;
export const absortividade = (A, b, c) => A / (b * c);
export const diluicaoV1 = (C1, C2, V2) => (C2 * V2) / C1; // C₁V₁ = C₂V₂
export const concentracaoDiluida = (A, eps, b, fator) => (A / (eps * b)) * fator; // leitura da solução diluída × fator
export const caminhoOptico = (A, eps, c) => A / (eps * c);
export const percentTDiluida = (T, fator) => percentT(absDeT(T) / fator); // T (fração) da amostra, diluída "fator" vezes
export const inclinacaoParaLoq = (s, loqAlvo) => (10 * s) / loqAlvo;
export const velocidadeMedia = (A1, A2, eps, b, dt) => (A1 - A2) / (eps * b) / dt; // mol L⁻¹ s⁻¹
export const porcentagemDissolvida = (A, Apad, cPad, V, dose) => (100 * (A / Apad) * cPad * V) / dose; // c em mg/mL, V em mL, dose em mg

// Padrões simulados para o simulador de curva: A = a·c/(1 + k·c) + b + ruído gaussiano (Box-Muller)
export function padroesCurva({ niveis, a, b, sigma = 0.005, curvatura = 0, rnd = Math.random }) {
  const ruido = () => {
    const u = Math.max(rnd(), 1e-12), v = rnd();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return niveis.map((c) => ({ c, A: (a * c) / (1 + curvatura * c) + b + (sigma ? ruido() : 0) }));
}

// Cor aproximada de um λ visível (380–780 nm); fora do visível → null
export function corDoComprimento(l) {
  if (l < 380 || l > 780) return null;
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = (440 - l) / 60; b = 1; }
  else if (l < 490) { g = (l - 440) / 50; b = 1; }
  else if (l < 510) { g = 1; b = (510 - l) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; }
  else if (l < 645) { r = 1; g = (645 - l) / 65; }
  else r = 1;
  const f = l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : l > 700 ? 0.3 + (0.7 * (780 - l)) / 80 : 1; // olho vê menos nas bordas
  const hex = (v) => Math.round(255 * Math.pow(v * f, 0.8)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// A num λ qualquer: ε(λ) = εmáx × forma da banda
export const absorbanciaEm = (l, { lambdaMax, epsMax, b, c, largura = 35 }) => banda(l, lambdaMax, epsMax * b * c, largura);
