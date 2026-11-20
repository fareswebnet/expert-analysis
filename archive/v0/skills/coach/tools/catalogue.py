#!/usr/bin/env python3
"""Valide les fiches de skills/coach/fiches/ et écrit skills/coach/CATALOGUE.md.

Usage : python3 -I skills/coach/tools/catalogue.py

Sort en code 1 avec la liste des erreurs si une fiche est invalide ; le
catalogue n'est alors pas écrit. Ne pas éditer CATALOGUE.md à la main.
"""
import json
import re
import sys
from pathlib import Path

COACH = Path(__file__).resolve().parents[1]
RACINE = COACH.parents[1]

DIAMANT = ["cadrer", "diverger", "explorer", "converger", "conclure"]
MECANIQUES = ["atelier", "chaine", "rotation", "notation", "objection"]
ENTREES = ["aucune", "options", "causes", "proposition"]
SORTIES = ["options", "causes", "proposition", "signaux", "scenarios"]
SIEGES = {"chaine": (1, 4)}
SIEGES_PAR_DEFAUT = (3, 6)
CHAMPS = ["id", "nom", "alias", "source", "diamant", "quand", "pasQuand", "mecanique",
          "sieges", "parametres", "entree", "sortie", "pieges", "cout"]
CLE = re.compile(r"^[a-zA-Z0-9_.-]{1,64}$")


def _cles(objet, chemin=""):
    if isinstance(objet, dict):
        for cle, valeur in objet.items():
            yield chemin + cle, cle
            yield from _cles(valeur, chemin + cle + ".")
    elif isinstance(objet, list):
        for i, valeur in enumerate(objet):
            yield from _cles(valeur, f"{chemin}{i}.")


def valider(fiche, slugs):
    """Renvoie la liste des erreurs de la fiche, vide si elle est valide."""
    erreurs = [f"clé non ASCII : {chemin}" for chemin, cle in _cles(fiche) if not CLE.match(cle)]
    erreurs += [f"champ manquant : {c}" for c in CHAMPS if c not in fiche]
    if erreurs:
        return erreurs
    source = fiche["source"]
    if not isinstance(source, dict) or not source.get("auteur") or not source.get("reference"):
        erreurs.append("source : auteur et reference obligatoires")
    for champ, permis in (("diamant", DIAMANT), ("mecanique", MECANIQUES), ("entree", ENTREES), ("sortie", SORTIES)):
        if fiche[champ] not in permis:
            erreurs.append(f"{champ} inconnu : {fiche[champ]} (permis : {', '.join(permis)})")
    bas, haut = SIEGES.get(fiche["mecanique"], SIEGES_PAR_DEFAUT)
    if not bas <= len(fiche["sieges"]) <= haut:
        erreurs.append(f"sieges : {len(fiche['sieges'])} pour {bas} à {haut} attendus")
    for i, siege in enumerate(fiche["sieges"]):
        if not siege.get("posture"):
            erreurs.append(f"sieges.{i} : posture manquante")
        persona = siege.get("persona")
        if persona is not None and persona not in slugs:
            erreurs.append(f"sieges.{i} : persona inconnu : {persona}")
    return erreurs


def catalogue(fiches):
    """Renvoie le catalogue Markdown, une section par étape du diamant."""
    lignes = ["# Catalogue des ateliers du coach", "",
              "Généré par `skills/coach/tools/catalogue.py` à partir de `skills/coach/fiches/`. Ne pas éditer.", ""]
    for etape in DIAMANT:
        du_lot = sorted((f for f in fiches if f["diamant"] == etape), key=lambda f: f["nom"])
        if not du_lot:
            continue
        lignes += [f"## {etape.capitalize()}", "",
                   "| Atelier | Aussi appelé | Source | Mécanique | Sièges | Entrée → sortie | Coût en appels | Quand |",
                   "|---|---|---|---|---|---|---|---|"]
        for f in du_lot:
            source = f["source"]["auteur"] + ", " + f["source"]["reference"]
            if not f["source"].get("verifie", False):
                source += " (à vérifier)"
            cellules = [f"{f['nom']} (`{f['id']}`)", ", ".join(f["alias"]) or "—", source, f["mecanique"],
                        str(len(f["sieges"])), f"{f['entree']} → {f['sortie']}", f["cout"], f["quand"]]
            lignes.append("| " + " | ".join(c.replace("|", "/") for c in cellules) + " |")
        lignes.append("")
    return "\n".join(lignes)


def main():
    slugs = {p.stem for p in (RACINE / "agents").glob("*.md")}
    fiches, erreurs = [], []
    for chemin in sorted((COACH / "fiches").glob("*.json")):
        fiche = json.loads(chemin.read_text(encoding="utf-8"))
        erreurs += [f"{chemin.name} : {e}" for e in valider(fiche, slugs)]
        if fiche.get("id") != chemin.stem:
            erreurs.append(f"{chemin.name} : id {fiche.get('id')!r} différent du nom du fichier")
        fiches.append(fiche)
    if erreurs:
        print("\n".join(erreurs), file=sys.stderr)
        sys.exit(1)
    (COACH / "CATALOGUE.md").write_text(catalogue(fiches), encoding="utf-8")
    print(f"{len(fiches)} fiches valides ; CATALOGUE.md écrit.")


if __name__ == "__main__":
    main()
