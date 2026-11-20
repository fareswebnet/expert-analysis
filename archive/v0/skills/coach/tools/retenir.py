#!/usr/bin/env python3
"""Écrit dans la sortie d'une étape ce que le porteur en retient, et imprime les entrées de l'étape suivante.

Usage :
    python3 -I retenir.py <NN-<fiche>.sortie.json> <id> [<id> ...] [--mots "<ses mots>"] [--texte "<sa formulation>"]

`--mots` garde, mot pour mot, ce que le porteur a dit en choisissant.
`--texte` remplace les éléments retenus par sa propre formulation, en une seule
entrée (par exemple la proposition soumise au consentement).
Sort en code 1, sans rien écrire, si aucun élément n'est retenu ou si un
identifiant est inconnu : l'étape suivante ne part pas d'une entrée vide.
"""
import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("sortie")
    parser.add_argument("ids", nargs="*")
    parser.add_argument("--mots", default="")
    parser.add_argument("--texte", default="")
    a = parser.parse_args()

    chemin = Path(a.sortie)
    sortie = json.loads(chemin.read_text(encoding="utf-8"))
    par_id = {item["id"]: item for item in sortie["items"]}
    if not a.ids:
        sys.exit("aucun élément retenu : l'étape suivante n'est pas lancée.")
    inconnus = [i for i in a.ids if i not in par_id]
    if inconnus:
        sys.exit("identifiants inconnus : " + ", ".join(inconnus))

    retenus = [par_id[i] for i in a.ids]
    if a.texte:
        entrees = [{"id": "P1", "texte": a.texte, "source": "porteur, à partir de " + ", ".join(a.ids)}]
    else:
        entrees = retenus
    sortie["retenus"] = {"ids": a.ids, "mots": a.mots, "texte": a.texte or None, "entrees": entrees}
    chemin.write_text(json.dumps(sortie, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(entrees, ensure_ascii=False))


if __name__ == "__main__":
    main()
