#!/usr/bin/env python3
"""Enregistre le rapport d'une étape rendue par moteur.workflow.js.

Usage :
    python3 -I rapport.py <sortie-du-workflow.json> <dossier> <document> [<document> ...]

Le moteur ne lit ni n'écrit aucun fichier. Ce programme prend son résultat
tel quel, contrôle les citations contre les documents du porteur, écrit
`NN-<fiche>.md` et `NN-<fiche>.sortie.json` dans le dossier sans rien écraser,
puis affiche ce que le facilitateur montre à l'utilisateur : le chemin, la
carte de décision, les phrases « Ma différence : », les écarts relevés.
`retenus` reste vide dans la sortie : le coach y écrit le choix de
l'utilisateur avant l'étape suivante.
"""

import json
import re
import sys
from pathlib import Path


def normaliser(texte):
    """Ignore la mise en forme markdown et les espaces pour comparer deux passages."""
    return re.sub(r"[\s*_`\\]+", " ", texte).strip().lower()


def prochain_numero(dossier):
    numeros = [int(m.group(1)) for f in dossier.iterdir() if (m := re.match(r"(\d\d)-", f.name))]
    return max(numeros, default=-1) + 1


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    sortie, dossier, documents = Path(sys.argv[1]), Path(sys.argv[2]), [Path(p) for p in sys.argv[3:]]

    resultat = json.loads(sortie.read_text(encoding="utf-8")).get("result")
    if isinstance(resultat, str):
        resultat = json.loads(resultat)
    if not resultat or not resultat.get("ok"):
        print("ÉTAPE INTERROMPUE")
        print(json.dumps(resultat, ensure_ascii=False, indent=2))
        sys.exit(1)

    sources = normaliser("\n".join(d.read_text(encoding="utf-8") for d in documents))
    controles = []
    for c in resultat.get("citations", []):
        trouvee = normaliser(c["citation"]) in sources
        controles.append(
            f"- Citation pour {c['id']} ({c['section']}) : "
            + ("retrouvée dans les documents." if trouvee else "NON RETROUVÉE dans les documents : à ne pas reprendre sans vérifier.")
        )
    if not controles:
        controles.append("- Aucune citation des documents à contrôler.")

    rapport = resultat["rapport"].rstrip("\n") + "\n" + "\n".join(controles) + "\n"
    fiche = resultat.get("fiche", "atelier")

    dossier.mkdir(parents=True, exist_ok=True)
    numero = f"{prochain_numero(dossier):02d}"
    cible = dossier / f"{numero}-{fiche}.md"
    with cible.open("x", encoding="utf-8") as f:
        f.write(rapport)
    if resultat.get("sortie"):
        sortie_etape = dict(resultat["sortie"], fiche=fiche, rapport=cible.name, retenus=None)
        with (dossier / f"{numero}-{fiche}.sortie.json").open("x", encoding="utf-8") as f:
            json.dump(sortie_etape, f, ensure_ascii=False, indent=2)

    print(f"RAPPORT : {cible}")
    print(f"LIGNES : {len(rapport.splitlines())}")
    print("STATISTIQUES : " + json.dumps(resultat.get("statistiques", {}), ensure_ascii=False))
    print("\n=== CARTE DE DÉCISION (à montrer telle quelle) ===\n")
    print(resultat.get("carteDecision", ""))
    print("\n=== MA DIFFÉRENCE ===\n")
    for d in resultat.get("differences", []):
        print(f"{d['nom']} : {d['phrase'] or '(phrase absente)'}")
    print("\n=== ÉCARTS ET CONTRÔLES ===\n")
    for e in resultat.get("ecarts", []):
        print(f"- {e}")
    print("\n".join(controles))
    if resultat.get("sortie"):
        print("\n=== SORTIE DE L'ÉTAPE ===\n")
        for item in resultat["sortie"]["items"]:
            print(f"- {item['id']} : {item['texte']}")


if __name__ == "__main__":
    main()
