---
name: angles
description: Step 4 of the board, optional. Have the result criticised from 2 to 4 angles described in references/angles.md (ways of judging drawn from well-known business leaders - moat, inversion and incentives, users who want it, focus, distribution...), in one call, one separate personal opinion per angle, each resting on a passage of the result. No agents, no debate, no imitation. Writes 04-angles.md. Needs /board:base.
argument-hint: "[angle,angle,...] [--dossier <slug>]"
---

# angles

Read `BASE/../../references/principes.md` first and apply it.

## Prerequisites (stop and name the command if one fails)

- `00-cadrage.md` (else `/board:cadrage`), and `02-base.md` (else `/board:base`).

## Steps

1. Read `BASE/../../references/angles.md`, the cadrage, `02-base.md` and `03-acteurs.md` if any.
2. Angles: those the owner names; otherwise propose 2 to 4 from the table of `angles.md` that fit the « Type de question » of the cadrage, always including one that looks for how it fails (inversion, incentives), and go on without waiting.
3. Copy the cadrage, the documents, `02-base.md`, `03-acteurs.md` and `angles.md` into a new empty folder (`mktemp -d`). Launch **one fresh `general-purpose` agent** with:

```
Lis en entier le cadrage, les documents, le résultat (02-base.md, et 03-acteurs.md s'il existe) et, dans angles.md, la description des angles suivants : <angles>.
Pour chaque angle, donne un avis séparé et personnel sur le résultat, 150 à 250 mots : ce que cette grille de lecture y voit d'abord, ce qu'elle rejette, ce qu'elle ferait autrement, et ce qui la ferait changer d'avis. Chaque avis s'appuie sur un passage précis du résultat ou des documents. Un angle qui n'a rien à dire sur une partie le dit (hors de son domaine). Pas de débat entre angles, pas d'imitation de style, aucune citation attribuée à une personne. Ta connaissance générale est permise, marquée « (connaissance générale) ».
Termine par trois lignes : où les angles convergent, où ils divergent, et le point que le porteur devrait trancher.
```

4. Save `04-angles.md`, moving any previous one to `historique/`.
5. Tell the user: each angle's opinion in one line, the divergence, the point to settle. Next: `/board:livrable`.
