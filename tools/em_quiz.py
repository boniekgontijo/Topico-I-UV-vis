"""Gera public/conteudo/em/{blocos,quiz}.json — quiz de prática de espectrometria de massas (sem nota).

    python3 tools/em_quiz.py

Também grava privado/em-competicao.json (fora do git) para o quiz ao vivo do painel do professor.

As 16 questões foram revisadas pelo professor em 2026-11-15 (rascunho em IMIA/Aula_EM/2026-11-15-quiz-em-rascunho.md).
Nível fácil, uma ideia por questão. A alternativa correta vem sempre primeiro (índice 0); o site embaralha.
Dados de espectro: NIST WebBook (EI, 70 eV) — 3-pentanona 96-22-0, clorobenzeno 108-90-7, propilamina 107-10-8.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DEST = RAIZ / "public/conteudo/em"
PRIVADO = RAIZ / "privado"   # quiz ao vivo: o professor carrega em Perguntas → Espectrometria de massas
MZ = "<i>m/z</i>"

BLOCOS = [
    "O que a EM mede",
    "Fontes de ionização",
    "Qual o melhor método?",
    "Lendo o espectro",
    "Isótopos e regra do nitrogênio",
    "Analisadores e ESI",
]

Q = [
    # 1. O que a EM mede
    (1, f"O que o espectrômetro de massas separa?",
     [f"Íons, pelo valor de {MZ} (massa ÷ número de carga)", "Moléculas neutras, pela massa", "Íons, só pela carga",
      "Moléculas, pelo tamanho"],
     f"Só íons são separados, e o que se mede é {MZ}. Um íon com carga 2 aparece na metade da sua massa."),
    (1, "Por que o analisador trabalha em alto vácuo?",
     ["Para os íons não colidirem com moléculas do ar no caminho", "Para esfriar a amostra",
      "Para aumentar a massa dos íons", "Para os íons ganharem carga"],
     "Uma colisão desvia ou destrói o íon. Por isso analisador e detector ficam sempre no vácuo; só a fonte pode "
     "estar à pressão atmosférica (ESI)."),
    # 2. Fontes de ionização
    (2, "No EI (70 eV), o espectro de uma molécula orgânica pequena costuma mostrar…",
     ["O íon molecular M⁺• e muitos fragmentos", "Só o íon molecular", "Só a molécula protonada [M+H]⁺",
      "Íons com muitas cargas"],
     "O EI é uma ionização dura: o M⁺• fica com energia sobrando e se quebra. [M+H]⁺ e íons multicarregados são do "
     "ESI e do MALDI."),
    (2, "Para ver uma proteína de 20 000 u inteira, qual fonte de ionização usar?",
     ["ESI ou MALDI", "EI", "Qualquer fonte serve", "Nenhuma: proteína não forma íon"],
     "A proteína não evapora e se despedaça no EI. ESI e MALDI são brandas: levam a molécula inteira ao vácuo, "
     "como íon — o elefante que voa."),
    # 4. Lendo o espectro
    (4, "O pico base de um espectro de massas é…",
     ["O pico mais intenso, ao qual se dá 100 %", "O íon molecular", f"O pico de maior {MZ}",
      f"O pico de menor {MZ}"],
     "Pico base é só o mais alto; pode ser um fragmento. Muitas vezes não é o íon molecular."),
    (4, f"Espectro de EI da 3-pentanona: {MZ} 29 (59 %), 57 (100 %), 86 (21 %), 87 (1,2 %). Qual é o íon molecular?",
     ["86", "87", "57", "29"],
     f"O M⁺• é o maior {MZ}, descontados os isótopos. O 87 é o M+1 (¹³C), pequeno; o 57 é o pico base, um "
     "fragmento."),
    (4, "Na 3-pentanona, o M+1 (87) tem 1,2 % e o M (86) tem 21 %. Quantos carbonos, aproximadamente?",
     ["5", "1", "12", "21"],
     "nº de C ≈ (M+1 ÷ M × 100) ÷ 1,1 = (1,2 ÷ 21 × 100) ÷ 1,1 ≈ 5. A 3-pentanona, C₅H₁₀O, tem 5 C. Quem marcou 1 "
     "dividiu só a % do M+1 por 1,1, sem relacionar com o M; 21 é a % do próprio M, não o nº de C."),
    (4, "Na 3-pentanona, o M⁺• em 86 dá o fragmento em 57. O que saiu?",
     ["Um etil, C₂H₅ (29)", "Um metil, CH₃ (15)", "Água, H₂O (18)", "CO (28)"],
     "86 − 57 = 29 = C₂H₅. Sai pela α-clivagem junto ao C=O e fica o íon C₂H₅CO⁺ (57)."),
    # 5. Isótopos e regra do N
    (5, f"Espectro de EI do clorobenzeno: {MZ} 112 (100 %) e 114 (33 %). O par indica…",
     ["Um átomo de cloro", "Um átomo de bromo", "Dois átomos de cloro", "Um átomo de nitrogênio"],
     "M : M+2 ≈ 3 : 1 é a assinatura de um Cl (³⁵Cl e ³⁷Cl). Um Br daria 1 : 1, e dois Cl dariam 9 : 6 : 1."),
    (5, f"A propilamina tem M⁺• em {MZ} 59, um número ímpar. Pela regra do nitrogênio, ela tem…",
     ["Um número ímpar de N (aqui, um N)", "Nenhum N", "Dois N", "Um Cl"],
     "Massa nominal ímpar ⇔ número ímpar de N. O pico base em 30 (CH₂=NH₂⁺) confirma: é o íon típico de amina "
     "primária."),
    # 6. Analisadores e ESI
    (6, "No TOF, todos os íons recebem a mesma energia por carga e voam por um tubo. Qual chega primeiro ao detector?",
     [f"O de menor {MZ}", f"O de maior {MZ}", "Todos chegam juntos", "O mais abundante"],
     f"Com a mesma energia, o leve corre mais. O tempo de voo cresce com √({MZ})."),
    (6, f"Uma proteína de 12 360 u que ganhou 15 prótons aparece em {MZ} ≈ …",
     ["825", "12 375", "185 400", "12 360"],
     f"{MZ} = (M + n·1,0073)/n = (12 360 + 15,1)/15 ≈ 825. É o citocromo c do slide 23. Quem marcou 12 375 somou "
     "os prótons e esqueceu de dividir pela carga."),
    # 3. Qual o melhor método?
    (3, "Limoneno (C₁₀H₁₆, M = 136), do óleo de laranja: pequeno, volátil e apolar. Qual a melhor fonte?",
     ["EI (com GC-MS)", "ESI", "MALDI", "Nenhuma: ele não forma íons"],
     "É volátil e estável ao calor: entra no gás sozinho, e o EI dá o M⁺• e fragmentos que se comparam com a "
     "biblioteca do NIST. O ESI precisa de uma molécula que ganhe ou perca próton em solução, e um hidrocarboneto "
     "apolar quase não faz isso."),
    (3, "Cafeína (C₈H₁₀N₄O₂, M = 194) no café, analisada direto da solução aquosa por LC-MS. Qual fonte?",
     ["ESI", "EI", "MALDI", "Nenhuma: a água atrapalha"],
     "O ESI pega o íon da solução, que sai do LC, e dá o [M+H]⁺ em 195. O EI exige a amostra na fase gasosa e não "
     "acopla com LC. O MALDI é para amostra seca na placa."),
    (3, "Polietilenoglicol (PEG) sólido, cadeias de ~4 000 u. A melhor escolha para ver a distribuição das cadeias:",
     ["MALDI-TOF", "EI", "Pesar o sólido numa balança", "Nenhuma: polímero não ioniza"],
     "O MALDI dá íons de carga única ([M+Na]⁺): cada cadeia vira um pico, de 44 em 44 u (–CH₂CH₂O–). O EI não "
     "volatiliza o polímero. O ESI também ioniza o PEG, mas espalha cada cadeia em várias cargas, e os picos se "
     "sobrepõem."),
    (3, "Associe à fonte mais indicada: (a) componente volátil de um perfume; (b) fármaco polar no plasma, por "
        "LC-MS; (c) proteína de 60 000 u.",
     ["(a) EI · (b) ESI · (c) MALDI ou ESI", "(a) ESI · (b) EI · (c) MALDI ou ESI", "(a) MALDI · (b) ESI · (c) EI",
      "(a) EI · (b) MALDI · (c) EI"],
     "Volátil e pequeno → EI. Polar, em solução, saindo do LC → ESI. Grande e frágil → fonte branda (MALDI ou ESI). "
     "Nenhuma proteína sobrevive ao EI."),
]

# ordem do rascunho aprovado: 1–12 e depois 13–16 (as de "melhor método")
ORDEM_RASCUNHO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    blocos = [{"n": i + 1, "titulo": t} for i, t in enumerate(BLOCOS)]
    questoes = []
    for num, (bloco, enun, alts, expl) in zip(ORDEM_RASCUNHO, Q):
        questoes.append({"id": f"em-q{num:02d}", "bloco": bloco, "tipo": "mc", "enunciado": enun,
                         "alternativas": alts, "correta": 0, "explicacao": expl})
    (DEST / "blocos.json").write_text(json.dumps(blocos, ensure_ascii=False, indent=2) + "\n")
    (DEST / "quiz.json").write_text(json.dumps({"modulo": "em", "questoes": questoes}, ensure_ascii=False, indent=1)
                                    + "\n")
    PRIVADO.mkdir(exist_ok=True)
    (PRIVADO / "em-competicao.json").write_text(json.dumps({"modulo": "em", "questoes": questoes}, ensure_ascii=False,
                                                           indent=1) + "\n")
    print(f"{len(questoes)} questões, {len(blocos)} blocos →", DEST)


if __name__ == "__main__":
    main()
