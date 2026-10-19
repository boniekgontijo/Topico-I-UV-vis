"""Biblioteca de compostos do módulo IV: SMILES + bandas (cm⁻¹, absorbância, meia-largura, forma) + diagnóstico.

Posições: Pavia (Tab. 2.3/2.4) e Tópico II; os 20 compostos da aula (Aula_IV/build/compostos.py) mantêm as bandas.
Espectros ESQUEMÁTICOS: intensidades relativas aproximadas. Forma "g" = gaussiana (bandas largas de O–H/N–H
com ligação de H); demais = lorentzianas. A impressão digital (ruído) é acrescentada em gerar.py pela semente.

familia: hidrocarboneto | oxigenado | carbonila | nitrogenado  (usada para montar distratores)
grupo=True: reservado para a atividade em grupo — nunca entra nas questões de sala/casa.
"""


def sp3(a=1.0, cadeia=False):
    """C–H sp³ (estiramento + deformação); a = intensidade relativa."""
    b = [(2960, a, 10), (2930, 1.15 * a, 10), (2872, 0.55 * a, 9), (2858, 0.6 * a, 9), (1465, 0.45, 9), (1378, 0.3, 6)]
    return b + ([(722, 0.18, 6)] if cadeia else [])


def ar(mono=True):
    """Anel aromático: C–H Ar, sobretons, C=C do anel, C–H fora do plano (mono: 750 + 690)."""
    b = [(3062, 0.3, 8), (3030, 0.35, 8), (1950, 0.07, 9), (1870, 0.06, 9), (1600, 0.5, 6), (1495, 0.7, 5), (1455, 0.5, 6)]
    return b + ([(750, 1.1, 7), (695, 1.0, 6)] if mono else [(820, 1.0, 7)])


OH_ALCOOL = (3330, 1.1, 130, "g")
OH_ACIDO = [(3020, 1.0, 280, "g"), (2650, 0.15, 60, "g")]
ALDEIDO_CH = [(2820, 0.25, 8), (2720, 0.3, 8)]

C = {}


def add(id_, nome, smiles, funcao, familia, bandas, diagnostico, seed, grupo=False):
    C[id_] = dict(nome=nome, smiles=smiles, funcao=funcao, familia=familia, bandas=bandas,
                  diagnostico=diagnostico, seed=seed, grupo=grupo)


# ---------------- hidrocarbonetos ----------------
add("octano", "octano", "CCCCCCCC", "alcano", "hidrocarboneto", sp3(1.1, True),
    "Só C–H sp³ (2960–2850) e deformações de CH₂/CH₃ (1465, 1375): alcano, sem nenhum grupo funcional.", 1)
add("hexano", "hexano", "CCCCCC", "alcano", "hidrocarboneto", sp3(1.0, True),
    "Só C–H sp³ (2960–2850) e CH₂/CH₃ (1465, 1375): alcano.", 31)
add("ciclohexano", "ciclo-hexano", "C1CCCCC1", "alcano", "hidrocarboneto",
    [(2928, 1.3, 10), (2853, 1.0, 9), (1450, 0.6, 8), (905, 0.2, 6)],
    "C–H sp³ e CH₂ em 1450, sem CH₃ (falta 1375) e sem grupo funcional: cicloalcano.", 32)
add("1-hexeno", "1-hexeno", "C=CCCCC", "alceno", "hidrocarboneto",
    [(3080, 0.4, 9)] + sp3(1.0) + [(1642, 0.45, 7), (1822, 0.1, 9), (993, 0.7, 6), (910, 1.0, 6)],
    "=C–H acima de 3000 (3080), C=C em 1640 e =CH₂ fora do plano (990, 910): alceno terminal.", 2)
add("ciclohexeno", "ciclo-hexeno", "C1=CCCCC1", "alceno", "hidrocarboneto",
    [(3025, 0.45, 9), (2930, 1.2, 10), (2860, 0.8, 9), (1655, 0.25, 7), (1438, 0.5, 8), (720, 0.9, 10)],
    "=C–H em 3025 (acima de 3000), C=C fraca em 1655 e C–H cis fora do plano (720): alceno.", 33)
add("1-octino", "1-octino", "C#CCCCCCC", "alcino", "hidrocarboneto",
    [(3312, 1.1, 11)] + sp3(1.0) + [(2120, 0.3, 7), (630, 1.0, 14), (1250, 0.15, 10)],
    "≡C–H fina e forte em 3300 e C≡C em 2120: alcino terminal.", 3)
add("1-hexino", "1-hexino", "C#CCCCC", "alcino", "hidrocarboneto",
    [(3310, 1.1, 11)] + sp3(0.9) + [(2118, 0.3, 7), (635, 1.0, 14)],
    "≡C–H em 3300 (fina) e C≡C em 2120: alcino terminal.", 34)
add("tolueno", "tolueno", "Cc1ccccc1", "aromatico", "hidrocarboneto",
    ar() + [(2920, 0.4, 10), (2870, 0.22, 9), (1380, 0.15, 6), (1030, 0.25, 6)],
    "C–H aromático (3030), C=C do anel (1600, 1500), sobretons e 730/690 (monossubstituído): aromático.", 4)
add("etilbenzeno", "etilbenzeno", "CCc1ccccc1", "aromatico", "hidrocarboneto",
    ar() + [(2965, 0.6, 10), (2932, 0.45, 10), (2875, 0.3, 9), (1380, 0.2, 6)],
    "C–H aromático acima de 3000, C=C do anel em 1600/1495 e 750/695: aromático monossubstituído.", 35)
add("1-clorobutano", "1-clorobutano", "ClCCCC", "haleto", "hidrocarboneto",
    sp3(1.0) + [(1290, 0.4, 8), (730, 0.9, 10), (655, 0.8, 9)],
    "Só C–H sp³ e uma banda forte de C–Cl em 730–650; nenhum O–H, C=O ou N–H: haleto de alquila.", 36)
add("1-bromobutano", "1-bromobutano", "BrCCCC", "haleto", "hidrocarboneto",
    sp3(1.0) + [(1250, 0.5, 8), (645, 0.9, 10), (560, 0.7, 9)],
    "Só C–H sp³ e C–Br forte abaixo de 690: haleto de alquila.", 37)

# ---------------- álcoois, fenóis, éteres ----------------
add("1-hexanol", "1-hexanol", "CCCCCCO", "alcool", "oxigenado",
    [OH_ALCOOL] + sp3(1.0) + [(1058, 1.1, 12), (1120, 0.2, 8), (660, 0.3, 50, "g")],
    "O–H larga e arredondada em 3330 (ligação de H) e C–O em 1060: álcool primário.", 5)
add("1-butanol", "1-butanol", "CCCCO", "alcool", "oxigenado",
    [OH_ALCOOL] + sp3(0.9) + [(1072, 1.0, 12), (1030, 0.6, 10)],
    "O–H larga em 3330 e C–O em 1070: álcool primário.", 38)
add("2-butanol", "2-butanol", "CCC(C)O", "alcool", "oxigenado",
    [(3350, 1.1, 130, "g")] + sp3(1.0) + [(1110, 1.0, 12), (995, 0.5, 9)],
    "O–H larga em 3350 e C–O em 1110: álcool secundário.", 39)
add("ciclohexanol", "ciclo-hexanol", "OC1CCCCC1", "alcool", "oxigenado",
    [(3340, 1.1, 130, "g"), (2930, 1.3, 10), (2855, 0.9, 9), (1450, 0.5, 8), (1070, 1.0, 12), (970, 0.4, 8)],
    "O–H larga em 3340 e C–O em 1070, sem C=O: álcool (secundário, cíclico).", 40)
add("ciclopentanol", "ciclopentanol", "OC1CCCC1", "alcool", "oxigenado",
    [(3340, 1.1, 130, "g"), (2960, 1.0, 10), (2870, 0.7, 9), (1440, 0.4, 8), (1060, 0.9, 12), (990, 0.5, 8)],
    "O–H larga em 3340 e C–O em 1060: álcool.", 41)
add("fenol", "fenol", "Oc1ccccc1", "fenol", "oxigenado",
    [(3250, 1.0, 140, "g"), (3040, 0.3, 10), (1595, 0.8, 7), (1498, 0.9, 6), (1475, 0.6, 6), (1360, 0.5, 12),
     (1230, 1.1, 12), (810, 0.4, 7), (752, 1.2, 7), (690, 1.0, 6)],
    "O–H larga em 3250 junto com C=C aromático (1600, 1500) e C–O em 1230: fenol.", 6)
add("p-cresol", "p-cresol", "Cc1ccc(O)cc1", "fenol", "oxigenado",
    [(3260, 1.0, 140, "g"), (3025, 0.25, 9), (2920, 0.3, 10), (1615, 0.6, 7), (1515, 1.0, 6), (1235, 1.1, 12),
     (815, 1.0, 7)],
    "O–H larga (3260), anel aromático (1615, 1515), C–O em 1235 e 815 (para-dissubstituído): fenol.", 42)
add("anisol", "anisol", "COc1ccccc1", "eter", "oxigenado",
    [(3062, 0.25, 8), (3030, 0.25, 8), (2955, 0.3, 9), (2835, 0.35, 9), (1600, 0.7, 6), (1497, 0.9, 6),
     (1470, 0.5, 6), (1247, 1.4, 12), (1040, 1.0, 10), (1175, 0.3, 6), (752, 1.1, 7), (690, 0.9, 6)],
    "Sem O–H e sem C=O; C–O forte em 1250 e 1040 com anel aromático: éter aromático.", 7)
add("dietil_eter", "éter dietílico", "CCOCC", "eter", "oxigenado",
    sp3(1.0) + [(1125, 1.5, 14), (1075, 0.5, 8), (845, 0.2, 7)],
    "Sem O–H e sem C=O; só C–H sp³ e C–O forte em 1120: éter.", 43)
add("dibutil_eter", "éter dibutílico", "CCCCOCCCC", "eter", "oxigenado",
    sp3(1.2, True) + [(1120, 1.5, 14), (1050, 0.3, 8)],
    "Só C–H sp³ e C–O–C forte em 1120, sem O–H nem C=O: éter.", 44)
add("thf", "tetra-hidrofurano", "C1CCOC1", "eter", "oxigenado",
    [(2975, 1.0, 10), (2865, 1.1, 9), (1460, 0.4, 8), (1070, 1.5, 12), (910, 0.7, 8)],
    "C–O–C forte em 1070, sem O–H e sem C=O: éter (cíclico).", 45)

# ---------------- carbonílicos ----------------
add("nonanal", "nonanal", "CCCCCCCCC=O", "aldeido", "carbonila",
    sp3(1.2, True) + [(2815, 0.25, 8), (2717, 0.3, 8), (1728, 1.5, 10), (1390, 0.25, 7)],
    "C=O em 1730 e o dubleto de C–H de aldeído (2820, 2720): aldeído.", 9)
add("pentanal", "pentanal", "CCCCC=O", "aldeido", "carbonila",
    sp3(1.0) + ALDEIDO_CH + [(1730, 1.5, 10), (1390, 0.2, 7)],
    "C=O em 1730 e C–H de aldeído em 2820 e 2720: aldeído.", 46)
add("butanal", "butanal", "CCCC=O", "aldeido", "carbonila",
    sp3(0.9) + ALDEIDO_CH + [(1728, 1.5, 10)],
    "C=O em 1730 com o par 2820/2720 (C–H de aldeído): aldeído.", 47)
add("benzaldeido", "benzaldeído", "O=Cc1ccccc1", "aldeido", "carbonila",
    ar() + [(2820, 0.3, 8), (2738, 0.3, 8), (1703, 1.6, 10), (1205, 0.4, 8)],
    "C=O em 1700 (conjugada com o anel), C–H de aldeído (2820, 2740) e anel aromático: aldeído aromático.", 48)
add("2-pentanona", "2-pentanona", "CCCC(C)=O", "cetona", "carbonila",
    [(2962, 1.0, 10), (2935, 0.7, 10), (2875, 0.5, 9), (3410, 0.08, 18), (1717, 1.7, 10), (1460, 0.4, 8),
     (1410, 0.35, 7), (1362, 0.8, 6), (1235, 0.25, 7), (1170, 0.75, 8), (960, 0.15, 7), (720, 0.12, 6)],
    "C=O forte em 1715 sem O–H e sem C–H de aldeído: cetona.", 18)
add("3-pentanona", "3-pentanona", "CCC(=O)CC", "cetona", "carbonila",
    [(2975, 1.0, 10), (2940, 0.7, 10), (2880, 0.5, 9), (3410, 0.08, 18), (1715, 1.7, 10), (1460, 0.5, 8),
     (1415, 0.4, 7), (1378, 0.4, 6), (1110, 0.4, 8), (940, 0.3, 7)],
    "C=O forte em 1715, sem O–H e sem 2820/2720: cetona.", 8)
add("2-butanona", "2-butanona", "CCC(C)=O", "cetona", "carbonila",
    [(2980, 0.8, 10), (2940, 0.5, 10), (3415, 0.08, 18), (1716, 1.7, 10), (1365, 0.8, 6), (1172, 0.8, 8)],
    "C=O em 1715 e nada de O–H ou C–H de aldeído: cetona.", 49)
add("ciclohexanona", "ciclo-hexanona", "O=C1CCCCC1", "cetona", "carbonila",
    [(2940, 1.2, 10), (2862, 0.8, 9), (3410, 0.08, 18), (1712, 1.7, 10), (1450, 0.5, 8), (1222, 0.4, 8),
     (1118, 0.4, 8)],
    "C=O em 1715 (anel de 6 sem tensão), sem O–H e sem C–H de aldeído: cetona.", 50)
add("ciclohexenona", "ciclo-hex-2-enona", "O=C1CCCC=C1", "cetona_conjugada", "carbonila",
    [(3040, 0.25, 9), (2945, 0.8, 10), (2870, 0.5, 9), (1680, 1.7, 10), (1617, 0.5, 7), (1250, 0.4, 8)],
    "C=O em 1680 (abaixo de 1715: conjugada com C=C) e C=C em 1617: cetona α,β-insaturada.", 51)
add("acetofenona", "acetofenona", "CC(=O)c1ccccc1", "cetona_conjugada", "carbonila",
    ar() + [(3005, 0.2, 9), (1686, 1.7, 10), (1360, 0.7, 6), (1265, 1.0, 10)],
    "C=O em 1685 (conjugada com o anel) e anel aromático; sem C–H de aldeído: cetona aromática.", 52)
add("metil_vinil_cetona", "3-buten-2-ona", "C=CC(C)=O", "cetona_conjugada", "carbonila",
    [(3095, 0.3, 9), (2990, 0.3, 10), (1685, 1.6, 10), (1620, 0.6, 7), (1360, 0.6, 6), (960, 0.6, 7)],
    "C=O em 1685 e C=C em 1620: cetona conjugada com dupla.", 53)
add("acido_propanoico", "ácido propanoico", "CCC(=O)O", "acido", "carbonila",
    OH_ACIDO + [(2985, 0.35, 10), (2945, 0.25, 10), (1712, 1.7, 14), (1465, 0.4, 8), (1415, 0.5, 9),
                (1240, 0.9, 15), (935, 0.5, 20)],
    "O–H muito larga de 3300 a 2500 (cobre o C–H) junto com C=O em 1710: ácido carboxílico.", 10)
add("acido_butanoico", "ácido butanoico", "CCCC(=O)O", "acido", "carbonila",
    OH_ACIDO + [(2968, 0.4, 10), (2935, 0.3, 10), (2878, 0.25, 10), (1710, 1.7, 14), (1460, 0.35, 8),
                (1413, 0.45, 9), (1290, 0.5, 12), (1215, 0.7, 14), (940, 0.5, 20)],
    "O–H muito larga (3300–2500) e C=O em 1710: ácido carboxílico.", 19)
add("acido_pentanoico", "ácido pentanoico", "CCCCC(=O)O", "acido", "carbonila",
    OH_ACIDO + [(2960, 0.45, 10), (2935, 0.4, 10), (2875, 0.3, 10), (1710, 1.7, 14), (1415, 0.45, 9),
                (1280, 0.6, 12), (1230, 0.6, 14), (940, 0.5, 20)],
    "O–H larguíssima de ácido (3300–2500) com C=O em 1710: ácido carboxílico.", 54)
add("acido_benzoico", "ácido benzoico", "OC(=O)c1ccccc1", "acido", "carbonila",
    OH_ACIDO + [(3070, 0.2, 8), (1688, 1.7, 14), (1602, 0.5, 6), (1455, 0.5, 6), (1292, 0.9, 12), (935, 0.5, 20),
                (710, 1.0, 8)],
    "O–H larga de ácido (3300–2500), C=O em 1690 (conjugada) e anel aromático: ácido aromático.", 55)
add("acetato_etila", "acetato de etila", "CCOC(C)=O", "ester", "carbonila",
    [(2985, 0.5, 10), (2940, 0.3, 9), (3460, 0.06, 18), (1742, 1.7, 10), (1447, 0.35, 7), (1373, 0.6, 6),
     (1240, 1.6, 14), (1047, 1.0, 10), (938, 0.2, 6), (848, 0.15, 6)],
    "C=O em 1740 (acima da cetona) e C–O forte em 1240 e 1050: éster.", 11)
add("propanoato_metila", "propanoato de metila", "CCC(=O)OC", "ester", "carbonila",
    [(2985, 0.5, 10), (2955, 0.45, 10), (1740, 1.7, 10), (1440, 0.5, 7), (1200, 1.4, 14), (1085, 0.6, 9)],
    "C=O em 1740 e C–O forte em 1200: éster.", 56)
add("acetato_butila", "acetato de butila", "CCCCOC(C)=O", "ester", "carbonila",
    sp3(1.0) + [(1740, 1.7, 10), (1372, 0.6, 6), (1240, 1.6, 14), (1040, 0.9, 10)],
    "C=O em 1740 e C–O em 1240/1040, sem O–H: éster (acetato).", 57)
add("benzoato_metila", "benzoato de metila", "COC(=O)c1ccccc1", "ester", "carbonila",
    ar() + [(2955, 0.25, 9), (1722, 1.7, 10), (1280, 1.5, 14), (1112, 1.0, 10)],
    "C=O em 1720 (éster conjugado) e C–O forte em 1280 e 1110, com anel: éster aromático.", 58)
add("butirolactona", "γ-butirolactona", "O=C1CCCO1", "lactona", "carbonila",
    [(2990, 0.4, 10), (2920, 0.3, 10), (1770, 1.7, 10), (1170, 1.3, 12), (1040, 0.8, 9)],
    "C=O em 1770 (éster cíclico de 5 membros, com tensão) e C–O em 1170: lactona.", 59)
add("anidrido_acetico", "anidrido acético", "CC(=O)OC(C)=O", "anidrido", "carbonila",
    [(3030, 0.15, 9), (2940, 0.15, 9), (1825, 1.3, 9), (1760, 1.6, 10), (1370, 0.6, 6), (1125, 1.3, 12),
     (995, 0.8, 9)],
    "Duas C=O (1825 e 1760) e C–O forte em 1125: anidrido.", 60)
add("anidrido_propanoico", "anidrido propanoico", "CCC(=O)OC(=O)CC", "anidrido", "carbonila",
    sp3(0.6) + [(1818, 1.3, 9), (1752, 1.6, 10), (1040, 1.3, 12)],
    "Par de C=O em 1820 e 1750 e C–O em 1040: anidrido.", 61)
add("cloreto_butanoila", "cloreto de butanoíla", "CCCC(Cl)=O", "cloreto_acila", "carbonila",
    sp3(0.8) + [(1800, 1.7, 10), (960, 0.6, 9), (690, 0.6, 9)],
    "C=O muito alta, em 1800, uma só, sem O–H: cloreto de acila.", 62)
add("cloreto_benzoila", "cloreto de benzoíla", "ClC(=O)c1ccccc1", "cloreto_acila", "carbonila",
    ar() + [(1775, 1.7, 10), (1735, 0.5, 9), (1200, 0.9, 10), (875, 0.9, 8)],
    "C=O em 1775 (alta mesmo conjugada) com anel aromático: cloreto de acila aromático.", 63)
add("propanamida", "propanamida", "CCC(N)=O", "amida1", "carbonila",
    [(3360, 0.8, 45), (3190, 0.8, 45), (2980, 0.4, 10), (2940, 0.25, 10), (1665, 1.6, 15), (1630, 0.9, 12),
     (1420, 0.7, 10), (1145, 0.3, 8), (700, 0.6, 50, "g")],
    "Duas N–H (3360, 3190) e C=O baixa em 1665 (amida I): amida primária.", 15)
add("butanamida", "butanamida", "CCCC(N)=O", "amida1", "carbonila",
    [(3355, 0.8, 45), (3185, 0.8, 45)] + sp3(0.6) + [(1660, 1.6, 15), (1630, 0.9, 12), (1415, 0.6, 10)],
    "Duas N–H (3350, 3185) e C=O em 1660: amida primária.", 64)
add("n-metilacetamida", "N-metilacetamida", "CNC(C)=O", "amida2", "carbonila",
    [(3295, 0.8, 40), (3090, 0.2, 20), (2940, 0.3, 10), (1655, 1.6, 15), (1560, 1.1, 12), (1300, 0.4, 9)],
    "Uma N–H (3300), C=O em 1655 (amida I) e banda de 1560 (amida II): amida secundária.", 65)
add("n-etilpropanamida", "N-etilpropanamida", "CCNC(=O)CC", "amida2", "carbonila",
    [(3290, 0.8, 40), (3085, 0.2, 20)] + sp3(0.7) + [(1645, 1.6, 15), (1550, 1.1, 12)],
    "Uma N–H em 3290, C=O em 1645 e amida II em 1550: amida secundária.", 66)
add("dimetilacetamida", "N,N-dimetilacetamida", "CC(=O)N(C)C", "amida3", "carbonila",
    [(2935, 0.5, 10), (1645, 1.7, 15), (1400, 0.8, 9), (1265, 0.4, 9), (1015, 0.4, 8)],
    "C=O em 1645 (amida) e nenhuma N–H: amida terciária.", 67)
add("dmf", "N,N-dimetilformamida", "CN(C)C=O", "amida3", "carbonila",
    [(2930, 0.5, 10), (2860, 0.4, 9), (1675, 1.7, 15), (1390, 0.8, 9), (1090, 0.6, 8), (660, 0.5, 9)],
    "C=O em 1675 e sem N–H: amida terciária.", 68)

# ---------------- nitrogenados ----------------
add("butilamina", "butilamina", "CCCCN", "amina1", "nitrogenado",
    [(3375, 0.4, 25), (3300, 0.35, 25), (3180, 0.1, 30)] + sp3(1.0) + [(1605, 0.4, 20), (1075, 0.3, 10),
                                                                      (800, 0.7, 45, "g")],
    "Duas N–H fracas (3375 e 3300) e N–H dobrada em 1600, sem C=O: amina primária.", 12)
add("hexilamina", "hexilamina", "CCCCCCN", "amina1", "nitrogenado",
    [(3372, 0.35, 25), (3300, 0.32, 25)] + sp3(1.2, True) + [(1610, 0.4, 20), (1070, 0.3, 10), (800, 0.6, 45, "g")],
    "Duas N–H (3370, 3300) e deformação N–H em 1610: amina primária.", 69)
add("anilina", "anilina", "Nc1ccccc1", "amina1", "nitrogenado",
    [(3430, 0.6, 25), (3355, 0.6, 25), (3220, 0.15, 30)] + ar() + [(1620, 0.8, 8), (1280, 0.8, 10)],
    "Duas N–H (3430, 3355), anel aromático e C–N em 1280: amina primária aromática.", 70)
add("dietilamina", "dietilamina", "CCNCC", "amina2", "nitrogenado",
    [(3305, 0.2, 22)] + sp3(1.0) + [(1140, 0.5, 10), (730, 0.5, 40, "g")],
    "Uma só N–H, fraca, em 3300, e C–N em 1140, sem C=O: amina secundária.", 13)
add("dipropilamina", "dipropilamina", "CCCNCCC", "amina2", "nitrogenado",
    [(3310, 0.2, 22)] + sp3(1.1) + [(1130, 0.5, 10), (740, 0.5, 40, "g")],
    "Uma N–H fraca em 3310 e C–N em 1130: amina secundária.", 71)
add("trietilamina", "trietilamina", "CCN(CC)CC", "amina3", "nitrogenado",
    [(2970, 1.0, 10), (2935, 0.7, 10), (2875, 0.5, 9), (2800, 0.5, 9), (1466, 0.45, 9), (1379, 0.3, 6),
     (1205, 0.6, 9), (1070, 0.6, 9)],
    "Nenhuma N–H acima de 3200, C–H sp³ (com 2800 de N–CH₂) e C–N em 1205: amina terciária.", 14)
add("n-etilpiperidina", "N-etilpiperidina", "CCN1CCCCC1", "amina3", "nitrogenado",
    [(2935, 1.2, 10), (2855, 0.8, 9), (2780, 0.6, 9), (1465, 0.45, 9), (1155, 0.6, 9), (1105, 0.5, 9)],
    "Sem N–H e sem C=O; C–H sp³ (2780 de N–CH₂) e C–N em 1155: amina terciária.", 72)
add("butironitrila", "butironitrila", "CCCC#N", "nitrila", "nitrogenado",
    [(2970, 1.0, 10), (2940, 0.7, 10), (2880, 0.55, 9), (2250, 0.85, 6), (1465, 0.45, 8), (1430, 0.35, 7),
     (1385, 0.3, 6)],
    "C≡N fina e média em 2250, sem N–H e sem C=O: nitrila.", 16)
add("pentanonitrila", "pentanonitrila", "CCCCC#N", "nitrila", "nitrogenado",
    sp3(1.0) + [(2247, 0.85, 6), (1430, 0.3, 7)],
    "C≡N em 2250: nitrila.", 73)
add("benzonitrila", "benzonitrila", "N#Cc1ccccc1", "nitrila", "nitrogenado",
    ar() + [(2230, 0.8, 6)],
    "C≡N em 2230 (conjugada com o anel, abaixo de 2250) e anel aromático: nitrila aromática.", 74)
add("nitropropano", "1-nitropropano", "CCC[N+](=O)[O-]", "nitro", "nitrogenado",
    sp3(0.7) + [(1553, 1.7, 9), (1383, 1.2, 8), (870, 0.4, 8)],
    "Duas bandas fortes de NO₂ (1550 e 1380), sem C=O e sem N–H: nitroalcano.", 75)
add("nitrobenzeno", "nitrobenzeno", "O=[N+]([O-])c1ccccc1", "nitro", "nitrogenado",
    ar() + [(1525, 1.7, 9), (1348, 1.6, 8), (852, 0.7, 7)],
    "NO₂ em 1525 e 1350 com anel aromático: nitroareno.", 76)

# ---------------- reservados para a atividade em grupo ----------------
add("3-metil-2-butanona", "3-metil-2-butanona", "CC(C)C(C)=O", "cetona", "carbonila",
    [(2970, 1.0, 10), (2935, 0.5, 10), (2875, 0.4, 9), (3410, 0.08, 18), (1715, 1.7, 10), (1468, 0.5, 8),
     (1385, 0.4, 6), (1365, 0.7, 6), (1160, 0.6, 8)],
    "C=O em 1715, sem O–H e sem C–H de aldeído (cetona); dubleto 1385/1365 indica isopropila.", 81, grupo=True)
add("hexanal", "hexanal", "CCCCCC=O", "aldeido", "carbonila",
    sp3(1.1, True) + [(2818, 0.25, 8), (2717, 0.3, 8), (1729, 1.5, 10)],
    "C=O em 1730 com o dubleto 2820/2720: aldeído.", 82, grupo=True)
add("3-hexanol", "3-hexanol", "CCCC(O)CC", "alcool", "oxigenado",
    [(3360, 1.1, 130, "g")] + sp3(1.1) + [(1115, 0.9, 12), (970, 0.5, 9)],
    "O–H larga em 3360 e C–O em 1115: álcool secundário.", 83, grupo=True)
add("propanoato_etila", "propanoato de etila", "CCC(=O)OCC", "ester", "carbonila",
    [(2985, 0.6, 10), (2945, 0.4, 10), (1738, 1.7, 10), (1465, 0.4, 8), (1375, 0.4, 6), (1190, 1.5, 14),
     (1080, 0.8, 9)],
    "C=O em 1740 e C–O forte em 1190: éster.", 84, grupo=True)
add("acido_isobutirico", "ácido 2-metilpropanoico", "CC(C)C(=O)O", "acido", "carbonila",
    OH_ACIDO + [(2975, 0.45, 10), (2880, 0.25, 10), (1706, 1.7, 14), (1472, 0.4, 8), (1385, 0.35, 6),
                (1240, 0.8, 14), (930, 0.5, 20)],
    "O–H de ácido (3300–2500) e C=O em 1705; 1385 de isopropila: ácido carboxílico ramificado.", 85, grupo=True)
add("pentilamina", "pentilamina", "CCCCCN", "amina1", "nitrogenado",
    [(3370, 0.38, 25), (3300, 0.34, 25)] + sp3(1.1) + [(1608, 0.4, 20), (1070, 0.3, 10), (800, 0.6, 45, "g")],
    "Duas N–H (3370, 3300) e N–H dobrada em 1610: amina primária.", 86, grupo=True)
add("cinamaldeido", "cinamaldeído", "O=C/C=C/c1ccccc1", "aldeido", "carbonila",
    ar() + [(2815, 0.25, 8), (2742, 0.3, 8), (1680, 1.7, 10), (1626, 0.8, 7), (1125, 0.6, 8), (975, 0.7, 7)],
    "C=O em 1680 (aldeído conjugado com C=C e anel), C–H de aldeído (2815, 2740) e C=C em 1625.", 87, grupo=True)
add("hexanonitrila", "hexanonitrila", "CCCCCC#N", "nitrila", "nitrogenado",
    sp3(1.1, True) + [(2246, 0.85, 6), (1428, 0.3, 7)],
    "C≡N em 2245, sem N–H e sem C=O: nitrila.", 88, grupo=True)

COMPOSTOS = C

# Estruturas só para candidatas dos problemas de grupo (isômeros; não precisam de espectro)
CANDIDATOS_EXTRA = {
    "2-metilbutanal": "CCC(C)C=O",
    "2-hexanona": "CCCCC(C)=O", "3-hexanona": "CCCC(=O)CC", "4-metil-2-pentanona": "CC(C)CC(C)=O",
    "hex-5-en-1-ol": "C=CCCCCO",
    "dipropil_eter": "CCCOCCC", "butil_etil_eter": "CCCCOCC", "2-metil-2-pentanol": "CCCC(C)(C)O",
    "acetato_propila": "CCCOC(C)=O", "butanoato_metila": "CCCC(=O)OC", "4-hidroxi-2-pentanona": "CC(O)CC(C)=O",
    "dioxano": "C1COCCO1", "3-hidroxibutanona": "CC(O)C(C)=O",
    "n-metilbutilamina": "CCCCNC", "dimetilpropilamina": "CCCN(C)C", "2-pentanamina": "CCCC(C)N",
    "indanona": "O=C1CCc2ccccc21", "3-fenil-2-propin-1-ol": "OCC#Cc1ccccc1", "4-vinilbenzaldeido": "C=Cc1ccc(C=O)cc1",
    "4-metilpentanonitrila": "CC(C)CCC#N", "2-metilpentanonitrila": "CCCC(C)C#N", "hex-5-in-1-amina": "C#CCCCCN",
}
