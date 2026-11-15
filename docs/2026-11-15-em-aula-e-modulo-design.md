# Espectrometria de Massas — aula (Tópico III) e módulo EM da plataforma (design)

Prof. Dr. Boniek Gontijo Vaz — Introdução aos Métodos Instrumentais de Análise (UFG), licenciatura
Data: 2026-11-15 · Turma: 2026-2 · Ramo: `feat/em` (plataforma)

## 1. Intenção e porquê

Apresentar a técnica de espectrometria de massas (EM/MS) à licenciatura de IMIA, refazendo o
`Tópico III - espectrometria de Massas/TOPICO III.pptx` (74 slides, 2026-05-19) no mesmo molde das aulas
de UV-vis e IV: slides gerados por código, vídeos que avançam um trecho por clique e figura 3D. O professor
pediu que **toda a informação dos slides dele** seja usada, que os **exercícios do final** fiquem, que os
**espectros sejam melhorados** (legíveis e fiéis aos dados reais), e que entre **um slide de íons
diagnósticos mais comuns**. Em seguida, os alunos ganham uma página na plataforma, na mesma área do quiz.

São dois trabalhos encadeados, nesta ordem:

1. **Deck da aula** em `IMIA/Aula_EM/` (fora de git, como `Aula_IV/`).
2. **Módulo EM** na plataforma (`?m=em`), no ramo `feat/em`, reaproveitando os dados do deck.

## 2. Objetivos

**Aula (3 h):** duas horas de teoria e uma hora de exercícios resolvidos em sala.

1. O aluno sabe o que um espectrômetro de massas faz: gerar íons, separá-los por m/z, detectá-los.
2. Distingue ionização dura (EI) de branda (ESI, MALDI) e sabe quando cada uma serve.
3. Entende o princípio de cada analisador (setor magnético, quadrupolo, TOF, ion trap, Orbitrap/ICR) e o
   que significa resolução.
4. Lê um espectro de EI: reconhece o íon molecular, usa padrão isotópico (A, A+1, A+2; Cl e Br), regra do
   nitrogênio, regra dos 13, e os íons e perdas diagnósticos, incluindo α-clivagem e McLafferty.
5. Resolve os exercícios do Tópico III propondo a estrutura.

**Módulo EM (plataforma):** o aluno pratica a interpretação de espectros de massas e revê a aula.

## 3. Não-objetivos

- MS/MS, quantificação por MS, acoplamentos GC-MS/LC-MS além de uma menção.
- Massa exata e fórmula por alta resolução além de um slide conceitual (massa nominal × monoisotópica).
- Atividade em grupo com entrega (a hora de exercícios é feita no deck, com a turma).
- Reescrever a plataforma: o EM entra como terceiro módulo, sem tocar no comportamento do UV-vis e do IV.

## 4. Anti-objetivos

- **Espectro com pico em m/z errado ou intensidade inventada.** Todo espectro de composto real vem da tabela
  de picos do slide do professor ou de dado público (NIST WebBook), com a fonte no slide.
- Imagem copiada de banco ou livro: os espectros são **redesenhados** em barras a partir dos números.
- Figura ou título que entregue a resposta do exercício antes da hora.
- Espectro ilegível no celular (rótulos sobrepostos, eixo sem números).
- Perder conteúdo dos slides originais sem decisão explícita (ver §6, tabela de mapeamento).

## 5. Abordagens consideradas

| | Abordagem | Troca | Decisão |
|---|---|---|---|
| 1 | Mesmo pipeline da `Aula_IV` (Python → figuras; `deck.js` → pptx; mpl-animation → clipes; Blender → 3D) | Mais trabalho, mas mesmo estilo, regenerável, maquinaria já existe | **Escolhida pelo professor** |
| 2 | Editar o `TOPICO III.pptx` original trocando figuras | Rápido, mas destoa das outras aulas e mantém figuras escaneadas | descartada |
| 3 | Aula inteira como página web interativa | Mais rica, mas foge do formato de sala e do `montar.py` | descartada (vira só a parte "Revisar" do módulo) |

## 6. Aula — conteúdo

Estilo idêntico ao da `Aula_IV/PLANO.md`: fundo branco, títulos de seção em Comic Sans negrito, subtítulo
azul #0070C0, corpo Arial, marcadores ✓, equações em caixa amarela #FFCC00. Espectros de massas em
**barras verticais** (m/z × abundância relativa %, pico base = 100), rótulo de m/z nos picos relevantes.
Código de cores fixo nos espectros: **preto** = picos comuns, **vermelho** = íon molecular (M⁺·),
**azul** = pico base, **verde** = cluster isotópico (M+1, M+2), **laranja** = íon/perda diagnóstica
destacada.

Roteiro (~60 slides de teoria + ~25 de exercícios; ★ = animação, ◆ = 3D):

**A. Abertura (≈6)** — capa; definições (citações dos slides 2–3, traduzidas e curtas); por que MS
(slide 4); aplicações em **um** slide com quatro quadros (alimentos, fármacos, petróleo, clínica — slides
5–8); mapa de palavras/94 923 artigos (slide 11) como curiosidade; o que o MS informa (massa molecular,
fórmula, fragmentos — slides 12–13).

**B. O instrumento (≈4)** — princípio (slide 9); diagrama de blocos entrada → fonte → analisador → detector
→ dados, com vácuo (slides 10, 45) ★ *percurso de um íon pelo instrumento*; ementa I/II/III como mapa
da aula (slides 14, 40, 48).

**C. Ionização (≈16)** — visão geral EI/CI/ESI/MALDI/APCI (slide 15). **EI**: esquema (Dempster e Nier),
elétron de 70 eV, M⁺· e fragmentação (slides 16–18) ★ *elétron arranca elétron, M⁺· se fragmenta*;
espectro do hexadecano redesenhado (slide 19); vantagens e limitações (slide 20). **"Can elephants
fly?"** mantido como gancho para ionização branda (slides 21–23, 31). **MALDI**: Nobel 2002 (Tanaka), matriz,
laser N₂ 337 nm, razão matriz:amostra 100:1 a 5000:1, matrizes típicas (DHB, sinapínico, α-CHCA),
placa (slides 24–28) ★ *pulso de laser dessorve matriz e analito*; Covid-19 por MALDI-TOF (slide 29);
vantagens e limitações (slide 30). **ESI**: "can fish fly?", texto do mecanismo, cone de Taylor, limite de
Rayleigh, explosões coulômbicas, CRM × IEM, fluxos (slides 32–37) ★ *gota encolhe, fissiona, libera íons*;
espécies multiplamente carregadas (slide 38, redesenhado); vantagens e limitações (slide 39).

**D. Analisadores (≈12)** — função e vácuo (slide 41); lista (slide 42); **setor magnético** com
r = mv/qB (slide 43) ★ *íons de m/z diferentes curvam raios diferentes*; **quadrupolo**, U/V₀ constante
(slide 44) ★ *só o m/z estável atravessa* ◆ *quadrupolo 3D com trajetória*; **TOF** (novo, E_c = zeV =
mv²/2) ★ *corrida dos íons*; **ion trap** e **Orbitrap/ICR** (novos, um slide cada, princípio só pela
frequência); resolução R = m/Δm com dois picos (novo); tabela comparativa (novo).

**E. Detectores (≈2)** — função e tipos (slides 46–47): fotomultiplicadora, multiplicador de elétrons, MCP,
com esquema redesenhado ★ *cascata de elétrons*.

**F. Interpretação (≈20)** — notação do espectro (slide 49); MS mede isótopos (slide 50); massas nominal,
média e monoisotópica (slide 51); classes A, A+1, A+2 (slide 52); abundância isotópica com as 8 alaninas,
A+1 ÷ 1,1 ≈ nº de C (slides 53–55); **CH₃Br** e **CH₃Cl** redesenhados (slides 56–57) ★ *padrão 3:1 e
1:1 montando-se*; tabela periódica isotópica (slide 58, mantida como imagem do original, com crédito);
McLafferty (citação e foto, slide 59); reconhecer M⁺· (slide 60); "quem é o íon molecular?" (slides
61–62); regra do nitrogênio (slides 63–64, espectros da 2-butanona e da hexilamina redesenhados); regra
dos 13 com a tabela de equivalentes (slide 65); **α-clivagem** e **rearranjo de McLafferty** (novos) ★
*McLafferty passo a passo*; **íons diagnósticos mais comuns** (novo, ver §6.1); estratégia de
interpretação em fluxograma (novo).

**G. Exercícios (1 h, ≈25)** — cada exercício: slide do problema com espectro redesenhado e, depois, slides
de resolução que revelam um passo por clique (M⁺·, isótopos, regra do N, perdas, estrutura).

| Slide original | Exercício | Resposta (a conferir pelo builder contra os dados) |
|---|---|---|
| 61 | Quem é o íon molecular? (96, 81) | a identificar |
| 62 | Quem é o íon molecular? (198/200, 170) | a identificar |
| 66 | Ex. 1a: 94/96, 79/81, 47 | bromometano |
| 67 | Ex. 1b: 157/159, 78 (tabela no slide) | bromopiridina (massa ímpar → N) |
| 68 | Ex. 1c: 134, 119 (base), 105, 91, 77 | C₁₀H₁₄ alquilbenzeno (a confirmar) |
| 69 | 1: 34, 33, 15 | fluorometano |
| 70 | 2: 58, 43 (base), 29, 27 + IV | butano |
| 71 | 3: 50/52 (3:1), 15 | clorometano |
| 72 | 4: 72, 43 (base), 57, 29 + IV (1718) | butanona |
| 73 | 5: 134, 105 (base), 77, 51 + IV (1686) | propiofenona |
| 74 | 6: 100, 43, 58, 71, 85 + IV (1715) | 2-hexanona |

Os IV dos exercícios 2, 4, 5 e 6 são redesenhados com o motor da `Aula_IV/build/espectro.py`
(bandas nas posições anotadas nos slides originais).

**H. Fechamento (≈3)** — resumo ✓; quiz da plataforma; para estudar (Pavia cap. 8; lista).

### 6.1 Slide de íons diagnósticos (novo)

Tabela em duas colunas, cores do código:

- **Íons:** m/z 15 CH₃⁺ · 29 CHO⁺/C₂H₅⁺ · 30 CH₂=NH₂⁺ (aminas) · 31 CH₂=OH⁺ (álcoois/éteres) ·
  43 CH₃CO⁺/C₃H₇⁺ · 44 CO₂⁺·/McLafferty de aldeído · 45 COOH⁺ · 57 C₄H₉⁺ · 58 McLafferty de metilcetona ·
  60 McLafferty de ácido · 74 McLafferty de éster metílico · 77 C₆H₅⁺ · 91 C₇H₇⁺ (tropílio) ·
  105 C₆H₅CO⁺ (benzoíla).
- **Perdas a partir de M:** −1 H · −15 CH₃ · −17 OH · −18 H₂O · −28 CO/C₂H₄ · −29 CHO/C₂H₅ · −31 OCH₃ ·
  −35/37 Cl · −45 COOH/OC₂H₅ · −79/81 Br.
- Rodapé: "Para lembrar: padrões M:M+2 — Cl 3:1, Br 1:1".

Cada linha conferida contra Pavia cap. 8 / McLafferty & Tureček.

## 7. Aula — construção

- Pasta `IMIA/Aula_EM/` com a mesma estrutura de `Aula_IV/`: `build/` (figuras, `espectros_ms.py`,
  `compostos_ms.py`, `deck.js`, `sizes.py`), `figs/`, `estruturas/` (RDKit, `.png` + `.mol`),
  `animacoes/` (mpl-animation, `pauses.toml`, `cut.py`, `integrar.py`), `figura3d/` (quadrupolo, Blender,
  rotas da skill `schematic-figure`), `PLANO.md`, `EM_aula.pptx`.
- **Dados dos espectros:** `compostos_ms.py` guarda, por composto, a lista de picos (m/z, %), a fonte
  (`slide NN` ou `NIST WebBook <id>`) e os rótulos. Onde o slide traz tabela de picos (exercícios 1–4,
  1b, 1c), ela é a fonte; nos demais, NIST WebBook (espectro de EI). Picos < 1 % podem ser omitidos.
- Reaproveitar o máximo de `Aula_IV/build` (estilo, `sizes.py`, `deck.js`) e `Aula_IV/animacoes/anim.py`.
- Vídeos ~8–10 (★ acima); a figura 3D é **uma** (quadrupolo).
- Integração ao `Aula_hoje/montar.py` fica para quando a data da aula estiver definida.

## 8. Módulo EM na plataforma

Entra como `em` em `public/js/core/modulo.js` (`?m=em`), conteúdo em `public/conteudo/em/`, gabarito do quiz em
`privado/em-competicao.json`. Mesmas regras: celular primeiro (360 px), nada público entrega resposta,
mudança nas regras do Firestore só se inevitável (e então o professor cola no console).

1. **Quiz ao vivo:** uma rodada de 10 questões, no fim do bloco de teoria (mecanismo do UV-vis/IV, slides de
   pergunta → resposta gerados por `tools/slides-quiz.cjs`).
2. **Prática para casa:** ~40 questões, distintas das do quiz, com nota de prática **separada** (coluna EM
   no painel e no CSV), data de corte configurável.
   - **Espectro → molécula:** espectro de barras desenhado em SVG no navegador a partir da lista de picos;
     2 a 4 estruturas candidatas, sem destaque e sem nome; dificuldade crescente.
   - **Perguntas de leitura:** "qual é o M⁺·?", "quantos Cl/Br?", "número de N par ou ímpar?", "o pico em
     m/z 58 indica…", "que perda leva de 72 a 43?".
   - **Teóricas:** ionização dura × branda, escolha de fonte para um analito, analisadores, vácuo,
     resolução, detectores.
3. **Revisar a aula:** página com os clipes das animações (vídeo leve, MP4 comprimido) e o resumo; e um
   **simulador de padrão isotópico** (o aluno escolhe nº de C, Cl, Br e vê o cluster M, M+1, M+2…).
4. Compostos das questões **não** repetem os dos exercícios do deck, salvo nas teóricas de leitura.

## 9. Restrições

- Plataforma, repositório (`boniekgontijo/Topico-I-UV-vis`), Firebase (`espectroscopia-imia`) e regras do
  UV-vis/IV. Nada é empurrado ao remoto nem mesclado em `main` sem a palavra do professor.
- Data da aula de EM: **2026-11-16** (informada pelo professor em 2026-11-15). Ver §12.
- Tempo: 3 h (2 h teoria + 1 h exercícios), leitura do professor em 2026-11-15; confirmar.

## 10. Decisões

**Do professor:** abordagem 1; uma hora de exercícios em sala com os seis exercícios (e os do Ex. 1);
espectros melhorados; slide de íons diagnósticos; página para os alunos no ramo `feat/em`, na área do quiz.

**Minhas (a conferir):**
- Ordem: deck primeiro, módulo depois.
- Espectros reais redesenhados em barras, fonte citada; IV dos exercícios simulados com as posições do slide.
- Analisadores ampliados com TOF, ion trap e Orbitrap/ICR (o professor trabalha com FT-ICR).
- Quiz de uma rodada de 10 no fim da teoria; casa ~40; sem atividade em grupo.
- Simulador de padrão isotópico como único simulador do módulo.
- Figura 3D: quadrupolo com trajetória de íon.
- Slides com piada visual (Dumbo, peixe) mantidos como ganchos.
- Tabela periódica isotópica do slide 58 reaproveitada como imagem do original, por não ter equivalente
  simples a redesenhar.

## 11. Deixado ao builder

- Identificar os compostos dos slides 61, 62 e 68 e conferir todas as respostas da §6 contra os dados.
- Redação das questões, distratores, ordem de dificuldade.
- Quais trechos exatos de cada animação; resolução dos vídeos para o site.
- Como o celular mostra o espectro de barras (rótulos, toque para ampliar).

## 12. Fases (a aula é em 2026-11-16, um dia depois deste design)

**Fase 1, até a aula, o mínimo que precisa estar pronto:**
1. Deck completo das seções A–H com todo o conteúdo dos slides originais, no estilo da `Aula_IV`.
2. Todos os espectros dos exercícios e da teoria redesenhados a partir dos números (tabela do slide ou NIST),
   com as resoluções passo a passo por clique.
3. Slide de íons diagnósticos.
4. Animações na ordem de prioridade, até onde o tempo der: padrão isotópico Cl/Br → McLafferty → EI →
   quadrupolo → ESI → TOF → setor magnético → MALDI → detector → percurso no instrumento. As que não
   ficarem prontas entram como figura estática.
5. Exportar PDF do deck e revisar visualmente cada slide.

**Fase 2, depois da aula:** figura 3D do quadrupolo, animações restantes e o módulo EM da plataforma (§8).
A escolha entre o modelo do IV (quiz ao vivo com nota) e o do UV-vis (prática sem nota) fica para o
professor decidir antes de começar a Fase 2.
