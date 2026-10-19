// Gráfico de espectro em SVG próprio (responsivo pelo viewBox).
const NS = "http://www.w3.org/2000/svg";
const s = (tag, attrs = {}, ...filhos) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  filhos.forEach((f) => el.append(f));
  return el;
};

export function grafico(container, { xmin = 200, xmax = 800, ymax = 1.2, rotX = "λ (nm)", rotY = "A", espectroVisivel = true } = {}) {
  const W = 360, H = 230, m = { e: 40, d: 10, t: 12, b: 44 };
  const pw = W - m.e - m.d, ph = H - m.t - m.b;
  const X = (x) => m.e + ((x - xmin) / (xmax - xmin)) * pw;
  const Y = (y) => m.t + ph - (Math.min(y, ymax * 1.05) / ymax) * ph;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "espectro", style: "width:100%;height:auto;display:block" });
  const defs = s("defs");
  if (espectroVisivel) {
    const g = s("linearGradient", { id: "arcoiris" + Math.random().toString(36).slice(2, 7), gradientUnits: "userSpaceOnUse", x1: X(400), x2: X(800), y1: 0, y2: 0 });
    [["0%", "#7F00FF"], ["15%", "#0000FF"], ["30%", "#00B0FF"], ["45%", "#00C853"], ["60%", "#FFEB00"], ["75%", "#FF8C00"], ["100%", "#C00000"]]
      .forEach(([o, c]) => g.append(s("stop", { offset: o, "stop-color": c })));
    defs.append(g);
    svg.append(defs);
    const x0 = X(Math.max(400, xmin)), x1 = X(Math.min(800, xmax));
    if (x1 > x0) svg.append(s("rect", { x: x0, y: m.t + ph + 4, width: x1 - x0, height: 6, rx: 2, fill: `url(#${g.id})` }));
  }
  const eixos = s("g", { stroke: "#5C6070", "stroke-width": 1, fill: "none" });
  eixos.append(s("line", { x1: m.e, y1: m.t + ph, x2: m.e + pw, y2: m.t + ph }), s("line", { x1: m.e, y1: m.t, x2: m.e, y2: m.t + ph }));
  svg.append(eixos);
  const txt = (x, y, t, anc = "middle", extra = {}) => { const e = s("text", { x, y, "text-anchor": anc, "font-size": 10, fill: "#5C6070", ...extra }); e.textContent = t; return e; };
  const passoX = (xmax - xmin) > 300 ? 100 : (xmax - xmin) > 30 ? 10 : 2;
  for (let x = Math.ceil(xmin / passoX) * passoX; x <= xmax; x += passoX) {
    svg.append(s("line", { x1: X(x), y1: m.t + ph, x2: X(x), y2: m.t + ph + 3, stroke: "#5C6070" }), txt(X(x), m.t + ph + 22, String(x)));
  }
  const passoY = ymax <= 0.5 ? 0.1 : ymax <= 1.5 ? 0.2 : 0.5;
  for (let y = 0; y <= ymax + 1e-9; y += passoY) {
    svg.append(s("line", { x1: m.e, y1: Y(y), x2: m.e + pw, y2: Y(y), stroke: "#EEF0F5" }), txt(m.e - 4, Y(y) + 3, y.toFixed(1).replace(".", ","), "end"));
  }
  svg.append(txt(m.e + pw / 2, H - 4, rotX), txt(10, m.t + ph / 2, rotY, "middle", { transform: `rotate(-90 10 ${m.t + ph / 2})` }));
  const camada = s("g");
  svg.append(camada);
  container.append(svg);

  return {
    X, Y,
    desenhar(series) {
      camada.replaceChildren();
      for (const se of series) {
        if (se.pontosSoltos) {
          se.pontos.forEach(([x, y]) => camada.append(s("circle", { cx: X(x), cy: Y(y), r: 4.5, fill: se.cor })));
          continue;
        }
        const d = se.pontos.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join("");
        camada.append(s("path", { d, fill: "none", stroke: se.cor, "stroke-width": se.espessura ?? 2.5, "stroke-dasharray": se.tracejado ? "5 4" : "none", "stroke-linejoin": "round" }));
        if (se.rotulo) { const [x, y] = se.pontos[se.pontos.length - 1]; camada.append(txt(X(x) - 2, Y(y) - 6, se.rotulo, "end", { fill: se.cor, "font-weight": 700 })); }
      }
    },
    marcarX(x, cor, rotulo) {
      camada.append(s("line", { x1: X(x), y1: m.t, x2: X(x), y2: m.t + ph, stroke: cor, "stroke-dasharray": "3 3" }));
      if (rotulo) camada.append(txt(X(x), m.t + 9, rotulo, "middle", { fill: cor, "font-weight": 700 }));
    },
    seta(x1, y1, x2, y2, cor) {
      camada.append(s("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), stroke: cor, "stroke-width": 2.5, "marker-end": "" }),
        s("circle", { cx: X(x2), cy: Y(y2), r: 3.5, fill: cor }));
    },
  };
}

// Curva de banda para desenhar
export const amostrar = (f, xmin = 200, xmax = 800, n = 240) =>
  Array.from({ length: n + 1 }, (_, i) => { const x = xmin + ((xmax - xmin) * i) / n; return [x, f(x)]; });
