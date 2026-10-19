// Toda a comunicação com o Firebase (Auth + Firestore) passa por aqui.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, connectAuthEmulator, signInAnonymously, signInWithPopup, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection,
  query, where, onSnapshot, serverTimestamp, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, PROFESSOR_EMAIL, USAR_EMULADOR } from "./config.js";
import { decidirFechamento, podeRevelar } from "./core/competicao.js";

const app = initializeApp(USAR_EMULADOR ? { apiKey: "demo", projectId: "demo-uvvis", authDomain: "localhost" } : firebaseConfig);
// Professor: sessão só da aba (não interfere na sessão anônima de aluno no mesmo navegador).
const ehProfessor = /professor\.html$/.test(location.pathname);
const auth = initializeAuth(app, {
  persistence: ehProfessor ? browserSessionPersistence : browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
// long polling automático: mais estável em redes móveis/proxies
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
if (USAR_EMULADOR) {
  const host = location.hostname === "localhost" ? "127.0.0.1" : location.hostname; // celular na rede usa o IP do computador
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8081);
}

const usuarioAtual = () => new Promise((ok) => { const u = onAuthStateChanged(auth, (x) => { u(); ok(x); }); });

// ---------- aluno ----------
export async function iniciar() {
  const u = (await usuarioAtual()) ?? (await signInAnonymously(auth)).user;
  return { uid: u.uid };
}
export const uid = () => auth.currentUser?.uid;
// se a sessão anônima cair (ex.: dados do navegador limpos), entra de novo antes de escrever
const eu = async () => auth.currentUser?.uid ?? (await signInAnonymously(auth)).user.uid;
export const sairProfessor = () => signOut(auth);

export async function salvarAluno({ nome, matricula, turma }) {
  const ref = doc(db, "alunos", `${turma}_${matricula}`);
  try {
    await updateDoc(ref, { nome, ultimoAcesso: serverTimestamp() });
  } catch {
    await setDoc(ref, { nome, matricula, turma, primeiroAcesso: serverTimestamp(), ultimoAcesso: serverTimestamp() });
  }
}

export async function registrarAcesso({ turma, matricula, pagina }) {
  return addDoc(collection(db, "acessos"), { turma, matricula, pagina, uid: await eu(), quando: serverTimestamp() }).catch(() => {});
}

export async function salvarResposta({ tipo, turma, atividade, questaoId, bloco, correta, tentativa, equipe, membros }) {
  const r = { tipo, turma, atividade, questaoId, bloco, correta, tentativa, membros, uid: await eu(), quando: serverTimestamp() };
  if (equipe) r.equipe = equipe;
  return addDoc(collection(db, "respostas"), r);
}

// ---------- competição (aluno) ----------
const msDe = (t) => (t?.toMillis ? t.toMillis() : null);
const salaDe = (s) => s.exists() ? { codigo: s.id, ...s.data(), abertaEmMs: msDe(s.data().abertaEm) } : null;

export const ouvirSala = (codigo, cb) => onSnapshot(doc(db, "salas", codigo), (s) => cb(salaDe(s)), () => cb(null));
export async function entrarSala(codigo, { nome, matricula, membros }) {
  const u = await eu();
  const j = { nome, matricula, entrouEm: serverTimestamp() };
  if (membros) j.membros = membros; // quiz em equipes
  return setDoc(doc(db, "salas", codigo, "jogadores", u), j).catch((e) => {
    if (e.code !== "permission-denied") throw e; // já tinha entrado
  });
}
export async function responder(codigo, indice, alternativa) {
  const u = await eu();
  return setDoc(doc(db, "salas", codigo, "respostas", `${indice}_${u}`), { uid: u, indice, alternativa, quando: serverTimestamp() });
}
export const ouvirPlacar = (codigo, cb) =>
  onSnapshot(collection(db, "salas", codigo, "placar"), (q) => cb(Object.fromEntries(q.docs.map((d) => [d.id, d.data()]))));

// ---------- professor ----------
export async function professorLogado() {
  const u = await usuarioAtual();
  return u && !u.isAnonymous && u.email === PROFESSOR_EMAIL ? u.email : null;
}
export async function entrarProfessor() {
  let u = await usuarioAtual();
  if (!u || u.isAnonymous) {
    u = USAR_EMULADOR // no emulador, login Google simulado com o e-mail do professor
      ? (await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: "prof-local", email: PROFESSOR_EMAIL, email_verified: true })))).user
      : (await signInWithPopup(auth, new GoogleAuthProvider())).user;
  }
  if (u.email !== PROFESSOR_EMAIL) { await signOut(auth); throw new Error("acesso restrito"); }
  return { email: u.email };
}

export async function criarSala({ turma, modulo, limiteMs, total, modo = "individual" }) {
  for (;;) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const ref = doc(db, "salas", codigo);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { turma, modulo, modo, estado: "lobby", indice: -1, total, limiteMs, pergunta: null,
      abertaEm: null, correta: null, criadaEm: serverTimestamp() });
    return codigo;
  }
}
export const lerSala = async (codigo) => salaDe(await getDoc(doc(db, "salas", codigo)));
export const ouvirJogadores = (codigo, cb) =>
  onSnapshot(collection(db, "salas", codigo, "jogadores"), (q) => cb(q.docs.map((d) => ({ uid: d.id, ...d.data() }))));
export const ouvirNumRespostas = (codigo, indice, cb) =>
  onSnapshot(query(collection(db, "salas", codigo, "respostas"), where("indice", "==", indice)), (q) => cb(q.size));

// O prazo é contado pelo servidor (abertaEm + limiteMs), não pelo relógio do computador.
export async function abrirPergunta(codigo, indice, pergunta) {
  await updateDoc(doc(db, "salas", codigo), { estado: "pergunta", indice, pergunta, correta: null, abertaEm: serverTimestamp() });
}
// 1ª etapa do fechamento: "pergunta" → "fechando" (a partir daí as regras recusam respostas).
// Devolve "fechar" | "retomar" | "ignorar".
export function iniciarFechamento(codigo, indice) {
  const ref = doc(db, "salas", codigo);
  return runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    const d = decidirFechamento(s.data(), indice);
    if (d === "fechar") tx.update(ref, { estado: "fechando" });
    return d;
  });
}
export async function respostasDaRodada(codigo, indice) {
  const q = await getDocs(query(collection(db, "salas", codigo, "respostas"), where("indice", "==", indice)));
  return q.docs.map((d) => ({ uid: d.data().uid, alternativa: d.data().alternativa, quandoMs: msDe(d.data().quando) }));
}
export const lerPlacar = async (codigo) =>
  Object.fromEntries((await getDocs(collection(db, "salas", codigo, "placar"))).docs.map((d) => [d.id, d.data()]));
// 2ª etapa: grava o placar e revela, só se a rodada ainda estiver "fechando" (nunca pontua duas vezes).
export function revelar(codigo, indice, correta, novoPlacar) {
  const ref = doc(db, "salas", codigo);
  return runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!podeRevelar(s.data(), indice)) return false;
    for (const [u, p] of Object.entries(novoPlacar)) tx.set(doc(db, "salas", codigo, "placar", u), p);
    tx.update(ref, { estado: "revelada", correta });
    return true;
  });
}
export const encerrar = (codigo) => updateDoc(doc(db, "salas", codigo), { estado: "fim" });

export const salvarBanco = (modulo, questoes) => setDoc(doc(db, "bancos", modulo), { questoes, atualizadoEm: serverTimestamp() });
export const lerBanco = async (modulo) => (await getDoc(doc(db, "bancos", modulo))).data()?.questoes ?? null;

const porTurma = async (col, turma) =>
  (await getDocs(query(collection(db, col), where("turma", "==", turma)))).docs.map((d) => ({ id: d.id, ...d.data() }));
export const lerAlunos = (turma) => porTurma("alunos", turma);
export const lerAcessos = (turma) => porTurma("acessos", turma);
export const lerRespostas = (turma) => porTurma("respostas", turma);

// Quizzes da turma com jogadores e placar (para o painel)
export async function lerQuizzes(turma) {
  const salas = await porTurma("salas", turma);
  return Promise.all(salas.map(async (s) => {
    const [js, pl] = await Promise.all([
      getDocs(collection(db, "salas", s.id, "jogadores")),
      getDocs(collection(db, "salas", s.id, "placar")),
    ]);
    return { codigo: s.id, modo: s.modo ?? "individual", estado: s.estado, criadaEmMs: msDe(s.criadaEm), total: s.total,
      jogadores: js.docs.map((d) => ({ uid: d.id, ...d.data() })),
      placar: Object.fromEntries(pl.docs.map((d) => [d.id, d.data()])) };
  }));
}
