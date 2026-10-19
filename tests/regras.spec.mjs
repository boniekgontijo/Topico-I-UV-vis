// Regras do Firestore. Rodar com: npm run test:regras (sobe o emulador).
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-uvvis",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8081 },
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const aluno = (uid = "u1") => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
const prof = () => env.authenticatedContext("prof", { email: "boniek@ufg.br", email_verified: true }).firestore();
const outro = () => env.authenticatedContext("x", { email: "intruso@gmail.com", email_verified: true }).firestore();
const semLogin = () => env.unauthenticatedContext().firestore();
const semRegras = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const dadosAluno = { nome: "Ana", matricula: "123", turma: "2026-2", primeiroAcesso: serverTimestamp(), ultimoAcesso: serverTimestamp() };

test("aluno cria o próprio registro, mas não lê o de outro nem dados restritos", async () => {
  await assertSucceeds(setDoc(doc(aluno(), "alunos/2026-2_123"), dadosAluno));
  await semRegras((db) => setDoc(doc(db, "alunos/2026-2_456"), { nome: "Bia" }));
  await assertFails(getDoc(doc(aluno(), "alunos/2026-2_456")));
  await assertFails(getDoc(doc(aluno(), "bancos/uvvis")));
  await assertFails(setDoc(doc(semLogin(), "alunos/2026-2_9"), dadosAluno));
});

test("id do aluno precisa bater com turma_matricula", async () => {
  await assertFails(setDoc(doc(aluno(), "alunos/2026-2_999"), dadosAluno));
});

test("troca de celular: outro uid atualiza o mesmo registro (sem mudar o primeiro acesso)", async () => {
  await assertSucceeds(setDoc(doc(aluno("u1"), "alunos/2026-2_123"), dadosAluno));
  await assertSucceeds(updateDoc(doc(aluno("u2"), "alunos/2026-2_123"), { ultimoAcesso: serverTimestamp(), nome: "Ana Souza" }));
  await assertFails(updateDoc(doc(aluno("u2"), "alunos/2026-2_123"), { primeiroAcesso: serverTimestamp() }));
});

test("acessos: só criação, com horário do servidor", async () => {
  const a = { turma: "2026-2", matricula: "123", pagina: "#menu", uid: "u1" };
  await assertSucceeds(addDoc(collection(aluno(), "acessos"), { ...a, quando: serverTimestamp() }));
  await assertFails(addDoc(collection(aluno(), "acessos"), { ...a, quando: Timestamp.fromMillis(0) }));
  await assertFails(addDoc(collection(aluno(), "acessos"), { ...a, uid: "outro", quando: serverTimestamp() }));
  await assertFails(getDoc(doc(aluno(), "acessos/x")));
});

test("respostas de casa/grupo: só criação; só o professor lê", async () => {
  const r = { tipo: "casa", turma: "2026-2", atividade: "casa-4", questaoId: "c4-01", bloco: 4, correta: true, tentativa: 1,
    membros: [{ nome: "Ana", matricula: "123" }], uid: "u1", quando: serverTimestamp() };
  await assertSucceeds(setDoc(doc(aluno(), "respostas/r1"), r));
  await assertFails(setDoc(doc(aluno(), "respostas/r1"), { ...r, correta: false }));
  await assertFails(setDoc(doc(aluno(), "respostas/r2"), { ...r, tipo: "outro" }));
  await assertFails(getDoc(doc(aluno(), "respostas/r1")));
  await assertSucceeds(getDoc(doc(prof(), "respostas/r1")));
});

test("professor lê e grava banco, alunos e respostas; outro e-mail não", async () => {
  await assertSucceeds(setDoc(doc(prof(), "bancos/uvvis"), { questoes: [] }));
  await assertSucceeds(getDoc(doc(prof(), "bancos/uvvis")));
  await assertSucceeds(getDoc(doc(prof(), "alunos/2026-2_123")));
  await assertFails(getDoc(doc(outro(), "bancos/uvvis")));
  await assertFails(getDoc(doc(outro(), "alunos/2026-2_123")));
});

async function salaEmPergunta({ estado = "pergunta", indice = 2, fechaMs = Date.now() + 60000 } = {}) {
  await semRegras((db) => setDoc(doc(db, "salas/111111"), {
    turma: "2026-2", modulo: "uvvis", estado, indice, total: 10, limiteMs: 20000,
    pergunta: { enunciado: "?", alternativas: ["a", "b"], bloco: 1 },
    abertaEm: Timestamp.now(), fechaEm: Timestamp.fromMillis(fechaMs), correta: null,
  }));
}
const resp = (uid, indice = 2) => ({ uid, indice, alternativa: 1, quando: serverTimestamp() });

test("competição: uma resposta por aluno, só enquanto a pergunta está aberta", async () => {
  await salaEmPergunta();
  const db = aluno("u1");
  await assertSucceeds(setDoc(doc(db, "salas/111111/respostas/2_u1"), resp("u1")));
  await assertFails(setDoc(doc(db, "salas/111111/respostas/2_u1"), resp("u1")));
  await assertFails(setDoc(doc(db, "salas/111111/respostas/2_u9"), resp("u9")));
  await assertFails(setDoc(doc(aluno("u3"), "salas/111111/respostas/1_u3"), resp("u3", 1)));
  await assertFails(setDoc(doc(aluno("u4"), "salas/111111/respostas/2_u4"), { ...resp("u4"), quando: Timestamp.fromMillis(0) }));
  await assertFails(getDoc(doc(aluno("u1"), "salas/111111/respostas/2_u1")));
});

test("competição: resposta negada depois do fim do tempo ou com a pergunta revelada", async () => {
  await salaEmPergunta({ fechaMs: Date.now() - 1000 });
  await assertFails(setDoc(doc(aluno("u1"), "salas/111111/respostas/2_u1"), resp("u1")));
  await salaEmPergunta({ estado: "revelada" });
  await assertFails(setDoc(doc(aluno("u2"), "salas/111111/respostas/2_u2"), resp("u2")));
});

test("competição: aluno lê sala e placar, mas não escreve neles; entra como jogador uma vez", async () => {
  await salaEmPergunta();
  const db = aluno("u1");
  await assertSucceeds(getDoc(doc(db, "salas/111111")));
  await assertFails(updateDoc(doc(db, "salas/111111"), { correta: 1 }));
  await assertFails(setDoc(doc(db, "salas/111111/placar/u1"), { nome: "Ana", pontos: 99999 }));
  await assertSucceeds(getDoc(doc(db, "salas/111111/placar/u1")));
  const j = { nome: "Ana", matricula: "123", entrouEm: serverTimestamp() };
  await assertSucceeds(setDoc(doc(db, "salas/111111/jogadores/u1"), j));
  await assertFails(setDoc(doc(db, "salas/111111/jogadores/u1"), j));
  await assertFails(setDoc(doc(db, "salas/111111/jogadores/u2"), j));
});

test("professor cria sala, grava placar e lê respostas", async () => {
  await salaEmPergunta();
  await assertSucceeds(setDoc(doc(prof(), "salas/222222"), { estado: "lobby" }));
  await assertSucceeds(setDoc(doc(prof(), "salas/111111/placar/u1"), { nome: "Ana", pontos: 950, somaDtAcertos: 2000, acertos: 1 }));
  await semRegras((db) => setDoc(doc(db, "salas/111111/respostas/2_u1"), { uid: "u1" }));
  await assertSucceeds(getDoc(doc(prof(), "salas/111111/respostas/2_u1")));
});

test("conta Google sem e-mail verificado não é professor", async () => {
  const db = env.authenticatedContext("y", { email: "boniek@ufg.br", email_verified: false }).firestore();
  await assertFails(getDoc(doc(db, "bancos/uvvis")));
});

test("quiz em equipes: o celular da equipe entra com nome da equipe e integrantes", async () => {
  await salaEmPergunta();
  const membros = [{ nome: "Ana", matricula: "123" }, { nome: "Bia", matricula: "456" }];
  await assertSucceeds(setDoc(doc(aluno("e1"), "salas/111111/jogadores/e1"),
    { nome: "Os Batocrômicos", matricula: "123", membros, entrouEm: serverTimestamp() }));
  const muitos = Array.from({ length: 7 }, (_, i) => ({ nome: `X${i}`, matricula: `${i}` }));
  await assertFails(setDoc(doc(aluno("e2"), "salas/111111/jogadores/e2"),
    { nome: "Lotada", matricula: "9", membros: muitos, entrouEm: serverTimestamp() }));
});
