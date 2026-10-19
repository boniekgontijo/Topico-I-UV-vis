// Utilitários de interface: criação de elementos, avisos e rotas por hash.

export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v; // só conteúdo do próprio site (JSON de questões)
    else if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f instanceof Node ? f : String(f));
  return el;
}

export function limpar(el, ...filhos) { el.replaceChildren(...filhos.flat().filter(Boolean)); return el; }

let toastTimer;
export function toast(msg, tipo = "ok") {
  document.querySelector(".toast")?.remove();
  const t = h("div", { class: `toast ${tipo === "erro" ? "erro" : ""}`, role: "status" }, msg);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3500);
}

// "#casa/4" → mapa.casa(["4"]); rota desconhecida → mapa[""]
export function rotas(mapa) {
  const ir = () => {
    const [nome, ...params] = decodeURIComponent(location.hash.slice(1)).split("/");
    (mapa[nome] ?? mapa[""])(params, nome);
    window.scrollTo(0, 0);
  };
  window.addEventListener("hashchange", ir);
  ir();
}

export const ls = {
  get(k, padrao = null) { try { const v = localStorage.getItem(k); return v == null ? padrao : JSON.parse(v); } catch { return padrao; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export async function carregarJSON(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`não consegui carregar ${url}`);
  return r.json();
}
