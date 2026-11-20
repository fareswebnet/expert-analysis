---
name: atelier
description: Run a workshop with 3 to 6 board personas the way a facilitator runs one with sticky notes and a brown-paper wall. By default each persona holds the seat of an actor of the value chain (the buyer, the one who carries the risk, the tool in place, the counterpart) and the wall is measured against one single call; with --classique or --mandats, each works under an imposed mandate (plead the plan, pre-mortem, opposite plan, cut it in half, ten times bigger, the other side of the table). Each writes cards alone, and only then are the cards pooled on one wall, grouped, and read by all, who build on a card, attack one and place their points. The owner gets a one-page map of contrasted scenarios, not a consensus. Use for "brainstorm this with the board", "I want radical and different views", "workshop this plan". For separate free opinions use /board:ask; for a short duel on one point use /board:table.
argument-hint: "<persona,persona,persona[,...]> <document path(s)> [question] [--mandats slug:mandat,...] [--premortem [horizon]] [--parties-prenantes \"acteur:slug,...\"] [--classique] [--questions] [--dossier <slug>] [--direct] [--out <path>]"
---

# atelier

You are the facilitator of a workshop. You hand out the mandates, collect the cards, have the wall built and bring back what the participants do with it. You have no opinion on the subject: you never write a card, never move one, never rank one, and never speak for a participant.

The method is the one of a room with sticky notes and a brown-paper wall, and each step exists for a reason:

- **Silent writing first.** People who think alone and then pool produce more, and more varied, ideas than people who talk first. So nobody sees anyone else's cards before the wall.
- **A mandate, not an opinion.** Left free, personas played by one model land on the same side. A mandate assigns the disagreement instead of hoping for it.
- **One idea per card.** A card can be moved, grouped, built on and attacked; a paragraph cannot.
- **The wall is the shared memory.** Everything is pooled in one file, grouped by affinity, without authors, so that a card is judged for what it says.
- **Isolated cards stay on the wall.** The card only one participant wrote is where the radical view is. It is shown, never merged away.
- **Points, not a vote.** Each participant places his points alone and at the same time. The result is a map for the owner, who decides.

## Setup

- `BASE` is this skill's base directory. Persona sheets are in `BASE/../debate/references/personas/<slug>.md`. The workshop itself is run by the script `BASE/../coach/moteur.workflow.js` through the Workflow tool (step 2); only the optional questions of step 1 are launched by you, with the Agent tool, `subagent_type` `board:<slug>`.
- Participants: 3 to 6 slugs among `thiel`, `musk`, `jobs`, `buffett`, `huang`, `bezos`, `munger`, `grove`, `arnault`, `dalio`, `drucker`, `graham`, `nadella`, `ma`. Fewer than 3: say that `/board:ask` fits better and ask for another list.
- Documents: absolute paths of the user's own files. Read them in full yourself.
- **Dossier and cadrage.** Every session belongs to a dossier, `board/<slug>/`, whose first file, `00-cadrage.md`, is the owner's framing (see `BASE/../cadrage/SKILL.md`). Resolve the dossier in this order: `--dossier <slug>`; the dossier whose cadrage lists the documents given; the one named in `board/.courant`. If there is none, run the cadrage first, exactly as that skill describes, then go on without waiting for a validation. Read the cadrage in full and pass it as one more document in every brief, to the personas and to the non-persona agents alike. Documents not given on the command line are those the cadrage lists. If the owner gives a new fact along the way, amend the cadrage as that skill says. `--direct` skips all this: no dossier, no cadrage, and the report goes to `board-reports/`.
- **Thin cadrage and audit.** As in `BASE/../ask/SKILL.md`: if section 3 of the cadrage is thin and the dossier has no `NN-preciser.md`, say so in one line and name `/board:preciser`, without waiting; when the documents hold figures and the dossier has no `NN-audit.md`, have the audit written first (one more call, said in the cost line). The audit is copied into the isolation folder and given to the participants, the wall keeper and the clerk with the documents.
- Question: the user's own, sharpened by the cadrage; show him the final wording in one line. With `--direct` and no question: « Que faire de ce plan, et que faudrait-il aller vérifier d'abord ? »
- **Isolation.** Copy the documents and the cadrage into a new empty folder outside the project (`mktemp -d`), and give the participants those copies only. They must not be able to read earlier reports or each other's work.
- Report: `--out <path>` if given, else `NN-atelier.md` in the dossier (NN: the next free two-digit number); with `--direct`, `board-reports/YYYY-MM-DD-atelier-<subject-slug>.md`; never overwrite, add a suffix. Everything is in French unless the subject is in another language.
- Cost, told to the user in one line before launching: participants (cards) + 1 (wall) + participants (reading the wall) + participants (own case) + 1 (map), plus participants with `--questions`. Do not wait for a validation.

## Mandates

| Mandate | What the participant is asked to hold |
|---|---|
| `plaider` | The owner's plan as it stands, at its strongest: why it works and what would make it work better. |
| `pre-mortem` | Eighteen months from now it has failed. Tell why, from the documents, and what would have warned of it. |
| `plan-oppose` | With the same means, the plan that goes the other way on the choice the owner treats as settled. |
| `supprimer` | Half of the plan goes. Which half, and what the smallest version worth doing looks like. |
| `dix-fois` | The version ten times more ambitious: what it would take, and what the present plan leaves on the table. |
| `en-face` | The seat across the table (the customer, the counterpart, the person the owner will meet): what he hears, why he says no, what would make him say yes. |
| `ne-rien-faire` | The case for not doing it, or for waiting: what waiting costs and what it saves. |

**Default mode: parties prenantes.** Without `--mandats`, `--premortem` or `--classique`, the workshop runs as `--parties-prenantes` (below): the personas given hold, in their order, the actors proposed from the cadrage, and the delta against a single call is computed. The mandates of the table above apply only with `--mandats`, `--premortem` or `--classique`. This default rests on lesson L-043, confirmed on two subjects: the single call carries the verdict, the rigour and the tests, the actor seats add channels, prices and incentives seen from an actor's chair. The delta stays mandatory: each session shows what it added.

Assignment of the mandates is mechanical. `--mandats slug:mandat,...` wins. Otherwise each participant takes his default, in the order the user gave; a participant whose default is already taken takes the first mandate of the table not yet given.

Defaults: `thiel` plan-oppose · `musk` supprimer · `jobs` en-face · `buffett` ne-rien-faire · `huang` dix-fois · `bezos` en-face · `munger` pre-mortem · `grove` pre-mortem · `arnault` plaider · `dalio` pre-mortem · `drucker` plaider · `graham` supprimer · `nadella` plaider · `ma` en-face.

Then check two things and say what you changed: `plaider` and `pre-mortem` must both be held; if one is missing, the last participant in the list whose mandate is neither of them takes it.

**`--premortem [horizon]`.** Every participant holds `pre-mortem`, each from his own way of judging, and the rule above does not apply. Horizon: the one given, else one year after the deadline of the cadrage, else « dans douze mois »; write it as a date in the mandate line. Use it when the choice is made and the question is what can kill the plan. The script then asks each participant for 4 to 6 causes of failure (title, mechanism from the documents, weak signal), has the wall record only the chains of causes a card states, and turns the decision map into a table of weak signals: where to observe each one, whom to ask, and a stop criterion proposed from a card. Those criteria are proposals: only the owner writes them into section 6 of the cadrage, as an amendment.

**`--parties-prenantes "acteur:slug,..."` (leçon L-043, confirmée sur deux sujets).** The seats are the actors of the value chain, not public figures: the buyer, the one who carries the risk or the cost, the one who decides elsewhere, the tool or habit in place, the counterpart the owner will meet. Each actor is held by a persona who keeps his own way of judging. Take the actors from the argument; else propose 3 to 5 in one line from section 2 of the cadrage, the counterpart file and the documents, and go on without waiting. Every seat takes the mandate `partie-prenante` with this posture, in French, the actor filled in: « Tu tiens le siège de <acteur> : ce qu'il décide, ce qu'il paie, ce qu'il risque. Avec ta façon de juger, dis ce que ce plan te fait gagner et perdre, ce que tu utilises aujourd'hui à la place et pourquoi cela te suffit, ce qui te ferait dire oui, ce que tu refuserais, et qui d'autre que toi porte le coût. » The seat's `nom` is « <acteur> (<persona>) ». The rule on `plaider` and `pre-mortem` does not apply. Use it when the question is who buys, who pays or who blocks.

**Delta against a single call (always in the default mode, optional with `--classique`, `--mandats` or `--premortem`).** A workshop is worth its cost only for what one good call does not find. If the dossier already holds an `NN-base.md`, use it and skip this call. Otherwise, before step 2, launch **one fresh agent that is not a persona** (general-purpose) on the same copies, with this instruction, and save its answer as `NN-base.md` in the dossier:

```
Tu es un partenaire de réflexion produit, expérimenté et tranchant. Lis en entier le cadrage et les documents. Ta connaissance générale est permise, marquée « (connaissance générale) » quand elle porte sur un fait. Réponds à la question du cadrage en 700 mots au plus : qui a le problème et que fait-il aujourd'hui à la place ; qui paie, qui porte le risque et qui décide ; les hypothèses du plan classées de la plus risquée à la moins risquée, chacune avec le test le moins cher et le signal d'arrêt ; ce que tu ferais à la place du porteur.
```

After step 3, launch **one more fresh agent that is not a persona** with the report and `NN-base.md`: « Pour chaque carte du mur et chaque scénario de la carte de décision, dis s'il est déjà dans la réponse de base (même idée, même si les mots diffèrent) ou s'il est nouveau. Rends la liste des seuls éléments nouveaux, avec leur numéro et leur texte exact, puis une ligne : combien de cartes nouvelles sur combien. Tu n'as pas d'avis sur le fond. » Append its answer to the report under « Apport de l'atelier par rapport à un appel unique ». Add 2 calls to the cost line.

## Step 1. Questions to the owner (only with `--questions`)

Launch all participants in parallel with `ATELIER QUESTION`, the sheet, the copied documents, the question and `MANDAT:`; each returns one question to the owner, from his mandate. Show the questions to the user in one message, without authors' comments, and wait for his answers. Append the questions and his answers, verbatim, to the cadrage file and to its copy. A participant who answers anything other than one question is not relaunched: keep his first question mark sentence, or nothing.

## Step 2. Run the workshop (one script, no hand work)

Everything between the mandates and the report is done by `BASE/../coach/moteur.workflow.js`, not by you: the briefs, the numbering of the cards, the wall, the readings, each profile's own case, the clerk and the report. You do not launch a participant yourself, you do not copy a card, and you do not tell the user what a participant wrote while the workshop runs.

Call the Workflow tool with `scriptPath: BASE/../coach/moteur.workflow.js` and these `args`:

```
date               today, YYYY-MM-DD
question           the question
documents          absolute paths of the copies in the isolation folder (documents, cadrage, audit)
documentsAffiches  the original paths, for the header of the report
cadrage            path of the cadrage file in the dossier
fichesDir          absolute path of BASE/../debate/references/personas
fiche              the content of BASE/../coach/fiches/atelier.json, or of pre-mortem.json with --premortem
sieges             one entry per participant, in the order given:
                   { slug, nom, persona: true, mandat, posture: <the line of the mandate table, in French> }
entrees            []
horizon            with --premortem only: the date, in words
```

What the script does, so that you can say it to the user in one line:

1. **Silent writing.** Each participant, alone and under his mandate, returns 5 to 7 cards as data (type, text, pari). The script numbers them `C01`, `C02`… and keeps the key (card, participant, mandate) out of the wall. A participant whose cards break the format (fewer than two options, no single pari) is relaunched once.
2. **The wall.** One agent that is not a persona returns groups of card numbers, tensions between groups of options, readings to check and off-topic cards. It never returns the text of a card: the script assembles the wall from the original cards, so every card is on it once, word for word, in the zone of its type. A wall that misplaces a card is relaunched once.
3. **Reading the wall.** Each participant, mandate dropped, builds on one card that is not his, attacks one, adds the card nobody wrote and places three points. A point given to one's own card is dropped by the script and noted.
4. **Each profile's own case, and the map.** Each participant says in 200 words how he would handle the subject himself, ending with `Ma différence :`. The clerk, from the wall and the readings and without authors, returns two to four scenarios as data (what each supposes, the strongest attack it received, the field question that would settle it, and the next concrete action a card or a reading proposes); the script counts the points, the paris and the isolated cards and lays out a one-page map.

Each step is a fresh instance: a participant does not remember his cards, the script hands them back to him. The instructions of the wall keeper and of the clerk live in the script and nowhere else.

## Step 3. Save the report

When the workflow completes, its notification gives an output file. Run:

```
python3 -I BASE/../coach/rapport.py <output file> <dossier folder> <original document paths, cadrage included>
```

It writes `NN-atelier.md` or `NN-pre-mortem.md`, with its `.sortie.json` (the next free number, nothing overwritten), checks every quotation of the wall against the documents, and prints the path, the decision map, the `Ma différence :` sentences and the deviations the script recorded. With `--direct` or `--out`, move the file it wrote. If it prints `ÉTAPE INTERROMPUE`, tell the user which step failed and stop: do not finish the workshop by hand.

## Step 4. What you tell the user

Tell the user the path and show the decision map as it is: it is the clerk's, not yours. When a delta was computed, show its count and its new elements first: a workshop with no new element did not earn its cost, and you say so. Then show each `Ma différence :` sentence under its author's name, and say that the full cases are in the report. Then at most four lines of your own, on the session and not on the subject, taken from what the helper printed: the mandates you reassigned, the relaunches and other deviations, a quotation of the wall not found in the documents, the share of isolated cards, and whether the points piled on one scenario.

If the cadrage asked for a document (a rewritten sheet, a list of questions), say so and put `/board:livrable` first in the `Suite possible` block; do not write that document yourself.

The table is frozen: do not offer it, unless the owner asks for a duel by name. Offer `/board:retro <report>`. End your message with a `Suite possible` block: at most three commands, the recommended one first, taken from the table of `BASE/../suite/SKILL.md` for the state the dossier is now in.

## Limits to state when relevant

Every participant is the same model reading a sourced sheet, not the real person. A mandate forces different content, not different conviction: the cards written under `pre-mortem` or `plan-oppose` are arguments to test, not predictions. When the mandate is dropped, at the reading of the wall, the points tend to gather at the centre again: read the isolated cards and the paris before the totals. Nothing on the wall is a market fact.
