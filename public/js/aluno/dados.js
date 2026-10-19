// Fachada do Firebase para o aluno: se o Firebase falhar (sem rede, não configurado),
// os exercícios continuam funcionando e só o registro é perdido.
let fb = null;
let falhou = false;

export async function conectar() {
  try {
    fb = await import("../fb.js");
    await fb.iniciar();
    return true;
  } catch (e) {
    console.warn("Firebase indisponível:", e);
    falhou = true;
    return false;
  }
}
export const online = () => !!fb && !falhou;
export const api = () => { if (!online()) throw new Error("sem conexão com o servidor"); return fb; };

const silencioso = (fn) => async (...a) => { if (!online()) return; try { await fn(...a); } catch (e) { console.warn(e); } };
export const salvarAluno = silencioso((x) => fb.salvarAluno(x));
export const registrarAcesso = silencioso((x) => fb.registrarAcesso(x));
export const salvarResposta = silencioso((x) => fb.salvarResposta(x));
