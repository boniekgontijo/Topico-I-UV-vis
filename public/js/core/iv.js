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
