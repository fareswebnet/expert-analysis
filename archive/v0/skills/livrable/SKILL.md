---
name: livrable
description: Assemble the document the owner asked for in the cadrage (a rewritten sheet, a list of questions, a plan) from the sessions of the dossier, each element attributed to the persona, the card or the session it comes from, with what the board left open and what it did not verify. Use after /board:ask, /board:atelier or /board:table, for "write me the sheet", "give me the list of questions".
argument-hint: "[\"document wanted\"] [--dossier <slug>]"
---

# livrable

The sessions of the board produce answers, maps and decision sheets; the owner asked for a document. You have it assembled from what the sessions contain, and from nothing else.

## Setup

- Dossier: `--dossier <slug>`, else `board/.courant`. It needs a cadrage and at least one session; otherwise say what is missing and give the `Suite possible` block.
- Document wanted: the argument, else section 4 of the cadrage. If neither names one, ask which, in one short question.

## Steps

1. **Read** the cadrage and every session file of the dossier in full, and the deliverables of the dossiers listed under « Dossiers liés ».
2. **Launch one fresh agent that is not a persona** (general-purpose) with the paths of the cadrage, the owner's documents, the session files and the deliverables of the related dossiers, and this instruction:

```
Tu es rédacteur. Lis le cadrage, les documents du porteur et les séances du dossier. Tu n'as pas d'avis sur le sujet et tu n'ajoutes rien : chaque élément du document vient d'une séance et porte sa source entre parenthèses (le persona, la carte, ou la séance et le tour). Rédige le document demandé : « <document wanted> », pour l'usage décrit dans le cadrage (sections 1, 2 et 5).

Règles :
- Une page, sauf si le cadrage demande plus. L'ordre est celui dans lequel le porteur s'en servira.
- Quand deux séances ou deux personas se contredisent, garde les deux et écris « À trancher par le porteur », sans choisir.
- Ce qui repose sur la connaissance générale d'un persona, et non sur les documents, est marqué « (non vérifié) ».
- Une question décisive est une question dont la réponse change ce que le porteur demande ou fait ensuite (qui porte le risque, qui paie, qui décide, si la donnée existe). Chacune est écrite en arbre : les réponses possibles a), b), c)… prises dans les séances, et pour chacune ce qu'elle change et ce qu'il ne faut alors pas demander.
- Si la réponse à une question décisive n'est pas un fait vérifié des documents ou de la fiche interlocuteur, la branche « si ce n'est pas le cas » est écrite, avec la personne à viser alors. Aucun « probablement », « sans doute » ou équivalent sur ces questions : ce qui n'est pas vérifié est écrit « non vérifié ».
- Les règles d'arrêt et les arbres des livrables des dossiers liés sont repris avec leur source, sauf si le cadrage du porteur les contredit ; dans ce cas, garde les deux et écris « À trancher par le porteur ».
- Termine par trois rubriques courtes : « À trancher par le porteur », « Ce que le board n'a pas vérifié », « Sources » (les fichiers du dossier utilisés).
- N'écris ni recommandation de ton cru, ni fait sur le marché, ni élément absent des séances.
```

3. **Check** that every element carries a source that exists in the dossier, and that nothing under « À trancher par le porteur » was decided in the body. Check that each decisive question has its tree, that each unverified one has its « si ce n'est pas le cas » branch, and that no stop rule of a related dossier was dropped without a trace. Correct a wrong reference by hand; relaunch once if elements have no source or a decisive question has no branch.
4. **Save** `NN-livrable-<name>.md` in the dossier.
5. **Tell the user**: the path, the document as it is, the list « À trancher par le porteur », and the `Suite possible` block from `BASE/../suite/SKILL.md`. Say that the document is an assembly of what the personas said, by a neutral writer, and that nothing in it is a market fact.
