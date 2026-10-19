"""Problemas da atividade em grupo do IV (público sem resposta + resposta privada).
- public/conteudo/iv/grupo.json   fórmula, espectro (id opaco s…), pista, candidatas (@est:e…)  — sem nomes
- privado/iv-grupo.json           índice da correta, alvo, bandas-chave e resolução
Uso: python3 tools/iv/gerar-grupo.py   (depois de gerar.py)"""
import json, pathlib, random

RAIZ = pathlib.Path(__file__).resolve().parents[2]
priv = json.loads((RAIZ / "privado/iv-compostos.json").read_text())
C, X = priv["compostos"], priv["extras"]
P = [
 ("3-metil-2-butanona", ["3-metil-2-butanona", "2-pentanona", "3-pentanona", "pentanal", "ciclopentanol", "2-metilbutanal"],
  "A cadeia é ramificada e o composto não é oxidado pelo reagente de Tollens.",
  ["1715 cm⁻¹: C=O de cetona (forte)", "sem O–H (3300) e sem C–H de aldeído (2820/2720)", "1385/1365: dubleto de isopropila"],
  "I = 1 → uma C=O. C=O em 1715 sem 2820/2720 e sem O–H: cetona. Cetonas C₅H₁₀O: 2-pentanona, 3-pentanona e 3-metil-2-butanona; a pista (ramificada) e o dubleto 1385/1365 indicam a 3-metil-2-butanona."),
 ("hexanal", ["hexanal", "2-hexanona", "3-hexanona", "4-metil-2-pentanona", "ciclohexanol", "hex-5-en-1-ol"], "Cadeia linear, sem ramificação.",
  ["1730 cm⁻¹: C=O", "2820 e 2720: C–H de aldeído (dubleto de Fermi)", "sem O–H"],
  "I = 1. C=O em 1730 com o par 2820/2720 só aparece em aldeído; com cadeia linear, é o hexanal."),
 ("3-hexanol", ["3-hexanol", "1-hexanol", "dipropil_eter", "butil_etil_eter", "2-metil-2-pentanol"], "A oxidação branda dá uma cetona; a cadeia não é ramificada.",
  ["3360 cm⁻¹: O–H larga (ligação de H)", "1115: C–O de álcool secundário", "sem C=O"],
  "I = 0 (sem C=O, sem anel). O–H larga + C–O: álcool (não éter). Oxidação a cetona → álcool secundário; sem ramificação → 3-hexanol (C–O em ~1100, típico de secundário)."),
 ("propanoato_etila", ["propanoato_etila", "acido_pentanoico", "acetato_propila", "butanoato_metila", "4-hidroxi-2-pentanona"], "A hidrólise produz etanol e ácido propanoico.",
  ["1740 cm⁻¹: C=O de éster", "1190: C–O forte", "sem O–H"],
  "I = 1. C=O em 1740 + C–O forte, sem O–H: éster (não ácido nem hidroxicetona). Os três ésteres C₅H₁₀O₂ têm IV parecido; a hidrólise (etanol + ácido propanoico) define o propanoato de etila."),
 ("acido_isobutirico", ["acido_isobutirico", "acido_butanoico", "acetato_etila", "propanoato_metila", "dioxano", "3-hidroxibutanona"], "Cadeia ramificada.",
  ["3300–2500 cm⁻¹: O–H larguíssima de ácido", "1705: C=O", "1385: isopropila"],
  "I = 1. O–H enorme de 3300 a 2500 cobrindo o C–H, com C=O em 1705: ácido carboxílico. Ácidos C₄H₈O₂: butanoico e 2-metilpropanoico; ramificado → ácido 2-metilpropanoico."),
 ("pentilamina", ["pentilamina", "n-metilbutilamina", "dimetilpropilamina", "2-pentanamina"], "O nitrogênio está na ponta de uma cadeia linear.",
  ["3370 e 3300 cm⁻¹: duas N–H (amina primária)", "1610: deformação N–H", "sem C=O"],
  "I = 0. Duas N–H → amina primária (exclui N-metilbutilamina, secundária, e dimetilpropilamina, terciária). N na ponta da cadeia linear → pentilamina (1-pentanamina)."),
 ("cinamaldeido", ["cinamaldeido", "indanona", "3-fenil-2-propin-1-ol", "4-vinilbenzaldeido"], "Dá o aroma da canela; a C=C fica entre o anel e o grupo funcional.",
  ["1680 cm⁻¹: C=O conjugada", "2815 e 2740: C–H de aldeído", "1625: C=C conjugada; 1600/1500 e 750/690: anel monossubstituído"],
  "I = 6 (anel = 4, C=C, C=O). C=O em 1680 com 2815/2740: aldeído conjugado. Monossubstituído (750/690) e C=C entre anel e CHO → cinamaldeído (não o 4-vinilbenzaldeído, para-dissubstituído)."),
 ("hexanonitrila", ["hexanonitrila", "4-metilpentanonitrila", "2-metilpentanonitrila", "hex-5-in-1-amina"], "Cadeia linear.",
  ["2245 cm⁻¹: C≡N (fina)", "sem N–H e sem ≡C–H (3300)", "sem C=O"],
  "I = 2 (uma tripla). C≡N em 2245 sem N–H nem ≡C–H em 3300: nitrila (não a alcinilamina). Cadeia linear → hexanonitrila."),
]
pub, privado = [], []
for n, (alvo, cands, pista, bandas, res) in enumerate(P, 1):
    form = C[alvo]["formula"]
    for c in cands:
        assert (C.get(c) or X.get(c))["formula"] == form, (alvo, c)
    random.seed(n * 7)
    ordem = cands[:]
    random.shuffle(ordem)
    est = lambda c: (C.get(c) or X.get(c))["estId"]
    pub.append(dict(n=n, formula=form, espectro=C[alvo]["espId"], pista=pista, candidatas=["@est:" + est(c) for c in ordem]))
    privado.append(dict(n=n, alvo=alvo, correta=ordem.index(alvo), bandasChave=bandas, resolucao=res))
(RAIZ / "public/conteudo/iv/grupo.json").write_text(json.dumps({"modulo": "iv", "problemas": pub}, ensure_ascii=False, indent=1))
(RAIZ / "privado/iv-grupo.json").write_text(json.dumps({"modulo": "iv-grupo", "problemas": privado}, ensure_ascii=False, indent=1))
print("ok", [p["formula"] for p in pub])
