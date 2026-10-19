# Plataforma de Espectroscopia — Módulo UV-vis: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um site celular-primeiro (aberto por QR code) com competição ao vivo estilo Kahoot, atividades em grupo, exercícios para casa e simuladores de UV-vis, além de um painel do professor com acessos, pontuação e exportação em CSV.

**Architecture:** Site estático sem etapa de build (HTML + ES modules) em `public/`, publicado no GitHub Pages por uma GitHub Action. A lógica pura (física do UV-vis, correção, pontuação) fica em `public/js/core/*.js`, sem DOM nem Firebase, e é testada com `node --test`. Os dados ficam no Firestore e a autenticação no Firebase Auth: anônima para o aluno, Google para o professor. O gabarito da competição nunca vai para o site público. Ele é carregado pelo professor num documento do Firestore que só ele lê, e a tela do professor calcula a pontuação.

**Tech Stack:** HTML/CSS/JS (ES2022 modules); Firebase JS SDK 10.14.1 modular via `https://www.gstatic.com/firebasejs/10.14.1/`; QR com `qrcode-generator@1.4.4` (jsDelivr); Node 22 `node --test`; `firebase-tools@13.35.1` + `@firebase/rules-unit-testing@3.0.4` (dev, emulador do Firestore com o Java 11 local); GitHub Actions `actions/deploy-pages@v4`.

**Spec:** `docs/2026-10-18-uvvis-plataforma-design.md`

## Global Constraints

- Todo o texto da interface em português. Notação dos slides: `A = εbc`, `λmáx`, `ε`, `b`, `c`. Quando o Workshop divergir dos slides, valem os slides.
- Cores da aula: vermelho `#FF0000` = batocrômico; azul `#0070C0` = hipsocrômico; roxo `#7030A0` = hiper/hipo; verde `#00B050` = notas; caixa de equação amarela `#FFCC00`; subtítulos `#0070C0`/`#000099`.
- Celular primeiro: layout de 360 px de largura sem rolagem horizontal; alvos de toque ≥ 44 px.
- Pontuação: certa = `round(1000 × (1 − 0,5 × min(1, dt/T)))`; errada ou fora do tempo = 0; tempo padrão T = 20 s; desempate pela menor soma de `dt` das certas.
- Casa: tentativas ilimitadas; o painel conta a **primeira** tentativa. Grupo: todos os membros listados recebem o registro.
- Identidade do aluno: nome + matrícula, sem senha; o documento do aluno tem id `${turma}_${matricula}`. Turma vem do parâmetro `?t=` da URL (padrão em `config.js`: `TURMA_PADRAO = "2026-2"`).
- Professor: o login Google só tem acesso se o e-mail for `PROFESSOR_EMAIL` (em `public/js/config.js` e repetido em `firestore.rules`).
- Plano gratuito do Firebase (Spark): sem Cloud Functions.
- Arquivo do gabarito da competição: `privado/uvvis-competicao.json`, listado no `.gitignore`. Nunca é colocado dentro de `public/`.

## Review Focus

1. **Aluno com 4G instável na competição:** a conexão cai e volta no meio da rodada. Ele deve voltar à pergunta atual (o estado vem do `onSnapshot` da sala), sem tela branca, e sem poder responder duas vezes. Teste: regra que nega a segunda resposta (Task 4) e teste de UI de reconexão (Task 7, passo de verificação).
2. **Número digitado em formato brasileiro:** `0,523`, `3,0×10⁻⁵`, `3e-5`, `3,0 x 10^-5` devem ser aceitos; texto vazio ou "abc" vira "resposta inválida", sem contar como erro. Teste em Task 2.
3. **Resposta enviada depois do fim do tempo** (relógio do celular adiantado ou atrasado): a regra do Firestore compara com `request.time` do servidor, não com o relógio do aparelho. Teste em Task 4.
4. **Mesmo aluno em dois celulares / limpou o navegador:** os registros se unem pela matrícula. A competição usa o `uid` atual, e o placar mostra o nome. Teste em Task 4 (o aluno atualiza o próprio doc pelo id da matrícula).
5. **Professor fecha a aba do telão no meio da competição:** ao reabrir `professor.html#sala/CODIGO`, a competição continua da pergunta atual com o placar salvo. Teste em Task 7.

---

## Estrutura de arquivos

```
plataforma-espectroscopia/
  package.json                 # scripts: test, test:regras, servir
  firebase.json  firestore.rules  .firebaserc(exemplo)  .gitignore
  .github/workflows/pages.yml
  docs/CONFIGURAR.md           # passo a passo Firebase + GitHub Pages para o professor
  privado/uvvis-competicao.json   (gitignored)
  tests/  uvvis.test.mjs  correcao.test.mjs  pontuacao.test.mjs  conteudo.test.mjs  regras.test.mjs
  public/
    index.html                 # app do aluno
    professor.html             # telão + painel
    css/estilo.css
    js/config.js               # firebaseConfig, PROFESSOR_EMAIL, TURMA_PADRAO
    js/fb.js                   # init Firebase + todas as leituras/escritas
    js/core/uvvis.js           # física/química pura
    js/core/correcao.js        # parse BR + correção
    js/core/pontuacao.js       # pontos, placar, ranking
    js/ui/dom.js               # h() helper, toast, navegação por hash
    js/aluno/app.js  identificacao.js  menu.js  exercicios.js  competicao.js
    js/sim/grafico.js  beer.js  conjugacao.js  deslocamentos.js  curva.js  woodward.js
    js/prof/app.js  telao.js  painel.js  banco.js
    conteudo/uvvis/blocos.json  casa.json  grupo.json  img/*.png
```

## Formato do conteúdo (usado nas Tasks 3, 5, 7)

```jsonc
// questão
{ "id": "b4-03", "bloco": 4, "tipo": "mc" | "num" | "vf",
  "enunciado": "texto (pode ter <sub>, <sup>)", "figura": "img/E_beer_Ac_Ab.png" /*opcional*/,
  "alternativas": ["…","…"],            // mc
  "correta": 1,                          // mc: índice; vf: true/false
  "resposta": 3.0e-5, "tol": 0.02, "unidade": "mol L⁻¹",   // num
  "calc": { "fn": "concentracao", "args": [0.450, 15000, 1.0] },  // num: obrigatório, verificado no teste
  "explicacao": "frase curta, igual à aula" }
// casa.json:  { "modulo":"uvvis", "questoes":[…] }     (≥ 8 por bloco, blocos 1–10)
// grupo.json: { "modulo":"uvvis", "estacoes":[{ "id":"A", "titulo":"Lei de Beer-Lambert", "questoes":[…] }, … "E", "P"] }
// privado/uvvis-competicao.json: { "modulo":"uvvis", "questoes":[…só tipo "mc", ≥ 40, ≥ 4 por bloco] }
// blocos.json: [{ "n":1, "titulo":"Luz e espectro eletromagnético" }, … 10 itens]
```

## Modelo de dados no Firestore (usado nas Tasks 4, 5, 7, 8)

| caminho | quem escreve | quem lê | campos |
|---|---|---|---|
| `alunos/{turma}_{matricula}` | qualquer usuário autenticado (create/update) | professor | `nome, matricula, turma, primeiroAcesso, ultimoAcesso` (timestamps = `request.time`) |
| `acessos/{auto}` | autenticado, só create | professor | `turma, matricula, pagina, uid, quando == request.time` |
| `respostas/{auto}` | autenticado, só create | professor | `tipo:"casa"\|"grupo", turma, atividade, questaoId, bloco, correta:bool, tentativa:int≥1, equipe?:string, membros:[{nome,matricula}], uid, quando == request.time` |
| `bancos/{modulo}` | professor | professor | `questoes:[…]` (o JSON privado) |
| `salas/{codigo}` | professor | todos autenticados | `turma, modulo, estado:"lobby"\|"pergunta"\|"revelada"\|"fim", indice:int, total:int, limiteMs:int, pergunta:{enunciado, alternativas, figura?, bloco}, abertaEm, fechaEm, correta:int\|null (só preenchida em "revelada")` |
| `salas/{c}/jogadores/{uid}` | o próprio uid, só create | todos autenticados | `nome, matricula, entrouEm == request.time` |
| `salas/{c}/respostas/{indice}_{uid}` | o próprio uid, só create, com a sala em "pergunta", `indice == sala.indice`, `request.time < sala.fechaEm` | professor | `uid, indice, alternativa:int, quando == request.time` |
| `salas/{c}/placar/{uid}` | professor | todos autenticados | `nome, pontos, somaDtAcertos, acertos` |

`codigo` = 6 dígitos aleatórios. `fechaEm` = `abertaEm(cliente) + limiteMs + 1500` ms de folga.

---

### Task 1: Esqueleto do projeto + núcleo de cálculo UV-vis

**Files:**
- Create: `package.json`, `.gitignore`, `public/js/core/uvvis.js`, `tests/uvvis.test.mjs`

**Interfaces:**
- Produces (`public/js/core/uvvis.js`, todas exportadas):
  - `absorbancia(eps, b, c) -> number`; `concentracao(A, eps, b) -> number`; `transmitancia(A) -> number` (fração); `percentT(A) -> number`; `absDeT(T) -> number`
  - `energiaKJmol(lambdaNm) -> number` (E = hcN_A/λ)
  - `lambdaPolieno(nDuplas: 1..11) -> number` (nm; tabela: 1→171, 2→217, 3→258, 11→452 dos slides; interpolação linear entre 3 e 11)
  - `corComplementar(lambdaNm) -> { faixa: string, absorvida: string, observada: string, hexObservada: string }` (abaixo de 400 → `observada: "incolor"`; 6 faixas da roda: violeta 400–435→amarelo-esverdeado, azul 435–480→laranja, verde-azulado 480–500→vermelho, verde 500–560→púrpura, amarelo 560–595→azul, laranja/vermelho 595–800→verde-azulado)
  - `banda(lambda, lambdaMax, Amax, largura=25) -> number` (gaussiana)
  - `regressaoLinear(xs, ys) -> { a, b, r2, residuos: number[] }` (A = a·c + b)
  - `lod(s, a) -> number` = 3,3·s/a; `loq(s, a) -> number` = 10·s/a
  - `woodwardFieser(tipo: "dieno-hetero"|"dieno-homo"|"enona", inc: { extensao?, alquila?, exociclica?, alfa?, beta?, gamaDelta? }) -> number` (bases 214 / 253 / 215; extensao +30, alquila/resíduo de anel +5 (dieno), exociclica +5, alfa +10, beta +12, gamaDelta +18. **Confirmar as bases e os incrementos nos slides 61–65 de `../Aula_UV-vis/UV-vis_aula.pptx` antes de fixar.**)

- [ ] **Step 1: `git init`, criar `package.json`** (`"type":"module"`, scripts `"test": "node --test tests/"`, `"servir": "python3 -m http.server 8080 -d public"`) e um `.gitignore` com `node_modules/`, `privado/`, `.firebase/`, `*-debug.log`.
- [ ] **Step 2: Escrever `tests/uvvis.test.mjs`** com asserções que usam os números da aula:
  - `concentracao(0.450, 15000, 1.0)` ≈ `3.0e-5` (rel 1e-3); `percentT(0.450)` ≈ `35.5` (±0.05) — slide 23
  - `absorbancia(12000, 1.0, 2.5e-5)` = `0.300` — Estação A
  - `transmitancia(0.523)` ≈ `0.300` (±0.001)
  - `lambdaPolieno(1)=171`, `(2)=217`, `(3)=258`, `(11)=452`; estritamente crescente de 1 a 11
  - `corComplementar(452).observada === "laranja"`; `corComplementar(530).observada === "púrpura"`; `corComplementar(300).observada === "incolor"`
  - `regressaoLinear([0,1,2,3],[0.1,0.3,0.5,0.7])` → `a≈0.2, b≈0.1, r2≈1`
  - `woodwardFieser("dieno-hetero",{alquila:4}) === 234` (slide 62); `woodwardFieser("enona",{beta:1}) === 227`, `({beta:2}) === 239`, `({beta:2, exociclica:1}) === 244` (slide 65)
  - `lod(0.002, 0.0817)` ≈ `0.0808` (±1e-4)
- [ ] **Step 3: Rodar `npm test`.** Esperado: FALHA (módulo inexistente).
- [ ] **Step 4: Implementar `public/js/core/uvvis.js`** com as assinaturas acima (sem DOM).
- [ ] **Step 5: Rodar `npm test`.** Esperado: todos PASS.
- [ ] **Step 6: Commit** `feat: núcleo de cálculo UV-vis`.

### Task 2: Correção de respostas e pontuação

**Files:**
- Create: `public/js/core/correcao.js`, `public/js/core/pontuacao.js`, `tests/correcao.test.mjs`, `tests/pontuacao.test.mjs`

**Interfaces:**
- Produces (`correcao.js`): `parseNumeroBR(txt: string) -> number` (NaN se inválido; aceita vírgula decimal, espaços, `e`/`E`, `×10^`, `x10^`, `·10`, sobrescritos `⁻⁰¹²³⁴⁵⁶⁷⁸⁹`, `%` ignorado); `corrigir(questao, resposta) -> { valida: boolean, correta: boolean }` (mc: `resposta` é índice; vf: boolean; num: string → `|x − resposta| ≤ tol·|resposta|`, tol padrão 0.02).
- Produces (`pontuacao.js`): `pontosResposta({ correta: boolean, dtMs: number, limiteMs: number }) -> number`; `aplicarRodada(placar: Record<uid,{nome,pontos,somaDtAcertos,acertos}>, respostas: Array<{uid, alternativa, dtMs}>, correta: number, limiteMs: number, nomes: Record<uid,string>) -> novoPlacar` (puro, não muta a entrada); `ranking(placar) -> Array<{uid,nome,pontos,somaDtAcertos,acertos,posicao}>` (pontos desc, depois somaDtAcertos asc).

- [ ] **Step 1: Escrever os testes.**
  - parse: `"0,523"→0.523`; `"3,0×10⁻⁵"→3e-5`; `"3,0 x 10^-5"→3e-5`; `"3e-5"→3e-5`; `" 35,5 % "→35.5`; `""`→NaN; `"abc"`→NaN; `"1.234,5"`→NaN (ambíguo, rejeita).
  - corrigir num: resposta 3.0e-5 tol 0.02 → `"3,05e-5"` correta, `"3,1e-5"` incorreta, `"abc"` → `{valida:false, correta:false}`.
  - corrigir mc/vf: índice certo/errado; vf true/false.
  - pontos: `{correta:true,dtMs:0,limiteMs:20000}`→1000; `dtMs:20000`→500; `dtMs:10000`→750; `dtMs:25000`→500 (limitado); `{correta:false}`→0.
  - aplicarRodada: duas respostas (uma certa dt 2000, uma errada) atualizam pontos e acertos; um jogador sem resposta mantém os pontos; o placar de entrada não é alterado.
  - ranking: empate em pontos → menor `somaDtAcertos` primeiro; `posicao` começa em 1.
- [ ] **Step 2: `npm test`.** Esperado: FALHA nesses dois arquivos.
- [ ] **Step 3: Implementar os dois módulos.**
- [ ] **Step 4: `npm test`.** Esperado: PASS.
- [ ] **Step 5: Commit** `feat: correção numérica BR e pontuação estilo Kahoot`.

### Task 3: Conteúdo UV-vis (casa, grupo, competição) com gabarito verificado

**Files:**
- Create: `public/conteudo/uvvis/blocos.json`, `casa.json`, `grupo.json`, `privado/uvvis-competicao.json`, `public/conteudo/uvvis/img/*.png`, `tests/conteudo.test.mjs`, `tools/otimizar-imagens.sh`

**Interfaces:**
- Consumes: `uvvis.js` (para `calc`), `correcao.js` (`corrigir`).
- Produces: os arquivos no formato da seção "Formato do conteúdo".

- [ ] **Step 1: Escrever `tests/conteudo.test.mjs`.** Ele carrega os três JSON (o privado só se existir; se não existir, falha com a mensagem "crie privado/uvvis-competicao.json") e verifica:
  - ids únicos no conjunto; `bloco` ∈ 1..10; `explicacao` não vazia;
  - mc: 2–4 alternativas e `correta` dentro do intervalo; vf: `correta` boolean; num: `calc.fn` existe em `uvvis.js` e `|fn(...args) − resposta| ≤ tol·|resposta|`;
  - casa: ≥ 8 questões por bloco; competição: só mc, ≥ 40 no total, ≥ 4 por bloco, enunciado ≤ 140 caracteres, alternativa ≤ 60;
  - grupo: estações `A,B,C,D,E,P` presentes, nenhuma questão aberta (só `mc|num|vf`);
  - toda `figura` aponta para um arquivo existente em `public/conteudo/uvvis/`.
- [ ] **Step 2: `npm test`.** Esperado: FALHA (arquivos inexistentes).
- [ ] **Step 3: Copiar e otimizar as figuras.** `tools/otimizar-imagens.sh` usa `sips -Z 1000` (macOS) para copiar as figuras usadas de `../Aula_UV-vis/figs/` e `../Aula_UV-vis/estruturas/` para `public/conteudo/uvvis/img/`, com o lado maior em 1000 px.
- [ ] **Step 4: Escrever o conteúdo** a partir de `../Aula_UV-vis/UV-vis_aula.pptx` (texto dos 70 slides) e de `../UV-Vis_Workshop_Questoes.docx`:
  - `blocos.json`: os 10 títulos do roteiro do slide 4.
  - `grupo.json`: as Estações A–E e o Plenário, item por item. Contas viram `num` com `calc`; "justifique", "cite duas" e "escolha" viram `mc` com 4 alternativas plausíveis. O Plenário traz 3 estruturas de `estruturas/wf_*.png` e pede o λmáx numérico. Notação dos slides (`b`, não `l`).
  - `casa.json`: ≥ 8 por bloco, misturando mc, num e vf, com figuras da aula.
  - `privado/uvvis-competicao.json`: ≥ 4 mc por bloco, curtas para leitura no telão.
- [ ] **Step 5: `npm test`.** Esperado: PASS. Corrigir todo gabarito que o `calc` contradisser.
- [ ] **Step 6: Commit** `feat: conteúdo UV-vis (casa, grupo) e figuras` (o privado não entra no git).

### Task 4: Firebase — configuração, camada de dados e regras de segurança testadas

**Files:**
- Create: `firebase.json`, `firestore.rules`, `public/js/config.js`, `public/js/fb.js`, `tests/regras.test.mjs`
- Modify: `package.json` (devDeps `firebase-tools@13.35.1`, `@firebase/rules-unit-testing@3.0.4`, `firebase@10.14.1`; script `"test:regras": "firebase emulators:exec --only firestore --project demo-uvvis 'node --test tests/regras.test.mjs'"`)

**Interfaces:**
- Produces (`config.js`): `export const firebaseConfig = {…}` (placeholder `"COLE_AQUI"`), `PROFESSOR_EMAIL = "boniek@ufg.br"`, `TURMA_PADRAO = "2026-2"`, `USAR_EMULADOR = location.hostname === "localhost"`.
- Produces (`fb.js`, todas async, usam o SDK pelo CDN do gstatic):
  - `iniciar() -> { uid }` (login anônimo; conecta ao emulador se `USAR_EMULADOR`)
  - `entrarProfessor() -> { email }` (popup Google; lança `Error("acesso restrito")` se o e-mail ≠ `PROFESSOR_EMAIL`)
  - `salvarAluno({ nome, matricula, turma })`; `registrarAcesso({ turma, matricula, pagina })`
  - `salvarResposta({ tipo, turma, atividade, questaoId, bloco, correta, tentativa, equipe?, membros })`
  - Sala (aluno): `ouvirSala(codigo, cb) -> unsubscribe`; `entrarSala(codigo, { nome, matricula })`; `responder(codigo, indice, alternativa)`; `ouvirPlacar(codigo, cb) -> unsubscribe`
  - Sala (professor): `criarSala({ turma, modulo, limiteMs, total }) -> codigo`; `abrirPergunta(codigo, indice, pergunta)`; `respostasDaRodada(codigo, indice) -> Array<{uid, alternativa, quandoMs}>`; `revelar(codigo, correta, novoPlacar)` (um batch: estado "revelada" + placar); `encerrar(codigo)`; `ouvirJogadores(codigo, cb)`
  - Banco/painel (professor): `salvarBanco(modulo, questoes)`; `lerBanco(modulo) -> questoes`; `lerAlunos(turma)`; `lerAcessos(turma)`; `lerRespostas(turma)`

- [ ] **Step 1: Escrever `tests/regras.test.mjs`** com `initializeTestEnvironment({ projectId: "demo-uvvis", firestore: { rules } })`. Os testes cobrem:
  - aluno anônimo cria `alunos/2026-2_123` ✔; lê `alunos/2026-2_456` ✘; lê `respostas` ✘; lê `bancos/uvvis` ✘
  - aluno cria `acessos` com `quando == serverTimestamp()` ✔; com `quando` vindo do cliente ✘; update ✘
  - professor (token `email: "boniek@ufg.br", email_verified: true`) lê `bancos/uvvis`, `alunos` e `respostas` ✔; outro e-mail Google ✘
  - sala em "pergunta", indice 2, `fechaEm` no futuro: aluno cria `salas/111111/respostas/2_<uid>` ✔; segunda escrita no mesmo id ✘; id com uid de outro ✘; `indice` 1 ✘; sala em "revelada" ✘; `fechaEm` no passado ✘ (Review Focus 1, 3)
  - aluno lê `salas/111111` ✔, mas escreve nela ✘; aluno escreve `placar` ✘
  - o mesmo doc `alunos/2026-2_123` pode ser atualizado por um segundo uid anônimo (troca de celular) ✔ (Review Focus 4)
- [ ] **Step 2: `npm i` e `npm run test:regras`.** Esperado: FALHA.
- [ ] **Step 3: Escrever `firestore.rules`** conforme a tabela do modelo de dados. Função `isProf()` = `request.auth.token.email == "boniek@ufg.br" && request.auth.token.email_verified == true`. Nega tudo o que não estiver listado.
- [ ] **Step 4: `npm run test:regras`.** Esperado: PASS.
- [ ] **Step 5: Implementar `config.js` e `fb.js`.** Toda escrita de horário usa `serverTimestamp()`.
- [ ] **Step 6: Commit** `feat: Firebase, camada de dados e regras testadas`.

### Task 5: App do aluno — identificação, menu, exercícios de casa e de grupo

**Files:**
- Create: `public/index.html`, `public/css/estilo.css`, `public/js/ui/dom.js`, `public/js/aluno/app.js`, `identificacao.js`, `menu.js`, `exercicios.js`

**Interfaces:**
- Consumes: `fb.js` (`iniciar`, `salvarAluno`, `registrarAcesso`, `salvarResposta`), `correcao.js` (`corrigir`).
- Produces (`dom.js`): `h(tag, attrs, ...filhos) -> Element`; `toast(msg, tipo="ok"|"erro")`; `rotas(mapa: Record<string,(params)=>void>)` (hash router: `#menu`, `#casa/4`, `#grupo/A`, `#competicao`, `#sim/beer`…).
- Produces (`identificacao.js`): `obterAluno() -> {nome, matricula, turma} | null` (de `localStorage`, com try/catch); `telaIdentificacao(onOk)`.

- [ ] **Step 1: Escrever `identificacao.js` e `menu.js`.** Na primeira visita aparece um formulário com nome e matrícula (só dígitos, 6 a 12) e uma linha mostrando a turma. Depois vêm os 4 cartões grandes: Competição, Atividades em grupo, Exercícios para casa, Simuladores. Cada mudança de rota chama `registrarAcesso` com `pagina` = rota.
- [ ] **Step 2: Escrever `exercicios.js`.** `#casa` lista os 10 blocos com "x de n feitas". `#casa/N` mostra uma questão por tela. Depois de responder aparecem certo/errado e a explicação, e o aluno pode tentar de novo (tentativa+1, só a primeira conta no painel). `#grupo` lista as estações. `#grupo/X` pede antes o nome da equipe e os membros (o aluno atual + até 3 com nome e matrícula) e grava `salvarResposta` com `membros`. Resposta numérica inválida mostra "não entendi o número — use 0,52 ou 3,0e-5" e não grava nada (Review Focus 2).
- [ ] **Step 3: Escrever `estilo.css`** com as cores da aula como variáveis em `:root`, fonte do sistema, botões ≥ 44 px e largura máxima de 640 px centralizada.
- [ ] **Step 4: Verificar no navegador.** Rodar `npm run servir` e, num terminal ao lado, `npx firebase emulators:start --only firestore,auth --project demo-uvvis`. Abrir `http://localhost:8080/?t=2026-2` no Browser pane em 375×812 e fazer o fluxo: identificação → casa bloco 4 → errar uma num → ver a explicação → acertar. No emulator UI (porta 4000) devem aparecer `respostas` com `tentativa` 1 e 2 e os `acessos`. Também não pode haver rolagem horizontal (`document.documentElement.scrollWidth <= 375`).
- [ ] **Step 5: Commit** `feat: app do aluno com casa e grupo`.

### Task 6: Simuladores de espectro

**Files:**
- Create: `public/js/sim/grafico.js`, `beer.js`, `conjugacao.js`, `deslocamentos.js`, `curva.js`, `woodward.js`
- Modify: `public/js/aluno/menu.js` (cartão Simuladores → `#sim`, lista os 5)

**Interfaces:**
- Consumes: `uvvis.js` (todas), `dom.js` (`h`).
- Produces (`grafico.js`): `grafico(container, { xmin=200, xmax=800, ymax=1.2, rotX="λ (nm)", rotY="A" }) -> { desenhar(series: Array<{ pontos:[x,y][], cor, rotulo? }>), marcarX(x, cor, rotulo) }` (SVG próprio, responsivo por `viewBox`, faixa do visível colorida sob o eixo x).
- Cada simulador: `export function montar(container)`.

- [ ] **Step 1: `grafico.js` + `beer.js`.** Sliders ε (1 000–50 000), b (0,1–5 cm), c (0–1×10⁻⁴ mol L⁻¹). Mostra a cubeta com o feixe perdendo intensidade, A, %T e a caixa amarela `A = εbc` com os números. A banda em 450 nm cresce com A. Aviso em vermelho quando A > 1 ("fora da faixa de trabalho, diluir").
- [ ] **Step 2: `conjugacao.js`.** Slider de nº de C=C de 1 a 11 com a estrutura correspondente (eteno, butadieno, hexatrieno, β-caroteno quando houver imagem), o gap HOMO-LUMO num diagrama de níveis que encolhe, a banda em `lambdaPolieno(n)` e o quadrado de cor `corComplementar(λ)`.
- [ ] **Step 3: `deslocamentos.js`.** Banda base em 280 nm e quatro botões. Bato desloca +40 nm com a banda e a seta em vermelho. Hipso desloca −40 nm em azul. Hiper e hipo alteram a altura ×1,5 / ×0,6 em roxo. Uma legenda curta repete a frase dos slides 49–50.
- [ ] **Step 4: `curva.js`.** Gera 5 padrões (2–10 mg/L, a = 0,0817, b = −0,0031, ruído σ = 0,005). O aluno toca "medir" em cada padrão e o ponto aparece. Depois aparecem a reta, o R² e um gráfico de resíduos. Uma amostra com A = 0,47 pede a concentração, corrigida por `corrigir` contra `(A − b)/a` = 5,79 mg/L (slide 34). Um botão "faixa ampla" inclui padrões de 15 e 20 mg/L com curvatura, para mostrar resíduos sistemáticos.
- [ ] **Step 5: `woodward.js`.** O aluno escolhe a base (hetero, homo, enona) e há contadores de incrementos. O λ calculado sai de `woodwardFieser`, e os 3 exemplos dos slides 62–65 aparecem com o valor observado para comparar.
- [ ] **Step 6: Verificar no navegador** (375×812) cada simulador: o slider responde sem travar e os números batem com o slide 23 (ε 15 000, b 1, c 3×10⁻⁵ → A 0,450, %T 35,5). Commit `feat: simuladores de UV-vis`.

### Task 7: Competição ao vivo (aluno + telão do professor)

**Files:**
- Create: `public/professor.html`, `public/js/prof/app.js`, `telao.js`, `banco.js`, `public/js/aluno/competicao.js`

**Interfaces:**
- Consumes: `fb.js` (sala do aluno e do professor, `entrarProfessor`, `salvarBanco`, `lerBanco`), `pontuacao.js` (`aplicarRodada`, `ranking`), QR via `<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js">`.
- Produces: rota do professor `#sala/CODIGO` (retomável).

- [ ] **Step 1: `banco.js`.** Um botão "Carregar perguntas da competição" com `<input type=file>` lê `privado/uvvis-competicao.json`, valida (mc, `correta` no intervalo) e chama `salvarBanco("uvvis", questoes)`. Mostra quantas questões há por bloco.
- [ ] **Step 2: `telao.js`.** Escolha dos blocos (todos ou alguns), do nº de perguntas e de T (10/20/30 s) → `criarSala`. O lobby mostra o QR grande com `${origem}/index.html?t=${turma}#competicao/${codigo}`, o código em fonte grande e os nomes entrando (`ouvirJogadores`). "Começar" leva à pergunta, com o contador em barra e o número de respostas recebidas. Quando o tempo acaba ou todos respondem, a tela chama `respostasDaRodada`, calcula `dtMs = quandoMs − abertaEmMs` e aplica `aplicarRodada` e `revelar`. Em seguida mostra o gráfico de barras por alternativa, com a certa em verde, a explicação e o top 5. "Próxima" segue. Ao final aparece o **pódio top 3** grande, com um botão "mostrar ranking completo". Ao abrir `#sala/CODIGO`, a tela retoma pelo estado salvo (Review Focus 5).
- [ ] **Step 3: `competicao.js` (aluno).** `#competicao` pede o código (ou já vem pela URL) e chama `entrarSala`. Com `ouvirSala`, mostra "aguarde o professor" no lobby. Durante a pergunta aparecem 4 botões grandes coloridos (▲ ◆ ● ■ com texto), e o enunciado só aparece no celular se estiver ≤ 140 caracteres. Depois de tocar, os botões travam com "resposta enviada". Na revelação, o aluno vê certo/errado, os pontos ganhos e a posição. No fim, a posição final. Ao reconectar, a tela segue o estado atual da sala sem reenviar (Review Focus 1).
- [ ] **Step 4: Verificar com o emulador.** Abrir o professor em uma aba e 3 alunos em abas com `?t=2026-2`, cada um com um nome. Rodar 3 perguntas: o placar ordena certo, um aluno que tenta responder duas vezes vê a resposta travada, e fechar e reabrir a aba do professor retoma a sala. Também testar com o celular "offline" pelo DevTools por 5 s no meio da pergunta e voltar.
- [ ] **Step 5: Commit** `feat: competição ao vivo estilo Kahoot`.

### Task 8: Painel do professor (acessos, desempenho, CSV)

**Files:**
- Create: `public/js/prof/painel.js`, `public/js/core/painel-dados.js` (puro, sem Firebase, para rodar no Node)
- Modify: `public/js/prof/app.js` (abas: Competição | Painel | Perguntas)

**Interfaces:**
- Consumes: `fb.js` (`lerAlunos`, `lerAcessos`, `lerRespostas`).
- Produces (`core/painel-dados.js`): `montarLinhas(alunos, acessos, respostas) -> Array<{ matricula, nome, primeiroAcesso, ultimoAcesso, nAcessos, casaPctPorBloco: Record<1..10, number|null>, grupoAtividades: string[] }>` (pura, exportada) e `paraCSV(linhas) -> string` (separador `;`, vírgula decimal, BOM UTF-8 para abrir no Excel).

- [ ] **Step 1: Teste puro em `tests/painel.test.mjs`.** `montarLinhas` conta só a primeira tentativa por questão. Uma resposta de grupo com 3 membros aparece nos 3 alunos. Um aluno sem respostas tem `null` nos blocos. `paraCSV` começa com `﻿` e usa `;`.
- [ ] **Step 2: `npm test`** → FALHA; implementar; `npm test` → PASS.
- [ ] **Step 3: UI.** Seletor de turma, tabela ordenável (nome, último acesso, nº de acessos e % por bloco com cor de calor), filtro "acessou nos últimos 7 dias" e botão "Exportar CSV" (download via Blob).
- [ ] **Step 4: Verificar com os dados gerados nas Tasks 5 e 7 no emulador.** Commit `feat: painel do professor e exportação CSV`.

### Task 9: Publicação e guia de configuração

**Files:**
- Create: `.github/workflows/pages.yml`, `docs/CONFIGURAR.md`, `README.md`

- [ ] **Step 1: `pages.yml`.** Em push na `main`, `actions/upload-pages-artifact@v3` com `path: public` e depois `actions/deploy-pages@v4`. Só `public/` é publicado.
- [ ] **Step 2: `docs/CONFIGURAR.md`** com o passo a passo em português, com prints opcionais:
  1. criar o projeto no console Firebase;
  2. ativar Authentication → Anônimo e Google;
  3. criar o Firestore (região `southamerica-east1`);
  4. registrar o app Web e colar o `firebaseConfig` em `public/js/config.js`;
  5. colar `firestore.rules` em Firestore → Regras → Publicar;
  6. em Authentication → Domínios autorizados, adicionar `<usuario>.github.io`;
  7. criar o repositório no GitHub, ativar Pages com "GitHub Actions" e fazer push;
  8. em aula, abrir `professor.html`, carregar `privado/uvvis-competicao.json` e criar a sala.
- [ ] **Step 3: Verificação final.** `npm test` e `npm run test:regras` com tudo PASS. `npm run servir` + emulador com o fluxo completo (aluno casa → grupo → simulador → competição com 3 abas → painel → CSV abre no Numbers/Excel com acentos corretos).
- [ ] **Step 4: Commit** `docs: guia de configuração e deploy`. **Não** criar o repositório remoto nem fazer push sem pedir ao professor.
