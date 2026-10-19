// Configuração do Firebase do professor (ver docs/CONFIGURAR.md, passo 4).
export const firebaseConfig = {
  apiKey: "AIzaSyCs0VadQoerKzhp81qyVVA9yqAnqrI8ny0",
  authDomain: "espectroscopia-imia.firebaseapp.com",
  projectId: "espectroscopia-imia",
  storageBucket: "espectroscopia-imia.firebasestorage.app",
  messagingSenderId: "927197219637",
  appId: "1:927197219637:web:1bd8fed5ab74c5244a5a7c",
};

// Único e-mail com acesso à área do professor (repetido em firestore.rules).
export const PROFESSOR_EMAIL = "boniek@ufg.br";

// Turma usada quando o link não traz ?t=
export const TURMA_PADRAO = "2026-2";

// Em localhost ou na rede local (teste com celulares no mesmo Wi-Fi), usa os emuladores (npm run emulador).
export const USAR_EMULADOR = ["localhost", "127.0.0.1"].includes(location.hostname)
  || /^(192\.168|10)\.\d+\.\d+(\.\d+)?$|^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(location.hostname);

// Data de corte da nota de prática de cada módulo ("AAAA-MM-DD"; null = a definir)
export const CORTE_PRATICA = { uvvis: "2026-11-09", iv: null };
