# Aula de Espectrometria de Massas — Fase 1 (deck) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar `IMIA/Aula_EM/EM_aula.pptx`, a aula de 3 h (2 h teoria + 1 h exercícios) de espectrometria de massas, com todo o conteúdo do `TOPICO III.pptx`, espectros redesenhados a partir de números reais, slide de íons diagnósticos, exercícios resolvidos passo a passo e animações por clique, pronta para 2026-11-16.

**Architecture:** Cópia do pipeline da `IMIA/Aula_IV`: dados de picos em Python (`compostos_ms.py`) → figuras matplotlib (`figs/`) e estruturas RDKit (`estruturas/`) → `deck.js` (pptxgenjs) monta o pptx com slides reservados `ANIM:<nome>@x,y,w,h` → animações mpl (`animacoes/`) cortadas em clipes por `cut.py` e inseridas por `integrar.py`. Pasta sem git (como `Aula_IV`); o ponto de controle de cada tarefa é o build rodar limpo e o teste passar.

**Tech Stack:** Python 3.12 (matplotlib, numpy, RDKit, python-pptx, pytest), Node + pptxgenjs 4, ffmpeg, LibreOffice (`/Applications/LibreOffice.app/Contents/MacOS/soffice`) para PDF de revisão.

**Spec:** `plataforma-espectroscopia/docs/2026-11-15-em-aula-e-modulo-design.md` (§1–7, §12 Fase 1). Fontes: `IMIA/Tópico III - espectrometria de Massas/TOPICO III.pptx` e `.pdf` (74 slides). Molde: `IMIA/Aula_IV/` (`PLANO.md`, `build/`, `animacoes/`).

## Global Constraints

- Prazo: aula em **2026-11-16**. Ordem de prioridade quando o tempo apertar: Tarefas 1–6 e 9 são obrigatórias; 7 e 8 rendem o que der (animação que não ficar pronta vira figura estática no mesmo lugar).
- Estilo idêntico ao `Aula_IV/build/deck.js`: `LAYOUT_WIDE` 13,333 × 7,5 pol.; masters `CONTEUDO`, `SECAO`, `CAPA`; títulos Comic Sans MS, corpo Arial; azul `0070C0`, caixa de equação amarela `FFCC00` com borda preta; marcadores ✓.
- Cores dos espectros de massas (fixas na aula toda): picos comuns **preto** `#000000`; íon molecular **vermelho** `#FF0000`; pico base **azul** `#0070C0`; cluster isotópico M+1/M+2 **verde** `#00B050`; íon/perda diagnóstica destacada **laranja** `#E06C00`.
- Espectro de massas = barras verticais, eixo y "Abundância relativa (%)" 0–100 com pico base = 100, eixo x "m/z", rodapé pequeno com a fonte (`dados: slide NN do Tópico III` ou `dados: NIST WebBook`).
- Nenhuma imagem de espectro é copiada; só números. Exceções aprovadas: tabela periódica isotópica (slide 58), foto de McLafferty (59), capas de artigos (24, 29) e fotos de instrumento — reaproveitadas do pptx original como imagem, com crédito.
- Nenhum título ou figura do slide do problema entrega a resposta do exercício.
- Texto em português do Brasil; datas `AAAA-MM-DD`.
- Nada é escrito em `IMIA/Tópico III - espectrometria de Massas/` (fonte só leitura) nem em `IMIA/Aula_IV/`.

## Review Focus

1. **Picos fiéis aos números da fonte** — cada pico desenhado bate com a tabela do slide/NIST (m/z exato, intensidade ±0,5 %). Teste: `test_tabelas_do_slide_identicas` (Tarefa 2).
2. **Rótulos de m/z sobrepostos** em clusters densos (Br 79/81, 157/159, 198/200) — rótulos legíveis no projetor. Teste: `test_rotulos_sem_sobreposicao` (Tarefa 3).
3. **Resposta vazando no slide do problema** — o nome/estrutura só aparece nos slides de resolução. Teste: `check_deck.py` regra `sem_resposta_no_problema` (Tarefa 6).
4. **Conteúdo do original perdido** — cada um dos 74 slides originais mapeado para um slide novo ou marcado "fundido em NN". Teste: `check_deck.py` regra `mapeamento_completo` (Tarefa 5).
5. **Vídeo que não toca no PowerPoint** — clipes H.264/yuv420p, slide com o vídeo no lugar da figura. Verificação: `integrar.py` termina sem erro e o deck abre no PowerPoint (Tarefa 8).

---

### Task 1: Esqueleto da `Aula_EM`

**Files:**
- Create: `IMIA/Aula_EM/PLANO.md`, `IMIA/Aula_EM/build/{style.py,sizes.py,montage.py,package.json,deck.js}`, `IMIA/Aula_EM/animacoes/{anim.py,cut.py,integrar.py,pauses.toml}`
- Copy from: `IMIA/Aula_IV/build/{style.py,sizes.py,montage.py,package.json}`, `IMIA/Aula_IV/animacoes/{anim.py,cut.py,integrar.py}`

**Interfaces:**
- Produces: em `deck.js` os helpers do IV com as mesmas assinaturas — `slide(secao, titulo, notes)`, `anim(secao, titulo, key)`, `section(n, titulo, sub, notes)`, `img(s, rel, x, y, w, h, align)`, `fig(n)`, `mol(n)`, `eq(...)`, `bullets(...)`, `card(...)`, `note(...)`, `table(...)`; `style.py` com `save(fig, name)` e as constantes de cor + `MS_M`, `MS_BASE`, `MS_ISO`, `MS_DIAG`. `integrar.py` com `DECK = .../EM_aula.pptx`.

- [ ] **Step 1:** Copiar os arquivos listados; em `deck.js` manter só masters + helpers + capa (título "Espectrometria de Massas", subtítulo "Introdução aos Métodos Instrumentais de Análise", "Prof. Dr. Boniek Gontijo Vaz"); `pres.title = "Espectrometria de Massas"`; saída `../EM_aula.pptx`; tirar `LEG`/`legenda`/`grupo` (específicos do IV). Em `integrar.py` trocar `IV_aula.pptx` por `EM_aula.pptx`; `pauses.toml` vazio com o cabeçalho de comentários do IV.
- [ ] **Step 2:** `cd IMIA/Aula_EM/build && npm install` (pptxgenjs ^4.0.1).
- [ ] **Step 3:** Rodar `python3 sizes.py && NODE_PATH=$PWD/node_modules node deck.js`. Esperado: `EM_aula.pptx` com 1 slide, sem erro.
- [ ] **Step 4:** `PLANO.md` com status, "Como regerar" (mesmo bloco do IV com os nomes do EM) e a tabela de mapeamento slide original → slide novo (preenchida na Tarefa 5).

### Task 2: Dados de picos (`compostos_ms.py`)

**Files:**
- Create: `IMIA/Aula_EM/build/compostos_ms.py`, `IMIA/Aula_EM/build/test_compostos_ms.py`

**Interfaces:**
- Produces: `COMPOSTOS: dict[str, dict]`, chave = id em minúsculas sem acento (ex. `"butanona"`), valor `{"nome": str, "formula": str, "M": int, "picos": list[tuple[int, float]], "fonte": str, "rotulos": dict[int, str], "diag": list[int], "smiles": str}`. `picos` ordenado por m/z, pico base = 100.0. `fonte` = `"slide 72"` ou `"NIST WebBook"`.

Compostos (id → fonte):

| id | fonte | uso |
|---|---|---|
| `hexadecano` | NIST | slide 19 |
| `id61`, `id62` | ler picos do slide 61/62 (`TOPICO III.pdf`, zoom); identificar composto e confirmar no NIST | "quem é o M⁺·?" |
| `acetofenona` | NIST (o slide 60 mostra 120/105/77/51/43) | reconhecer M⁺· |
| `butanona` | tabela do slide 72 | regra do N (64) e exercício 4 |
| `hexilamina` | NIST | regra do N (64) |
| `bromometano` | NIST; conferir com slide 56 e Ex. 1a (66) | 56, 66 |
| `clorometano` | tabela do slide 71 | 57 e exercício 3 |
| `bromopiridina` | tabela do slide 67 + picos menores lidos da figura; isômero confirmado no NIST | Ex. 1b |
| `id68` | tabela do slide 68; identificar o C₁₀H₁₄ no NIST (134 M, 119 base) | Ex. 1c |
| `fluorometano` | tabela do slide 69 | exercício 1 |
| `butano` | tabela do slide 70 | exercício 2 |
| `propiofenona` | NIST; conferir com slide 73 (134, 105, 77, 51) | exercício 5 |
| `2-hexanona` | NIST; conferir com slide 74 (100, 85, 71, 58, 43) | exercício 6 |
| `octaalanina` | padrão isotópico calculado de C₂₄H₄₂N₈O₉ (slides 53–55) | isótopos |

NIST: espectro de EI do WebBook (`https://webbook.nist.gov/cgi/cbook.cgi?ID=<CAS>&Mask=200`, JCAMP em `.../cgi/cbook.cgi?JCAMP=<CAS>&Index=0&Type=Mass`); guardar no comentário o CAS. Picos < 1 % omitidos, exceto M, M+1, M+2.

- [ ] **Step 1: Testes que falham**

```python
from compostos_ms import COMPOSTOS
SLIDE = {  # copiados dos slides do Tópico III
  "fluorometano": {14: 3.4, 15: 20, 16: 0.2, 19: 2, 31: 10, 32: 9.8, 33: 94, 34: 100, 35: 1.1},
  "butano": {15: 15.3, 27: 37, 28: 32, 29: 44, 39: 12, 41: 27, 42: 12, 43: 100, 44: 3.2, 57: 2.3, 58: 12, 59: 0.5},
  "clorometano": {12: 3.3, 13: 5.4, 14: 8.4, 15: 72.4, 16: 1.0, 35: 6.2, 36: 1.6, 37: 1.9, 47: 7.1, 48: 3.4, 49: 11.4, 50: 100.0, 51: 3.8, 52: 31.0},
  "butanona": {26: 3.8, 27: 11.8, 28: 2.5, 29: 19.4, 41: 1.2, 42: 4.7, 43: 100.0, 44: 2.5, 57: 6.6, 71: 1.0, 72: 24.1, 73: 1.2},
  "bromopiridina": {78: 68.1, 79: 4.1, 157: 100.0, 158: 6.0, 159: 99.0, 160: 5.8},
}
def test_tabelas_do_slide_identicas():  # todo pico da tabela do slide está, com o mesmo valor
def test_pico_base_100():               # max(intensidade) == 100.0 em todos
def test_M_presente():                  # COMPOSTOS[k]["M"] está em picos (exceto quando M é ausente por natureza — nenhum aqui)
def test_regra_do_nitrogenio():         # M ímpar ⇔ nº de N ímpar na formula, para todos
def test_cloro_3_1():                   # clorometano: I(52)/I(50) entre 0,30 e 0,34
def test_bromo_1_1():                   # bromometano 96/94 e bromopiridina 159/157 entre 0,95 e 1,02
def test_mclafferty_2hexanona():        # 2-hexanona tem 58 ≥ 20 % e 43 = 100
def test_fonte_declarada():             # fonte começa com "slide " ou == "NIST WebBook"
```

- [ ] **Step 2:** `cd build && python3 -m pytest test_compostos_ms.py -q` → FAIL (`ModuleNotFoundError`).
- [ ] **Step 3:** Escrever `compostos_ms.py` com os 16 compostos e os SMILES. Para `id61`, `id62`, `id68`: registrar no comentário o raciocínio da identificação e o CAS.
- [ ] **Step 4:** Rodar os testes → PASS.

### Task 3: Espectros de massas e IV dos exercícios (`espectro_ms.py`, `figs_espectros.py`)

**Files:**
- Create: `IMIA/Aula_EM/build/espectro_ms.py`, `IMIA/Aula_EM/build/figs_espectros.py`, `IMIA/Aula_EM/build/test_espectro_ms.py`
- Reuse (import por caminho, sem copiar): `IMIA/Aula_IV/build/espectro.py`

**Interfaces:**
- Consumes: `COMPOSTOS` (Tarefa 2).
- Produces: `plot_ms(ax, comp: dict, destaque: dict[int, str] | None = None, rotular: list[int] | None = None, xlim: tuple | None = None) -> list[matplotlib.text.Text]` (desenha barras com as cores dos Global Constraints, devolve os rótulos); `figs/ms_<id>.png` (espectro limpo, sem nome do composto) e `figs/ms_<id>_resp.png` (com destaques coloridos) para cada composto; `figs/iv_ex2.png`, `iv_ex4.png`, `iv_ex5.png`, `iv_ex6.png` (IV simulado com as bandas anotadas nos slides 70, 72, 73, 74).

- [ ] **Step 1: Teste que falha** — `test_rotulos_sem_sobreposicao`: para `bromometano`, `bromopiridina`, `clorometano`, `id62`, desenhar com `rotular=None` (padrão: picos ≥ 10 % e M) e verificar que as bounding boxes dos `Text` devolvidos não se intersectam (`get_window_extent` após `fig.canvas.draw()`). `test_cores`: barra de M é `#FF0000`, pico base `#0070C0`.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `plot_ms` (barras `ax.vlines` largura 2,5, rótulos acima da barra; quando dois rótulos colidem, o menor sobe um nível) e `figs_espectros.py`. IV: bandas `(pos, abs, largura, forma)` com as posições **impressas** nos slides 72 (tabela de picos) e 73 (rótulos nas bandas); nos slides 70 e 74, que não trazem números, ler as posições da figura renderizada a 150 dpi e conferir com o Pavia (C–H 2960/2870, C=O 1715, CH₃ 1375, CH₂ 1465). Desenho via `espectro.py` do IV.
- [ ] **Step 4:** Testes → PASS; `python3 figs_espectros.py` gera os PNG; `python3 montage.py` e olhar a folha de contato.

### Task 4: Figuras esquemáticas e estruturas

**Files:**
- Create: `IMIA/Aula_EM/build/figs_instr.py`, `IMIA/Aula_EM/build/figs_interp.py`, `IMIA/Aula_EM/build/estruturas.py`, `IMIA/Aula_EM/build/extrair_original.py`

**Interfaces:**
- Produces: em `figs/`: `blocos`, `ei_fonte`, `maldi`, `esi`, `esi_gota`, `setor`, `quadrupolo`, `tof`, `iontrap`, `orbitrap`, `resolucao`, `detectores`, `massas_tipos`, `isotopos_classes`, `alanina_cluster`, `cl_br_padroes`, `alfa_clivagem`, `mclafferty`, `fluxograma`; em `estruturas/`: `<id>.png` + `.mol` para todos os compostos e as matrizes de MALDI (DHB, ácido sinapínico, α-CHCA); em `figs/orig/`: imagens extraídas do pptx original (`slide58_tabela.png`, `slide59_mclafferty.png`, artigos, fotos, Dumbo, peixe).

- [ ] **Step 1:** `extrair_original.py` lê `TOPICO III.pptx` com python-pptx e salva cada imagem como `figs/orig/slideNN_k.<ext>`; escolher manualmente as que entram (lista no topo do script).
- [ ] **Step 2:** `figs_instr.py` e `figs_interp.py` (estilo `style.py`). Valores: EI 70 eV; MALDI laser N₂ 337 nm, razão 100:1 a 5000:1; ESI ±4000 V, capilar, cone de Taylor; setor r = mv/(qB); quadrupolo U/V₀ constante; TOF E_c = zeV = mv²/2, t ∝ √(m/z); R = m/Δm; cluster de C₂₄H₄₂N₈O₉ com A+1 ≈ 25 % e 25/1,1 ≈ 23 C.
- [ ] **Step 3:** `estruturas.py` (RDKit, a partir de `smiles` de `COMPOSTOS`), estruturas pretas, sem destaque, para os slides de problema; versão com o fragmento em laranja para as resoluções (`<id>_resp.png`).
- [ ] **Step 4:** Rodar os três scripts, `sizes.py`, `montage.py`; inspecionar a folha de contato.

### Task 5: Deck — teoria (seções A–F e H)

**Files:**
- Modify: `IMIA/Aula_EM/build/deck.js`
- Create: `IMIA/Aula_EM/build/check_deck.py`, `IMIA/Aula_EM/build/mapa_original.json`

**Interfaces:**
- Consumes: figuras das Tarefas 3–4.
- Produces: slides em ordem do design §6 A–F e H; notas do apresentador em todo slide; slides reservados com `ANIM:<nome>@x,y,w,h` na primeira linha das notas para: `percurso`, `ei`, `maldi`, `esi`, `setor`, `quadrupolo`, `tof`, `detector`, `isotopos`, `mclafferty` — cada um mostra a figura estática equivalente até a Tarefa 8 trocar. `mapa_original.json` = `{"1": "s1", ..., "74": "s85"}` (slide original → slide novo, ou `"fundido:sNN"`).

- [ ] **Step 1: Teste que falha** — `check_deck.py` (python-pptx) com as regras: `mapeamento_completo` (as 74 chaves existem e apontam para slides existentes); `notas_em_todos`; `anims_reservadas` (os 10 nomes acima aparecem em notas `ANIM:`); `total_teoria` entre 55 e 70 slides antes da seção G.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Escrever as seções em `deck.js` seguindo o design §6, incluindo o slide de íons diagnósticos exatamente com as listas do §6.1 (duas colunas, cores do código, rodapé "Cl 3:1 · Br 1:1") e o fluxograma de interpretação. Gancho do Dumbo/peixe com as imagens de `figs/orig/`.
- [ ] **Step 4:** `python3 sizes.py && NODE_PATH=$PWD/node_modules node deck.js && python3 check_deck.py` → todas as regras OK.

### Task 6: Deck — exercícios (seção G)

**Files:**
- Modify: `IMIA/Aula_EM/build/deck.js`, `IMIA/Aula_EM/build/check_deck.py`

**Interfaces:**
- Consumes: `figs/ms_<id>.png`, `figs/ms_<id>_resp.png`, `figs/iv_ex*.png`, `estruturas/<id>_resp.png`.
- Produces: função `exercicio(n, enunciado, figs, passos, resposta)` em `deck.js` que gera 1 slide de problema + 1 slide por passo (cada slide repete o anterior e acrescenta um passo; avançar = um clique). Passos-padrão: ① M⁺· e paridade (regra do N) ② isótopos (M+1, M+2; Cl/Br) ③ regra dos 13 / fórmula ④ perdas e íons diagnósticos ⑤ estrutura (+ IV quando houver).

Ordem: slides 61, 62 → Ex. 1a, 1b, 1c → exercícios 1–6 (11 problemas).

- [ ] **Step 1: Teste que falha** — regra `sem_resposta_no_problema` em `check_deck.py`: no slide de problema (notas começam com `PROBLEMA:<id>`) não há texto com o nome do composto nem imagem `estruturas/<id>*`; regra `passos`: cada problema tem ≥ 3 slides de resolução e o último contém o nome do composto.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `exercicio(...)` e os 11 problemas com os passos escritos (notas do professor com o raciocínio completo).
- [ ] **Step 4:** Build + `check_deck.py` → OK.

### Task 7: Animações prioritárias — padrão isotópico e McLafferty

**Files:**
- Create: `IMIA/Aula_EM/animacoes/{emlib.py,isotopos.py,mclafferty.py}`; Modify: `animacoes/pauses.toml`

**Interfaces:**
- Consumes: `anim.py` (`Scene`, `steps`, `main`, `txt`, `arrow`, `rbox`, `circle`, `heading`), `COMPOSTOS`.
- Produces: `videos/isotopos.mp4`, `videos/mclafferty.mp4` + seções em `pauses.toml` com um comentário por pausa (vira nota do clique). `emlib.py`: `barras(x0, y0, w, h, picos, cores, a)` para desenhar espectro de barras no canvas.

Roteiros:
- `isotopos`: ① só ¹²C → um pico ② ¹³C 1,1 % → M+1 cresce com nº de C (1, 10, 24 C) ③ ³⁵Cl/³⁷Cl 75,8:24,2 → CH₃Cl 50/52 em 3:1 ④ ⁷⁹Br/⁸¹Br 50,7:49,3 → CH₃Br 94/96 1:1 ⑤ dois Cl (9:6:1) e dois Br (1:2:1) ⑥ conclusão "as relações entre os isótopos dão a composição".
- `mclafferty`: 2-hexanona; ① M⁺· m/z 100 ② H-γ destacado ③ estado de transição de seis membros ④ transferência do H e quebra da ligação α-β ⑤ enol radical-cátion m/z 58 + propeno neutro (42) ⑥ espectro com 58 em laranja e 43 (α-clivagem) em azul.

- [ ] **Step 1:** `python3 animacoes/isotopos.py --sheet` e `--draft`; conferir a folha das pausas (nenhuma pausa no meio de movimento — o `--sheet` sinaliza).
- [ ] **Step 2:** Render final; `python3 cut.py` gera os clipes.
- [ ] **Step 3:** Repetir para `mclafferty`.

### Task 8: Demais animações e integração no deck

**Files:**
- Create: `IMIA/Aula_EM/animacoes/{ei.py,quadrupolo.py,esi.py,tof.py,setor.py,maldi.py,detector.py,percurso.py}`; Modify: `pauses.toml`

Na ordem do §12 do design, até onde o tempo der: `ei` (elétron de 70 eV arranca elétron → M⁺· → fragmentos), `quadrupolo` (quatro barras, íon estável atravessa, instáveis colidem; muda U/V e outro m/z passa), `esi` (gota encolhe → limite de Rayleigh → fissão → íons em fase gasosa), `tof` (pulso, íons leves chegam antes, espectro se forma), `setor` (raios diferentes por m/z), `maldi` (pulso de laser, pluma de matriz + analito), `detector` (cascata de elétrons), `percurso` (íon atravessa fonte → analisador → detector).

- [ ] **Step 1:** Para cada animação: `--sheet` → render → registrar em `pauses.toml`.
- [ ] **Step 2:** `cd build && node deck.js && cd ../animacoes && python3 cut.py && python3 integrar.py`. Esperado: `integrar.py` sem erro; slides `ANIM:` sem vídeo continuam com a figura estática.
- [ ] **Step 3:** Abrir `EM_aula.pptx` no PowerPoint (`open -a "Microsoft PowerPoint"`) e tocar um slide animado de cada.

### Task 9: Revisão visual, PDF e registro

**Files:**
- Modify: `IMIA/Aula_EM/PLANO.md`, `~/GitHub/memoria/ensino/disciplinas-imia/HANDOFF.md`, `~/GitHub/memoria/diario.md`

- [ ] **Step 1:** `/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf --outdir /tmp/em EM_aula.pptx`, renderizar as páginas (PyMuPDF) e olhar todas em folhas de contato: texto cortado, sobreposição, figura distorcida, rótulo ilegível.
- [ ] **Step 2:** Corrigir o que aparecer, regerar, `check_deck.py` → OK.
- [ ] **Step 3:** `PLANO.md`: status com o nº de slides, quais animações entraram e quais ficaram estáticas, mapa original → novo. Handoff da memória: cabeçalho de 4 linhas com "Parei porque", etapa "Aula de EM (Fase 1)" com evidência `Aula_EM/EM_aula.pptx`; uma linha no diário; commit na memória.
- [ ] **Step 4:** Commit deste plano marcado como executado no ramo `feat/em` da plataforma.
