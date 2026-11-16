// Módulos da plataforma (UV-vis, IV e EM): caminhos do conteúdo e escolha pela URL.
// pratica: o Quiz do menu é o de prática (sem nota, nada vai ao servidor); sem ela, é o quiz ao vivo (IV).
export const MODULOS = {
  uvvis: { titulo: "UV-vis", base: "conteudo/uvvis/", simuladores: true, pratica: true },
  iv: { titulo: "IV", base: "conteudo/iv/", simuladores: false },
  em: { titulo: "Espectrometria de massas", base: "conteudo/em/", simuladores: false, pratica: true },
};

// Capa (tela de entrada e título da página) de cada módulo.
const CAPAS = {
  uvvis: { icone: "🌈🔬", titulo: "UV-vis em jogo" },
  iv: { icone: "🌡️🔬", titulo: "IV em jogo" },
  em: { icone: "⚖️🔬", titulo: "Espectrometria de massas em jogo" },
};
export const capa = (m) => CAPAS[m] ?? CAPAS.uvvis;

// O módulo vem só do ?m= da URL; sem ele é UV-vis (os QR codes antigos do UV-vis nunca caem no IV).
// "salvo" é ignorado de propósito: a navegação interna preserva o ?m=.
export function moduloDaURL(search, _salvo) {
  const m = new URLSearchParams(search).get("m");
  return m in MODULOS ? m : "uvvis";
}

// Painel do professor: #comp/<m> e #comp/slides/<m>; sem módulo (ou desconhecido) é UV-vis.
export const moduloDaRota = (ps) => ps.find((x) => x in MODULOS) ?? "uvvis";

// Link fixo do aluno (QR dos slides e do telão): entra sozinho na sala atual da turma, no módulo certo.
export const linkQuizAoVivo = (base, turma, m) =>
  `${base}?t=${encodeURIComponent(turma)}${m && m !== "uvvis" ? `&m=${m}` : ""}#quiz`;

// alternativa "@est:<id>" = estrutura química (imagem); senão é texto
export const ehEstrutura = (a) => (typeof a === "string" && /^@est:[a-z0-9_-]+$/.test(a) ? a.slice(5) : null);
