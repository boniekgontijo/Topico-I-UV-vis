// Configuração do Firebase do professor (ver docs/CONFIGURAR.md, passo 4).
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

// Único e-mail com acesso à área do professor (repetido em firestore.rules).
export const PROFESSOR_EMAIL = "boniek@ufg.br";

// Turma usada quando o link não traz ?t=
export const TURMA_PADRAO = "2026-2";

// Em localhost, usa os emuladores (npm run emulador).
export const USAR_EMULADOR = ["localhost", "127.0.0.1"].includes(location.hostname);
