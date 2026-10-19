// Módulos da plataforma (UV-vis e IV): caminhos do conteúdo e escolha pela URL.
export const MODULOS = {
  uvvis: { titulo: "UV-vis", base: "conteudo/uvvis/", simuladores: true },
  iv: { titulo: "IV", base: "conteudo/iv/", simuladores: false },
};

// O módulo vem só do ?m= da URL; sem ele é UV-vis (os QR codes antigos do UV-vis nunca caem no IV).
// "salvo" é ignorado de propósito: a navegação interna preserva o ?m=.
export function moduloDaURL(search, _salvo) {
  const m = new URLSearchParams(search).get("m");
  return m in MODULOS ? m : "uvvis";
}

// alternativa "@est:<id>" = estrutura química (imagem); senão é texto
export const ehEstrutura = (a) => (typeof a === "string" && /^@est:[a-z0-9_-]+$/.test(a) ? a.slice(5) : null);
