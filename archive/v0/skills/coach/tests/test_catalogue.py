"""Validation des fiches et génération du catalogue."""
import copy
import json
import sys
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / "tools"))
import catalogue  # noqa: E402

SLUGS = {"grove", "buffett", "participant"}


def fiche():
    return json.loads((ICI / "fixtures" / "fiche-valide.json").read_text(encoding="utf-8"))


class Valider(unittest.TestCase):
    def test_fiche_valide(self):
        self.assertEqual(catalogue.valider(fiche(), SLUGS), [])

    def test_persona_inconnu(self):
        f = fiche()
        f["sieges"][0]["persona"] = "inconnu"
        self.assertTrue(any("inconnu" in e for e in catalogue.valider(f, SLUGS)))

    def test_mecanique_inconnue(self):
        f = fiche()
        f["mecanique"] = "tirage"
        self.assertTrue(any("mecanique" in e for e in catalogue.valider(f, SLUGS)))

    def test_cle_accentuee(self):
        f = fiche()
        f["parametres"] = {"paramètres": 1}
        self.assertTrue(any("ASCII" in e for e in catalogue.valider(f, SLUGS)))

    def test_source_obligatoire(self):
        f = fiche()
        del f["source"]["auteur"]
        self.assertTrue(any("source" in e for e in catalogue.valider(f, SLUGS)))

    def test_nombre_de_sieges(self):
        f = fiche()
        f["mecanique"] = "atelier"
        self.assertTrue(any("sieges" in e for e in catalogue.valider(f, SLUGS)))


class Catalogue(unittest.TestCase):
    def test_catalogue_regroupe_par_diamant(self):
        a = fiche()
        b = copy.deepcopy(a)
        b.update(id="autre", nom="Autre fiche", diamant="diverger")
        md = catalogue.catalogue([a, b])
        self.assertLess(md.index("## Diverger"), md.index("## Explorer"))
        self.assertIn("Fiche d'essai", md)
        self.assertIn("chaine", md)
        self.assertIn("niveaux × chaînes + 1", md)


if __name__ == "__main__":
    unittest.main()


class ParcoursParDefaut(unittest.TestCase):
    def test_chaque_etape_a_sa_fiche(self):
        import re
        coach = Path(__file__).resolve().parents[1]
        texte = (coach / "SKILL.md").read_text(encoding="utf-8")
        ligne = next(l for l in texte.splitlines() if "default path is" in l)
        for fiche_id in re.findall(r"`([a-z0-9-]+)`", ligne.split("default path is")[1]):
            self.assertTrue((coach / "fiches" / f"{fiche_id}.json").exists(), fiche_id)
