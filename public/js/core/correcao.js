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
