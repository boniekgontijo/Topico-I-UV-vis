// Espectro de IV simulado (mesma fórmula de tools/iv/gerar.py): bandas em absorbância → %T.
// banda = [posição cm⁻¹, absorbância, meia-largura, forma] ; forma "g" = gaussiana, senão lorentziana

export function transmitancia(x, bandas) {
  let A = 0;
  for (const [pos, a, hw, forma] of bandas) {
    const d = (x - pos) / hw;
    A += forma === "g" ? a * Math.exp(-0.5 * d * d) : a / (1 + d * d);
  }
  return 100 * Math.pow(10, -(A + 0.03 + (0.015 * (x - 400)) / 3600));
}

// n pontos de 4000 a 400 cm⁻¹ (eixo invertido, como nos espectros reais)
export function pontosEspectro(bandas, n = 1500) {
  return Array.from({ length: n }, (_, i) => {
    const x = 4000 - (3600 * i) / (n - 1);
    return [x, transmitancia(x, bandas)];
  });
}

// O Firestore não aceita lista dentro de lista: no quiz, as bandas viajam como texto "pos,a,hw,forma;…"
export const codificarBandas = (bandas) => bandas.map(([p, a, hw, f]) => `${p},${a},${hw},${f ?? "l"}`).join(";");
export function decodificarBandas(b) {
  if (Array.isArray(b)) return b;
  return String(b).split(";").filter(Boolean).map((s) => { const [p, a, hw, f] = s.split(","); return [Number(p), Number(a), Number(hw), f || "l"]; });
}
