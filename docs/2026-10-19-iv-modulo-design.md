# Plataforma de Espectroscopia — Módulo IV (design)

Prof. Dr. Boniek Gontijo Vaz — Introdução aos Métodos Instrumentais de Análise (UFG)
Data: 2026-10-19 · Turma: 2026-2 (25 alunos)

## 1. Intenção e porquê

O módulo UV-vis já está em uso, com quiz ao vivo, casa, grupo, simuladores e painel
(`docs/2026-10-18-uvvis-plataforma-design.md`). Para o IV, o professor quer um formato **diferente**, centrado
no objetivo da aula: **reconhecer funções orgânicas pelo espectro de IV**.

O exercício central é "**qual molécula corresponde a este espectro?**": um espectro e de 2 a 5 estruturas
candidatas, com a dificuldade crescendo. Ele vem mesclado com questões teóricas, em três pools separados
(sala, casa e grupo).

## 2. Objetivos

1. **Questão espectro → molécula**, nos três níveis:
   - **fácil**, com 2 opções de funções bem diferentes (ex.: álcool × cetona);
   - **médio**, com 3–4 opções de funções vizinhas (ex.: aldeído × cetona × éster × ácido);
   - **difícil**, com 5 opções parecidas (ex.: ácido × éster × amida × nitrila × anidrido; aminas 1ª/2ª/3ª;
     C=O conjugada × não conjugada; álcool × fenol × éter).
2. **Questões teóricas** misturadas às de espectro, tiradas das listas e da aula: por que N₂/O₂ não absorvem e
   HCl sim, variação de dipolo, fatores que deslocam a banda (k, massa, hibridização, ressonância, ligação de H),
   regiões do espectro, vantagens do FT-IR, preparo de amostra, Lei de Hooke, número de onda.
3. **Pool de SALA (quiz ao vivo):** o mesmo mecanismo do UV-vis (registro com personagem, link fixo/QR, controle
   pelo celular, 2 rodadas de 10, pontos acumulados, pódio). A dificuldade sobe ao longo do quiz: a **rodada 1**
   tem as fáceis e médias, a **rodada 2** as médias e difíceis. Há uma sequência fixa e slides de
   **pergunta → resposta** (com o "Por quê?" e "💬 Discuta com o colega").
4. **Pool de CASA:** maior que o de sala e **sem repetir** as questões dele, praticado no ritmo do aluno. Entra
   na **nota de prática** (0–10 = questões diferentes feitas ÷ total do pool de casa), como no UV-vis.
5. **Questão em GRUPO** (segunda metade da aula): 25 alunos em **6 grupos**, cada grupo com um **composto
   desconhecido diferente**, no estilo das listas: fórmula molecular, espectro de IV desenhado e uma pista.
   - Em cerca de 20 min, o grupo calcula as insaturações, atribui as bandas principais e propõe a estrutura.
   - O grupo **envia pela plataforma** a estrutura escolhida (entre candidatas) e a justificativa das bandas.
   - Na **apresentação** (~3 min por grupo), o professor projeta a resposta do grupo, a turma discute e no fim
     ele revela o composto certo.

## 3. Não-objetivos

- Simulador de espectro "desenhe você mesmo" (pode vir depois).
- Interpretação de RMN/EM (IV apenas).
- Correção automática da justificativa escrita: é discutida na apresentação, não pontuada pela máquina.

## 4. Anti-objetivos (o que tornaria isso um fracasso)

- **Estruturas com o grupo funcional destacado** (cor): entregariam a resposta. As estruturas aparecem **só em
  preto**, sem nome.
- Figuras ou títulos que entreguem a resposta (lição do UV-vis: "fora da faixa linear ✗").
- Espectro ilegível no celular (bandas finas sumindo, eixo sem números).
- Espectros fisicamente errados: banda em posição incorreta para a função, ou O–H de ácido estreito.
- Cópia de imagens de bancos protegidos por direito autoral.

## 5. Decisões do professor

- Espectros **desenhados pela plataforma**: os exemplos dos exercícios dele são **mesclados** com espectros
  desenhados ou recriados a partir de **posições de banda** de bancos públicos (a imagem nunca é copiada).
- Opções **só com a estrutura**, **sem destaque colorido** e sem nome.
- Progressão de **2 → 5 opções** por nível (fácil, médio, difícil), mesclada com teóricas.
- Pools separados para sala e para casa; uma questão-problema por grupo, com problemas **diferentes** entre os
  grupos e apresentação na **segunda metade da aula**.

## 5a. Decisões após a revisão (respostas do professor)

- **Grupo não vale pontos:** só apresentação; o professor avalia se quiser. A **resposta certa de cada
  problema fica escondida** (em `privado/`, lida só pelo professor) até ele revelar na aula.
- **Nota de prática de IV separada** da de UV-vis: duas colunas no painel e no CSV. A data de corte do IV é
  **a definir** pelo professor; fica configurável, não fixa no código.
- **Slides do quiz e dos problemas de grupo em arquivo separado** (`Aula_IV/IV_quiz.pptx`), como no UV-vis.
  A data da aula de IV não foi informada; o material deve estar pronto independentemente dela.

## 5b. Decisões do builder (minhas, a conferir)

- **Reuso de compostos:** o mesmo composto pode aparecer na sala e em casa, mas nunca a mesma questão (outras
  opções ou outro nível). Os **compostos desconhecidos dos grupos não aparecem** nem na sala nem em casa.
- **Opções não precisam ser isômeros** e a fórmula **não é mostrada** nas questões de espectro → molécula.
  Para evitar acertar "contando carbonos", no médio e no difícil as opções têm tamanho parecido (±1 C). Nos
  **problemas de grupo**, a fórmula molecular **é mostrada** (cálculo de insaturações, como nas listas).
- **Procedência das bandas:** bastam as posições do Pavia/Tópico II e de tabelas públicas, sem citar uma
  entrada específica de banco. Cada composto novo é conferido contra a tabela de grupos funcionais da aula.
- **Problemas de grupo usam compostos inéditos:** não usam os das listas resolvidas (que os alunos já têm), só
  o mesmo estilo.
- **Teóricas da rodada 1** cobrem fundamentos (radiação, número de onda, dipolo, Hooke); as da rodada 2,
  fatores, preparo de amostra e FT-IR, acompanhando a ordem da aula.

## 6. Base existente a reaproveitar

- `Aula_IV/build/espectro.py`: motor de espectros simulados (bandas Lorentz/Gauss em absorbância → %T, ruído
  determinístico na impressão digital, eixo invertido 4000 → 400 cm⁻¹).
- `Aula_IV/build/compostos.py`: tabela de bandas de ~20 compostos (posição, absorbância, meia-largura, forma),
  com posições do Pavia/Tópico II.
- `Aula_IV/estruturas/*.mol`: ~29 estruturas (RDKit). As PNG atuais têm destaque colorido; para as questões
  geramos versões **lisas** a partir dos `.mol`.
- `Aula_IV/PLANO.md`: roteiro, fontes lidas (Tópico II, MANUAL IR/Pavia, Listas 1 e 2) e código de cores.
- Toda a plataforma UV-vis: registro com personagem único, link fixo da turma, quiz em rodadas com
  fechamento seguro, painel e CSV, slides gerados por script, regras do Firestore testadas.

## 7. Conteúdo (escala inicial)

- **Biblioteca de compostos:** ampliar de ~20 para ~40–45, cobrindo alcano, alceno, alcino, aromático, haleto,
  álcool 1º/2º/3º, fenol, éter, aldeído, cetona (simples e conjugada), ácido carboxílico, éster, lactona,
  anidrido, cloreto de acila, amida 1ª/2ª/3ª, amina 1ª/2ª/3ª, nitrila, nitro e os compostos das listas
  (C₅H₁₀O, C₆H₁₂O, C₆H₁₄O, C₄H₈O₂, citral × citronelal).
- **Sala:** 20 questões (2 rodadas × 10), com cerca de 15 de espectro e 5 teóricas, em sequência fixa e com slides.
- **Casa:** ~80 questões (~60 de espectro e ~20 teóricas), distintas das de sala.
- **Grupo:** 6 problemas mais 2 de reserva, cada um com fórmula, espectro, pista, 4–6 estruturas candidatas,
  bandas-chave esperadas e resolução comentada (para o professor revelar).

## 8. Restrições

- Mesma plataforma, repositório, Firebase e regras do UV-vis (`boniekgontijo/Topico-I-UV-vis`; projeto
  `espectroscopia-imia`); turma 2026-2. O módulo IV entra como **segundo módulo** no mesmo site (menu por
  módulo), sem quebrar o UV-vis.
- Celular primeiro (360 px), 4G; o espectro precisa ser legível na tela do celular.
- Gabarito do quiz de sala fora do site público (arquivo `privado/`, carregado pelo professor).
- Cada mudança nas regras exige que o professor as cole no console do Firebase.

## 9. Deixado para o builder

- Desenhar o espectro no navegador (SVG a partir da tabela de bandas) ou pré-renderizar imagens.
- Como o celular mostra 5 opções com estruturas (grade, ampliar ao tocar). A 5ª cor/forma deve seguir o padrão
  ▲◆●■ + uma nova.
- Formato dos dados de compostos e questões; o gerador de distratores; o ordenamento por nível.
- O fluxo de formar os 6 grupos na hora e de projetar a resposta de cada grupo.
- A redação das questões, sempre conferida com o material de aula e com as posições de banda verificadas.
