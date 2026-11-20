"""Le choix de l'utilisateur entre deux étapes, écrit mot pour mot."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RETENIR = Path(__file__).resolve().parents[1] / "tools" / "retenir.py"
SORTIE = {"type": "options", "fiche": "brainwriting-635", "rapport": "03-brainwriting-635.md", "retenus": None,
          "items": [{"id": "G1", "texte": "Rétro-test.", "source": "idées F1-I1"}, {"id": "G2", "texte": "Refaire le site.", "source": "idées F2-I1"}]}


def lancer(dossier, *args):
    f = Path(dossier) / "03-brainwriting-635.sortie.json"
    f.write_text(json.dumps(SORTIE), encoding="utf-8")
    r = subprocess.run([sys.executable, "-I", str(RETENIR), str(f), *args], capture_output=True, text=True)
    return r, json.loads(f.read_text(encoding="utf-8"))


class Retenir(unittest.TestCase):
    def test_retient_les_identifiants_et_les_mots(self):
        with tempfile.TemporaryDirectory() as d:
            r, s = lancer(d, "G1", "--mots", "garde le rétro-test")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(s["retenus"]["ids"], ["G1"])
            self.assertEqual(s["retenus"]["mots"], "garde le rétro-test")
            self.assertEqual(json.loads(r.stdout), [{"id": "G1", "texte": "Rétro-test.", "source": "idées F1-I1"}])

    def test_aucun_retenu_arrete(self):
        with tempfile.TemporaryDirectory() as d:
            r, s = lancer(d, "--mots", "rien ne me va")
            self.assertEqual(r.returncode, 1)
            self.assertIn("aucun élément retenu", r.stderr)
            self.assertIsNone(s["retenus"])

    def test_identifiant_inconnu_refuse(self):
        with tempfile.TemporaryDirectory() as d:
            r, s = lancer(d, "G9")
            self.assertEqual(r.returncode, 1)
            self.assertIn("G9", r.stderr)
            self.assertIsNone(s["retenus"])

    def test_texte_du_porteur(self):
        with tempfile.TemporaryDirectory() as d:
            r, s = lancer(d, "G1", "--texte", "Faire le rétro-test avant mars.")
            self.assertEqual(json.loads(r.stdout), [{"id": "P1", "texte": "Faire le rétro-test avant mars.", "source": "porteur, à partir de G1"}])


if __name__ == "__main__":
    unittest.main()
