"""Enregistrement du rapport et de la sortie d'une étape."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RAPPORT = Path(__file__).resolve().parents[1] / "rapport.py"


def sortie_workflow(dossier):
    resultat = {
        "ok": True, "fiche": "cinq-pourquoi", "rapport": "# Rapport\n\nCorps.\n",
        "carteDecision": "Carte.", "differences": [{"nom": "Grove", "phrase": "Ma différence : x."}],
        "statistiques": {"appels": 3}, "ecarts": [], "citations": [{"id": "C01", "citation": "texte présent", "section": "§1"}],
        "sortie": {"type": "causes", "items": [{"id": "K1", "texte": "Une cause.", "source": "chaîne 1"}]},
    }
    f = Path(dossier) / "sortie.json"
    f.write_text(json.dumps({"result": resultat}), encoding="utf-8")
    return f


class Rapport(unittest.TestCase):
    def lancer(self, dossier):
        doc = Path(dossier) / "doc.md"
        doc.write_text("Un texte présent dans le document.", encoding="utf-8")
        cible = Path(dossier) / "board"
        cible.mkdir(exist_ok=True)
        r = subprocess.run([sys.executable, "-I", str(RAPPORT), str(sortie_workflow(dossier)), str(cible), str(doc)],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        return cible, r.stdout

    def test_numero_suivant(self):
        with tempfile.TemporaryDirectory() as d:
            cible, sortie = self.lancer(d)
            self.assertTrue((cible / "00-cinq-pourquoi.md").exists(), sortie)

    def test_ne_rien_ecraser(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "board").mkdir()
            (Path(d) / "board" / "05-atelier.md").write_text("ancien", encoding="utf-8")
            cible, _ = self.lancer(d)
            self.assertTrue((cible / "06-cinq-pourquoi.md").exists())
            self.assertEqual((cible / "05-atelier.md").read_text(encoding="utf-8"), "ancien")

    def test_sortie_json(self):
        with tempfile.TemporaryDirectory() as d:
            cible, _ = self.lancer(d)
            s = json.loads((cible / "00-cinq-pourquoi.sortie.json").read_text(encoding="utf-8"))
            self.assertEqual(s["type"], "causes")
            self.assertEqual(s["items"][0]["id"], "K1")
            self.assertEqual(s["retenus"], None)

    def test_citation_verifiee(self):
        with tempfile.TemporaryDirectory() as d:
            cible, _ = self.lancer(d)
            self.assertIn("retrouvée dans les documents", (cible / "00-cinq-pourquoi.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
