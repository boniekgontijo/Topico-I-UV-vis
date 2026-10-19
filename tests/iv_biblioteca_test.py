"""Biblioteca de compostos do IV: cobertura, química das bandas e saída do gerador.
Rodar: npm run test:py  (python3 -m unittest discover -s tests -p 'iv_*_test.py')"""
import json, pathlib, re, subprocess, sys, unittest

RAIZ = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "tools" / "iv"))
from biblioteca import COMPOSTOS, CANDIDATOS_EXTRA  # noqa: E402

FUNCOES = ["alcano", "alceno", "alcino", "aromatico", "haleto", "alcool", "fenol", "eter", "aldeido", "cetona",
           "cetona_conjugada", "acido", "ester", "lactona", "anidrido", "cloreto_acila", "amida1", "amida2", "amida3",
           "amina1", "amina2", "amina3", "nitrila", "nitro"]


def tem(c, lo, hi, amin=0.5, forma=None, hwmin=0):
    return any(lo <= b[0] <= hi and b[1] >= amin and b[2] >= hwmin and (forma is None or (len(b) > 3 and b[3] == forma))
               for b in c["bandas"])


def conta(c, lo, hi, amin=0.15):
    return sum(1 for b in c["bandas"] if lo <= b[0] <= hi and b[1] >= amin)


class Cobertura(unittest.TestCase):
    def test_todas_as_funcoes_e_pelo_menos_40(self):
        presentes = {c["funcao"] for c in COMPOSTOS.values()}
        for f in FUNCOES:
            self.assertIn(f, presentes, f)
        self.assertGreaterEqual(len(COMPOSTOS), 40)

    def test_oito_reservados_para_grupo(self):
        self.assertGreaterEqual(sum(1 for c in COMPOSTOS.values() if c.get("grupo")), 8)

    def test_esquema(self):
        from rdkit import Chem
        for i, c in COMPOSTOS.items():
            self.assertRegex(i, r"^[a-z0-9_-]+$")
            self.assertIsNotNone(Chem.MolFromSmiles(c["smiles"]), i)
            self.assertTrue(c["diagnostico"].strip(), i)
            self.assertTrue(c["nome"].strip(), i)
        for i, smi in CANDIDATOS_EXTRA.items():
            self.assertRegex(i, r"^[a-z0-9_-]+$")
            self.assertNotIn(i, COMPOSTOS)
            self.assertIsNotNone(Chem.MolFromSmiles(smi), i)


class Quimica(unittest.TestCase):
    """Bandas diagnósticas nas faixas do Pavia (Tab. 2.3/2.4) e do Tópico II."""

    def cada(self, funcao):
        cs = [c for c in COMPOSTOS.values() if c["funcao"] == funcao]
        self.assertTrue(cs, funcao)
        return cs

    def test_cetona(self):
        for c in self.cada("cetona"):
            self.assertTrue(tem(c, 1705, 1725), c["nome"])

    def test_cetona_conjugada(self):
        for c in self.cada("cetona_conjugada"):
            self.assertTrue(tem(c, 1665, 1690), c["nome"])

    def test_aldeido(self):
        for c in self.cada("aldeido"):
            self.assertTrue(tem(c, 1680, 1740), c["nome"])
            self.assertTrue(tem(c, 2690, 2770, amin=0.1), c["nome"])

    def test_ester_e_lactona(self):
        for c in self.cada("ester"):
            self.assertTrue(tem(c, 1715, 1750), c["nome"])
            self.assertTrue(tem(c, 1150, 1300), c["nome"])
        for c in self.cada("lactona"):
            self.assertTrue(tem(c, 1735, 1790), c["nome"])

    def test_acido(self):
        for c in self.cada("acido"):
            self.assertTrue(tem(c, 1680, 1725), c["nome"])
            self.assertTrue(tem(c, 2900, 3100, amin=0.5, forma="g", hwmin=200), c["nome"])

    def test_anidrido_e_cloreto(self):
        for c in self.cada("anidrido"):
            self.assertTrue(tem(c, 1800, 1850) and tem(c, 1740, 1790), c["nome"])
        for c in self.cada("cloreto_acila"):
            self.assertTrue(tem(c, 1770, 1815), c["nome"])

    def test_amidas(self):
        for f in ("amida1", "amida2", "amida3"):
            for c in self.cada(f):
                self.assertTrue(tem(c, 1630, 1690), c["nome"])
        for c in self.cada("amida1"):
            self.assertGreaterEqual(conta(c, 3150, 3450, 0.3), 2, c["nome"])
        for c in self.cada("amida2"):
            self.assertEqual(conta(c, 3250, 3350, 0.3), 1, c["nome"])
        for c in self.cada("amida3"):
            self.assertEqual(conta(c, 3150, 3500, 0.15), 0, c["nome"])

    def test_alcool_fenol_eter(self):
        for c in self.cada("alcool"):
            self.assertTrue(tem(c, 3200, 3400, forma="g", hwmin=80), c["nome"])
            self.assertTrue(tem(c, 1000, 1260), c["nome"])
        for c in self.cada("fenol"):
            self.assertTrue(tem(c, 3200, 3400, forma="g", hwmin=80), c["nome"])
            self.assertTrue(tem(c, 1450, 1620), c["nome"])
        for c in self.cada("eter"):
            self.assertTrue(tem(c, 1050, 1260), c["nome"])
            self.assertEqual(conta(c, 3200, 3600, 0.2), 0, c["nome"])

    def test_nitrogenados(self):
        for c in self.cada("nitrila"):
            self.assertTrue(tem(c, 2210, 2260, amin=0.4), c["nome"])
        for c in self.cada("amina1"):
            self.assertGreaterEqual(conta(c, 3300, 3500, 0.2), 2, c["nome"])
        for c in self.cada("amina2"):
            self.assertEqual(conta(c, 3300, 3500, 0.12), 1, c["nome"])
        for c in self.cada("amina3"):
            self.assertEqual(conta(c, 3200, 3600, 0.15), 0, c["nome"])
        for c in self.cada("nitro"):
            self.assertTrue(tem(c, 1500, 1560) and tem(c, 1330, 1390), c["nome"])

    def test_hidrocarbonetos(self):
        for c in self.cada("alcino"):
            self.assertTrue(tem(c, 3260, 3330) and tem(c, 2100, 2140, amin=0.2), c["nome"])
        for c in self.cada("alceno"):
            self.assertTrue(tem(c, 3010, 3100, amin=0.2) and tem(c, 1620, 1680, amin=0.2), c["nome"])
        for c in self.cada("aromatico"):
            self.assertTrue(tem(c, 1450, 1620) and tem(c, 3000, 3100, amin=0.2), c["nome"])
        for c in self.cada("alcano"):
            self.assertTrue(tem(c, 2840, 2970))
            self.assertEqual(conta(c, 1500, 1800, 0.2), 0, c["nome"])
            self.assertEqual(conta(c, 3100, 3700, 0.2), 0, c["nome"])


class Gerador(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run([sys.executable, str(RAIZ / "tools" / "iv" / "gerar.py")], check=True, capture_output=True)
        cls.j = json.loads((RAIZ / "public/conteudo/iv/compostos.json").read_text())["compostos"]

    def test_formula_e_png(self):
        self.assertEqual(self.j["2-pentanona"]["formula"], "C5H10O")
        self.assertEqual(self.j["2-pentanona"]["nC"], 5)
        self.assertEqual(self.j["2-pentanona"]["insaturacoes"], 1)
        for i in list(self.j) + list(CANDIDATOS_EXTRA):
            self.assertTrue((RAIZ / f"public/conteudo/iv/estruturas/{i}.png").exists(), i)

    def test_bandas_incluem_impressao_digital(self):
        self.assertGreater(len(self.j["2-pentanona"]["bandas"]), len(COMPOSTOS["2-pentanona"]["bandas"]))

    def test_estruturas_sem_cor(self):
        from PIL import Image
        for i in ["2-pentanona", "acido_butanoico", "propanamida", "nitrobenzeno"]:
            im = Image.open(RAIZ / f"public/conteudo/iv/estruturas/{i}.png").convert("RGB")
            for r, g, b in im.getdata():
                if r < 245 or g < 245 or b < 245:
                    self.assertLessEqual(max(abs(r - g), abs(g - b)), 10, f"{i} tem cor")

    def test_fixture_para_o_js(self):
        f = json.loads((RAIZ / "tests/fixtures/iv-amostra.json").read_text())
        self.assertEqual(set(f), {"2-pentanona", "butironitrila"})
        self.assertEqual(len(f["2-pentanona"]), 20)


if __name__ == "__main__":
    unittest.main()
