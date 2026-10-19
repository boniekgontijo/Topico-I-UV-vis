// Leitura de números digitados pelos alunos e correção de questões.

const SOBRESCRITOS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
const NUMERO = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;

// "0,523", "3,0×10⁻⁵", "3,0 x 10^-5", "3e-5", "35,5 %" → número; senão NaN
export function parseNumeroBR(txt) {
  let s = String(txt ?? "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SOBRESCRITOS[c]);
  s = s.replace(/\s+/g, "").replace(/%$/, "").replace(/−/g, "-");
  s = s.replace(/[×x·*]10\^?/i, "e");
  if (s.includes(",") && s.includes(".")) return NaN;
  s = s.replace(",", ".");
  return NUMERO.test(s) ? Number(s) : NaN;
}

// questão {tipo:"mc"|"vf"|"num", ...} + resposta → {valida, correta}
export function corrigir(questao, resposta) {
  if (questao.tipo === "num") {
    const x = typeof resposta === "number" ? resposta : parseNumeroBR(resposta);
    if (!Number.isFinite(x)) return { valida: false, correta: false };
    const tol = questao.tol ?? 0.02;
    return { valida: true, correta: Math.abs(x - questao.resposta) <= tol * Math.abs(questao.resposta) };
  }
  return { valida: true, correta: resposta === questao.correta };
}

// Exibição: notação científica abaixo de 0,001; senão até 4 algarismos significativos.
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function formatarNumeroBR(x) {
  if (x !== 0 && Math.abs(x) < 1e-3) {
    const [m, e] = x.toExponential(1).split("e");
    return `${m.replace(".", ",")}×10${String(Number(e)).replace(/./g, (c) => SUP[c])}`;
  }
  const s = Number(x.toPrecision(4)).toString().split(".");
  const inteira = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s[1] ? `${inteira},${s[1]}` : inteira;
}
