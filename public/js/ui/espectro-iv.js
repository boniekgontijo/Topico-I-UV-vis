// Desenha um espectro de IV em SVG (responsivo; legível em 360 px).
import { pontosEspectro, decodificarBandas } from "../core/iv.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, txt) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (txt != null) e.textContent = txt;
  return e;
};

export function desenharEspectroIV(container, bandas, { altura = 180 } = {}) {
  const W = 340, H = altura, m = { e: 30, d: 8, t: 18, b: 32 };
  const pw = W - m.e - m.d, ph = H - m.t - m.b;
  const X = (x) => m.e + ((4000 - x) / 3600) * pw;
  const Y = (t) => m.t + ((100 - Math.max(0, Math.min(102, t))) / 100) * ph;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "espectro de infravermelho",
    style: "width:100%;height:auto;display:block;background:#fff;border:1px solid #DDE0EA;border-radius:10px" });
  svg.append(el("line", { x1: m.e, y1: m.t + ph, x2: m.e + pw, y2: m.t + ph, stroke: "#5C6070" }),
    el("line", { x1: m.e, y1: m.t, x2: m.e, y2: m.t + ph, stroke: "#5C6070" }));
  for (const t of [4000, 3000, 2000, 1500, 1000, 500]) {
    svg.append(el("line", { x1: X(t), y1: m.t + ph, x2: X(t), y2: m.t + ph + 4, stroke: "#5C6070" }),
      el("text", { x: X(t), y: m.t + ph + 15, "font-size": 12, "text-anchor": "middle", fill: "#5C6070" }, String(t)));
  }
  for (const t of [0, 50, 100]) svg.append(el("text", { x: m.e - 4, y: Y(t) + 3, "font-size": 11, "text-anchor": "end", fill: "#5C6070" }, String(t)));
  svg.append(el("text", { x: 4, y: 12, "font-size": 12, fill: "#5C6070" }, "%T"),
    el("text", { x: m.e + pw, y: H - 2, "font-size": 11, "text-anchor": "end", fill: "#5C6070" }, "cm⁻¹"));
  const d = pontosEspectro(decodificarBandas(bandas)).map(([x, t], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(t).toFixed(1)}`).join("");
  svg.append(el("path", { d, fill: "none", stroke: "#000099", "stroke-width": 1.6, "stroke-linejoin": "round" }));
  container.append(svg);
  return svg;
}
