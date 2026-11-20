---
name: livrable
description: Step 5 of the board. Assemble the one-page document the owner will use (a meeting sheet, the hypotheses to prove, the answer to « do they buy the idea »), from the files of the dossier only, each line with its source - verdict, decisive questions as trees, what the actors added, field questions, what not to say, what was not verified. No call. Writes 05-livrable.md. Needs /board:base.
argument-hint: "[\"document wanted\"] [--dossier <slug>]"
---

# livrable

Read `BASE/../../references/principes.md` first and apply it.

## Prerequisites (stop and name the command if one fails)

- `00-cadrage.md` (else `/board:cadrage`), and `02-base.md` (else `/board:base`).

## Steps

1. Read every file of the dossier, and the `05-livrable.md` and `06-terrain.md` of the related dossiers listed in the cadrage.
2. Write the document yourself, no call. One page unless the cadrage asks for more, in the order the owner will use it:
   - **Verdict** (from `02-base.md`).
   - **Decisive questions as trees**, each with its « si ce n'est pas le cas » branch when unverified; the stop rules of related dossiers that still apply, with their source.
   - **What the actors added** (`03-acteurs.md`, « Ce que la base n'avait pas »), if the step ran.
   - **The point to settle** (`04-angles.md`), if the step ran.
   - **Field questions**, with whom to ask.
   - **What not to say or show**: unproven figures, names or documents that could cost credibility.
   - **What was not verified**.
   Each line ends with its source file in parentheses. Nothing that is not in the files; no « probablement » on a decisive question; contradictions between files are kept as « À trancher par le porteur ».
3. Check that every line has a source and that every decisive question has its branch. Save `05-livrable.md`, moving any previous one to `historique/`.
4. Tell the user the path and the page as it is. Next: the field, then `/board:terrain`. If the owner needs it on his phone or to share, offer to publish it as a private page.
