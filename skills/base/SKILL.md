---
name: base
description: Step 2 of the board. One good single call on the dossier, the trunk of every analysis - a verdict, who has the problem and what he does today, the decisive questions written as trees with their « if not » branch, the hypotheses ranked by risk with the cheapest test and the stop signal, and the figures redone. Writes 02-base.md. For a meeting, often enough on its own. Needs /board:cadrage. Next: /board:acteurs, /board:angles or /board:livrable.
argument-hint: "[--dossier <slug>]"
---

# base

Read `BASE/../../references/principes.md` first and apply it.

## Prerequisites (stop and name the command if one fails)

- A dossier (`--dossier`, else `board/.courant`) with a `00-cadrage.md` that has its sections. Missing: `/board:cadrage <documents>`.
- If section 2 names a person or an organisation: a `01-interlocuteur.md`, and no unconfirmed contradiction (see the cadrage). Missing: `/board:cadrage --maj`.

## Steps

1. Read the cadrage, the documents it lists, `01-interlocuteur.md` if any, and the `05-livrable.md` and `06-terrain.md` of the related dossiers.
2. Copy into a new empty folder (`mktemp -d`) the cadrage, the documents, the counterpart file and those related files. Launch **one fresh `general-purpose` agent** on those copies only, with:

```
Tu es un expert expérimenté et tranchant du sujet. Lis en entier le cadrage et les documents ; les fichiers de dossiers liés disent ce qui a déjà été réglé, ne le redemande pas. Ta connaissance générale est permise, marquée « (connaissance générale) » quand elle porte sur un fait. Réponds à la question du cadrage en 800 mots au plus :
1. Le verdict, en deux phrases.
2. Qui a le problème, ce qu'il fait aujourd'hui à la place et pourquoi cela lui suffit ; qui paie, qui porte le risque, qui décide.
3. Les questions décisives (celles dont la réponse change ce que le porteur demande ou fait), chacune en arbre : réponses possibles a), b), c), et pour chacune ce qu'elle change et ce qu'il ne faut alors pas demander. Si la réponse n'est pas un fait vérifié des documents, écris la branche « si ce n'est pas le cas » et qui viser alors. Jamais « probablement » ni « sans doute » sur ces questions : écris « non vérifié ».
4. Les hypothèses, de la plus risquée à la moins risquée, chacune avec le test le moins cher et le signal d'arrêt.
5. Ce que tu ferais à la place du porteur.
Si les documents contiennent des chiffres, refais les calculs qui portent la conclusion et dis lesquels ne tiennent pas.
```

3. **Check**: each decisive question has its tree; each unverified one has its « si ce n'est pas le cas » branch; no « probablement » or equivalent on them. Relaunch once with what is missing.
4. Save `02-base.md` (header: question, date, « appel unique »), moving any previous one to `historique/`.
5. Tell the user: the verdict, the decisive trees, the riskiest hypothesis with its test, and the next command. For a rendez-vous: `/board:livrable` (the base is usually enough). For an idée produit, a business plan or a positionnement: `/board:acteurs`.
