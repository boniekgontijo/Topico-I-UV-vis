// Mensagens de retorno ao aluno: gentis no erro, animadas no acerto.
export const ENCORAJAR = [
  "Não foi desta vez — mas você está no caminho certo!",
  "Quase! Vamos aprendendo juntos.",
  "Faz parte do aprendizado. Na próxima você pega!",
  "Ainda não… mas cada tentativa ensina algo.",
  "Boa tentativa! Veja a explicação e siga em frente.",
];
export const PARABENS = ["Mandou bem!", "Isso aí!", "Acertou em cheio!", "Excelente!", "Arrasou!"];

export const incentivo = (acertou, rnd = Math.random) => {
  const lista = acertou ? PARABENS : ENCORAJAR;
  return lista[Math.floor(rnd() * lista.length)];
};

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
