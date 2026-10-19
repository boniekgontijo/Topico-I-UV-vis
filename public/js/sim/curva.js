import { h, limpar, toast } from "../ui/dom.js";
import { padroesCurva, regressaoLinear, concentracaoDaCurva } from "../core/uvvis.js";
import { corrigir, formatarNumeroBR } from "../core/correcao.js";
import { grafico } from "./grafico.js";
import { leitura } from "./comum.js";

const A_ = 0.0817, B_ = -0.0031, A_AMOSTRA = 0.47; // slide 34

export function montar(el) {
  let ampla = false, padroes = [], medidos = new Set();
  const area = h("div");
  const novo = () => {
    const niveis = ampla ? [2, 4, 6, 8, 10, 15, 20] : [2, 4, 6, 8, 10];
    padroes = padroesCurva({ niveis, a: A_, b: B_, sigma: 0.005, curvatura: ampla ? 0.025 : 0 });
    medidos = new Set();
    desenhar();
  };
  const desenhar = () => {
    const pts = padroes.filter((_, i) => medidos.has(i));
    const graf = h("div"), res = h("div");
    const xmax = ampla ? 22 : 12;
    const g = grafico(graf, { xmin: 0, xmax, ymax: ampla ? 1.6 : 1.0, rotX: "c (mg/L)", rotY: "A", espectroVisivel: false });
    const series = [{ pontos: pts.map((p) => [p.c, p.A]), cor: "#0070C0", pontosSoltos: true }];
    let reg = null;
    if (pts.length >= 3) {
      reg = regressaoLinear(pts.map((p) => p.c), pts.map((p) => p.A));
      series.push({ pontos: [[0, reg.b], [xmax, reg.a * xmax + reg.b]], cor: "#FF0000", espessura: 1.5 });
      const gr = grafico(res, { xmin: 0, xmax, ymax: 0.1, rotX: "c (mg/L)", rotY: "resíduo (zero = tracejado)", espectroVisivel: false });
      const escala = (r) => 0.05 + r; // centraliza o zero em 0,05
      gr.desenhar([{ pontos: [[0, 0.05], [xmax, 0.05]], cor: "#9AA3B8", tracejado: true },
        { pontos: pts.map((p, i) => [p.c, escala(reg.residuos[i])]), cor: "#7030A0", pontosSoltos: true }]);
    }
    g.desenhar(series);
    const resposta = h("input", { inputmode: "decimal", placeholder: "c da amostra (mg/L)", "aria-label": "concentração da amostra" });
    const conferir = (e) => {
      e.preventDefault();
      const certo = concentracaoDaCurva(A_AMOSTRA, reg.a, reg.b);
      const r = corrigir({ tipo: "num", resposta: certo, tol: 0.03 }, resposta.value);
      if (!r.valida) return toast("Não entendi o número — use 5,79", "erro");
      toast(r.correta ? `✓ Certo! c = (A − b)/a = ${formatarNumeroBR(certo)} mg/L` : `✗ Use c = (A − b)/a com a e b da SUA reta.`, r.correta ? "ok" : "erro");
    };
    limpar(area,
      h("p", { class: "ajuda" }, "Toque em cada padrão para medir a absorbância."),
      h("div", { class: "botoes" }, padroes.map((p, i) => h("button", {
        class: `btn ${medidos.has(i) ? "verde" : "sec"}`, style: { flex: "1 1 18%" },
        onclick: () => { medidos.add(i); desenhar(); } }, `${p.c} mg/L`))),
      graf,
      reg ? leitura([["a (inclinação)", formatarNumeroBR(reg.a)], ["b (intercepto)", formatarNumeroBR(reg.b)], ["R²", reg.r2.toFixed(4).replace(".", ",")]]) : null,
      reg ? h("div", {}, h("h3", {}, "Resíduos"), res,
        h("p", { class: "ajuda" }, ampla ? "Viu os resíduos formando um arco? A faixa ampla tem curvatura: R² alto não basta." : "Resíduos espalhados ao acaso → modelo linear OK.")) : null,
      reg && medidos.size === padroes.length ? h("form", { class: "cartao", onsubmit: conferir },
        h("p", {}, "A amostra deu ", h("b", {}, "A = 0,47"), ". Qual é a concentração?"),
        h("div", { class: "linha-num" }, resposta, h("button", { class: "btn", type: "submit" }, "OK"))) : null,
      h("div", { class: "botoes" },
        h("button", { class: "btn sec", onclick: () => { ampla = !ampla; novo(); } }, ampla ? "Voltar à faixa 2–10 mg/L" : "Testar faixa ampla (até 20 mg/L)"),
        h("button", { class: "btn sec", onclick: novo }, "Novos padrões")));
  };
  limpar(el, h("h2", {}, "Curva analítica"), area);
  novo();
}
