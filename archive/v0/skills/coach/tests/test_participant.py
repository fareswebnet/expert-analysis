"""L'agent participant reprend les règles communes des personas, sans fiche."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEBUTS = (
    "- Facts about the project",
    "- Check the owner's figures",
    "- If the documents include a file titled `Audit des chiffres`",
    "- If the documents include a file titled `Cadrage`",
    "- You may bring your general knowledge",
)


def paragraphe(texte, debut):
    for ligne in texte.splitlines():
        if ligne.startswith(debut):
            return ligne
    raise AssertionError(f"paragraphe absent : {debut}")


class Participant(unittest.TestCase):
    def setUp(self):
        self.buffett = (ROOT / "agents" / "buffett.md").read_text(encoding="utf-8")
        self.participant = (ROOT / "agents" / "participant.md").read_text(encoding="utf-8")

    def test_regles_communes_identiques(self):
        for debut in DEBUTS:
            self.assertIn(paragraphe(self.buffett, debut), self.participant, debut)

    def test_sans_fiche(self):
        self.assertNotIn("persona sheet", self.participant)
        self.assertNotIn("Read your persona sheet", self.participant)
        self.assertIn("POSTURE:", self.participant)


if __name__ == "__main__":
    unittest.main()
