# Plataforma interativa de Espectroscopia — Módulo UV-vis (design)

Prof. Dr. Boniek Gontijo Vaz — Introdução aos Métodos Instrumentais de Análise (UFG)
Data: 2026-10-18

## 1. Intenção e porquê

Os alunos assistem à aula pelo celular e estão pouco engajados. O professor quer um
ambiente web que transforme o conteúdo de UV-vis em atividade: competição ao vivo em
sala (estilo Kahoot, com prêmio de bombom/chocolate para quem acertar mais), atividades
em grupo e exercícios para casa. Ele também quer ver quem acessou e quanto acertou.

O conteúdo segue **o material de aula do professor**, não um livro genérico:
- `Aula_UV-vis/UV-vis_aula.pptx` (70 slides) e `Aula_UV-vis/PLANO.md` (roteiro, estilo, cores);
- `UV-Vis_Workshop_Questoes.docx` (Estações A–E + Desafio Plenário Woodward-Fieser);
- figuras prontas em `Aula_UV-vis/figs/*.png` e estruturas em `Aula_UV-vis/estruturas/*.png`.

UV-vis vem primeiro. IV vem depois, como um segundo módulo separado na mesma plataforma.

## 2. Objetivos

1. **Competição ao vivo (modo Kahoot).** O professor projeta a pergunta no telão. Os alunos
   respondem ao mesmo tempo no celular. Quem acerta mais rápido ganha mais pontos, e o
   ranking aparece no telão a cada rodada. No final aparece um pódio para entregar o prêmio.
2. **Atividade em grupo.** As estações do Workshop (A–E) e o Desafio Plenário viram
   atividades no celular. O grupo entra com um nome de equipe e recebe correção na hora
  (as questões abertas são convertidas em fechadas; ver 8a).
3. **Para casa.** Há uma lista de exercícios por bloco da aula, feita no ritmo de cada um,
   com feedback que explica o erro.
4. **Espectros interativos (simuladores).** São telas em que o aluno mexe e vê o espectro mudar.
5. **Acompanhamento do professor.** O professor vê quem acessou e quando, a pontuação e os
   acertos de cada aluno em cada atividade, e pode exportar para planilha (CSV).
6. **Entrada por QR code**, com uso pensado primeiro para o celular.

## 3. Não-objetivos (por agora)

- Módulo de IV. Ele vem depois, mas a estrutura já deve prever vários módulos.
- Nota oficial ou integração com o SIGAA/Moodle.
- Login com senha para o aluno.
- Aplicativo nativo. É só um site.

## 4. Anti-objetivos (o que tornaria isso um fracasso)

- Ser lento ou travar no celular durante a competição. Ninguém pode ficar de fora da rodada.
- Exigir cadastro demorado. Ler o QR code e começar a jogar deve levar menos de 30 s.
- Ter conteúdo ou notação diferentes da aula: usar ε, b, c, λmáx, os mesmos valores e o mesmo
  código de cores (vermelho = batocrômico, azul = hipsocrômico, roxo = hiper/hipo).
- Ter respostas erradas no gabarito. Toda conta precisa ser verificada.
- Deixar o gabarito da competição visível para quem abrir o código da página.

## 5. Decisões tomadas com o professor

- Celular primeiro e entrada por QR code.
- Competição ao vivo no estilo Kahoot, com ranking no telão.
- Hospedagem: site estático no **GitHub Pages** e dados no **Firebase** (plano gratuito do
  Google). O professor cria o projeto Firebase com a conta Google dele, e o builder o guia
  no passo a passo.
- Conteúdo: segue os 10 blocos da aula e reaproveita o banco do Workshop.
- Simuladores no estilo "mexe e vê" (detalhes na seção 7).

## 6. Experiência de uso

### 6.1 Aluno
1. Lê o QR code e cai na página do módulo UV-vis.
2. Digita nome e matrícula (só da primeira vez, fica guardado no aparelho) e não cria senha.
   Na atividade em grupo, digita também o nome da equipe.
3. Escolhe entre **Entrar na competição** (digita o código de 6 dígitos que está no telão;
   o QR do telão já leva com o código), **Atividades em grupo**, **Exercícios para casa**
   ou **Simuladores**.

### 6.2 Professor
- Uma área do professor protegida por login Google e restrita ao e-mail dele.
- **Criar competição:** escolhe um conjunto de perguntas (por bloco ou "aula inteira") e o
  tempo por pergunta (padrão 20 s). O telão mostra QR code + código, a lista de quem entrou,
  a pergunta, a contagem regressiva e o gráfico de respostas. Em seguida mostra a resposta
  certa com a explicação curta e o ranking top 5. No fim, o pódio top 3.
- **Painel de acessos:** lista de alunos com o primeiro e o último acesso, as atividades
  feitas, a pontuação e o percentual de acerto por bloco, e um botão para exportar CSV.

### 6.3 Pontuação (estilo Kahoot)
- Resposta certa: 1000 pontos × fator de rapidez (de 1,0 se responder na hora até 0,5 no
  limite do tempo). Resposta errada ou fora do tempo: 0.
- Desempate pela soma dos tempos de resposta das questões certas.

## 7. Conteúdo

### 7.1 Blocos (iguais aos da aula)
1. Luz e espectro eletromagnético (E = hν = hc/λ; 200–800 nm)
2. Transições eletrônicas (HOMO→LUMO; σ, π, n; π→π*, n→π*; bandas largas)
3. O que o instrumento mede (T = I/I₀; A = −log T; faixa A ≈ 0,1–1,0)
4. Lei de Beer (A = εbc; aditividade; exemplo do slide 23)
5. Desvios (reais, químicos/isosbéstico, instrumentais/policromática e luz espúria)
6. Curva analítica (padrões, regressão, R², resíduos, LOD = 3,3s/a, LOQ = 10s/a)
7. Instrumentação (D₂ × W-halogênio, ~350 nm; quartzo; feixe simples, duplo feixe, DAD)
8. Cromóforos e deslocamentos (auxocromos; bato/hipso/hiper/hipo; conjugação; carbonila;
   indutivo × ressonância; solvente; cor complementar)
9. Woodward-Fieser (dienos hetero/homoanulares; enonas; exemplos dos slides 62–65)
10. Aplicações (A₂₆₀/A₂₈₀, HPLC-DAD, colorimetria; o que o UV-vis diz e o que não diz)

### 7.2 Tipos de pergunta
- Múltipla escolha (2–4 alternativas) com figura ou estrutura opcional. Esse é o único tipo
  usado na competição ao vivo.
- Resposta numérica com tolerância (ex.: ±2 %) para contas de Beer, curva e Woodward-Fieser,
  usada em grupo e em casa.
- Verdadeiro/falso.
- Cada pergunta tem uma explicação curta que aparece depois da resposta.

### 7.3 Quantidade inicial
- Competição: ≥ 40 perguntas de múltipla escolha (≈ 4 por bloco).
- Grupo: as 5 estações + o Desafio Plenário do Workshop, com gabarito calculado.
- Casa: ≥ 8 exercícios por bloco (≈ 80 no total), misturando os tipos.

### 7.4 Simuladores
1. **Lei de Beer:** controles deslizantes para ε, b e c, com a cubeta e o feixe, A, %T e a
   banda crescendo.
2. **Conjugação:** número de C=C de 1 a 11 (eteno → β-caroteno), com o gap HOMO-LUMO
   diminuindo, o λmáx subindo, a banda andando para o vermelho e a cor observada (complementar).
3. **Deslocamentos:** botões bato/hipso/hiper/hipo que movem a banda com o código de cores
   da aula.
4. **Curva analítica:** o aluno "mede" padrões e vê os pontos, a reta, o R² e os resíduos,
   e depois calcula a concentração da amostra.
5. **Woodward-Fieser:** escolhe a base e soma os incrementos, comparando o calculado com o
   observado.

### 7.5 Edição do conteúdo
- As perguntas ficam em arquivos de dados legíveis, organizados por bloco. O professor pede
  a alteração ao Claude, que atualiza e publica (ver 8a). O gabarito da competição fica fora
  do site público.
- As figuras são copiadas de `Aula_UV-vis/figs` e `estruturas` para dentro do site,
  otimizadas para celular.

## 8. Restrições

- Plano gratuito do Firebase (Spark): é preciso caber numa turma (~60 alunos) com
  competição ao vivo.
- Funcionar em celulares Android e iPhone comuns, inclusive em rede 4G instável.
- Todo o texto em português.
- Identidade visual alinhada à da aula (cores do PLANO.md).
- Os dados dos alunos (nome, matrícula) ficam só no Firebase do professor, e as regras de
  segurança impedem que um aluno leia os dados de outro.

## 8a. Decisões após a revisão (respostas do professor)

- **Competição protegida contra trapaça.** O gabarito da competição ao vivo **não** vai no
  site público. Ele fica numa área do Firebase que só o professor lê, e a tela do professor
  libera a resposta certa apenas quando a pergunta fecha. As respostas dos alunos levam o
  horário do servidor. As regras de segurança aceitam uma única resposta por aluno por
  pergunta, só enquanto a pergunta está aberta, e a tela do professor calcula a pontuação.
  Tudo continua no plano gratuito. Em casa e no grupo, a proteção do gabarito não é exigida.
- **Questões abertas do Workshop viram fechadas.** "Justifique" e "cite duas razões" são
  reescritas como múltipla escolha ou como resposta numérica, mantendo o conteúdo, com
  correção automática. O Desafio Plenário vira estruturas dadas com cálculo numérico.
- **Edição de perguntas pelo Claude.** As perguntas ficam em arquivos de texto organizados
  no repositório. O professor pede a alteração e o Claude atualiza e publica. Não há editor
  no site.
- **Fonte de verdade.** Quando o Workshop e os slides divergirem (ex.: `l` × `b`, ou
  incrementos de Woodward-Fieser), valem a notação e os valores dos slides da aula.

## 8b. Decisões do builder após a revisão (minhas, a conferir)

- **Casa:** tentativas ilimitadas. O "% de acerto" no painel conta a **primeira** tentativa,
  e a explicação aparece após cada resposta. Não há prazo.
- **Grupo:** quem responde é o celular da equipe, mas cada membro é registrado pelo nome e
  pela matrícula, e todos recebem os pontos. A equipe é formada por atividade.
- **Identidade:** os registros são unificados pela matrícula, mesmo se o aluno trocar de
  celular. Não há lista oficial da turma nesta versão.
- **Turmas:** cada registro leva um código de turma/semestre (ex.: `2026-2`) definido pelo
  professor, para separar turmas e semestres desde o início.

## 9. Escolhas do builder (registradas como decisão minha, ainda não aprovadas pelo professor)

- Site sem etapa de build (HTML + JavaScript + SDK do Firebase pelo CDN), para o professor
  conseguir mexer e publicar com facilidade.
- Firebase Realtime Database ou Firestore para a competição: a escolha é do builder,
  priorizando a latência do ranking ao vivo.
- Identificação do aluno: autenticação anônima do Firebase mais nome e matrícula.
- O site fica em `IMIA/plataforma-espectroscopia/` e vira um repositório GitHub próprio.

## 10. Deixado para o builder

- A estrutura de pastas e os nomes dos arquivos.
- A biblioteca de gráficos para os espectros (ou SVG/canvas próprio).
- A redação das perguntas novas, desde que cada uma seja conferida com a aula e as
  contas verificadas por script.
- O passo a passo de configuração do Firebase e do GitHub Pages para o professor.
