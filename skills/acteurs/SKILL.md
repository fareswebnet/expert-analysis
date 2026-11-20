---
name: acteurs
description: Step 3 of the board. One call that names the actors of the value chain (who buys, who pays, who carries the risk, the tool in place, who can block, the counterpart) and plays each from his chair - what he gains and loses, what he uses today and why it is enough, what would make him say yes, what he would refuse, who else pays - then contrasted scenarios with the field question that settles each. Marks what the base did not have. Writes 03-acteurs.md. Needs /board:base. Use for a product idea, a business plan or a positioning.
argument-hint: "[\"acteur, acteur, ...\"] [--dossier <slug>]"
---

# acteurs

Read `BASE/../../references/principes.md` first and apply it.

## Prerequisites (stop and name the command if one fails)

- `00-cadrage.md` (else `/board:cadrage`), and `02-base.md` (else `/board:base`).

## Steps

1. Read the cadrage, the documents, `01-interlocuteur.md` if any, and `02-base.md`.
2. Actors: those the owner names in the argument; otherwise the call names them. Copy the cadrage, the documents and the counterpart file into a new empty folder (`mktemp -d`); **not** the base, so that the call does not anchor on it. Launch **one fresh `general-purpose` agent** with:

```
Lis en entier le cadrage et les documents. Ta connaissance générale est permise, marquée « (connaissance générale) » quand elle porte sur un fait. Question : celle du cadrage.
D'abord, nomme 4 à 6 acteurs de la chaîne de valeur dont les intérêts divergent : celui qui achète, celui qui paie, celui qui porte le risque ou le coût, l'outil ou l'habitude en place, celui qui peut bloquer (une plateforme, un régulateur, un fournisseur), et l'interlocuteur du porteur s'il y en a un. <ACTEURS IMPOSÉS, s'il y en a : « Les acteurs sont : … ».>
Puis joue chacun tour à tour, depuis sa chaise : 5 à 7 cartes d'une phrase (40 mots au plus), typées [option], [risque], [question] ou [manque] : ce qu'il gagne et perd, ce qu'il utilise aujourd'hui et pourquoi cela lui suffit, ce qui le ferait dire oui, ce qu'il refuserait, qui d'autre porte le coût.
Enfin 2 à 4 scénarios contrastés, chacun avec ce qu'il suppose et la question de terrain qui le trancherait.
```

3. **Delta.** Compare yourself, by the meaning and not the words, each card and scenario with `02-base.md`. Append to the answer a section « Ce que la base n'avait pas » listing only those, with their actor. An idea only touched on in the base counts as present.
4. Save `03-acteurs.md`, moving any previous one to `historique/`.
5. Tell the user: the actors, the scenarios, and « Ce que la base n'avait pas » first. If that list is empty, say that this step added nothing this time. Next: `/board:angles` to have the result criticised, or `/board:livrable`.
