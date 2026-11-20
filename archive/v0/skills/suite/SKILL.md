---
name: suite
description: Say where a board dossier stands and which step to take next. Reads the dossier (cadrage, questions, consultations, workshops, tables, deliverables), launches no agent, and proposes at most three commands with the reason for each. Use for "where are we with the board", "what next", or when you come back to a dossier.
argument-hint: "[--dossier <slug>]"
---

# suite

You read a dossier and say what exists, what is missing and what to do next. You launch no agent and give no view on the subject.

## Steps

1. **Resolve** the dossier: `--dossier <slug>`, else the slug in `board/.courant`. If there is no `board/` folder, say so and propose `/board:cadrage <documents>`. If there are several dossiers and none is current, list them with their dates and ask which.
2. **Read** `00-cadrage.md` in full and the first lines of every other file of the dossier. An `NN-audit.md` is a step like the others in the state table: the recalculation of the owner's figures, written once before the first consultation or workshop.
3. **Show the state**, in a short table: step, file, date, one line on what it gave (taken from the file's own summary: the notes of an ask, the decision sheet of a table, the decision map of an atelier). Then the working question, the deadline, and what is still under « Non renseigné ». Then the related dossiers: those under « Dossiers liés », and any other `board/*/00-cadrage.md` sharing a document, a subject or a counterpart with this one, with the stop rules or field results they hold. A related dossier whose deadline has passed and has no field result is named first.
4. **Propose the next step** from the table below: one recommended command first, then at most two others, each with its reason and its cost in agent calls. Fill in the real paths and the participants already used in the dossier.

## What comes after what

| The dossier has | Propose | Why |
|---|---|---|
| no cadrage | `/board:cadrage <documents>` | nothing runs well without it |
| a cadrage whose section 2 names a person or an organisation, and no `NN-interlocuteur.md` | `/board:cadrage --interlocuteur`, first | a preparation for the wrong entity is lost whatever its quality |
| a related dossier with a field result or stop rules the cadrage does not list under « Dossiers liés » | `/board:cadrage --maj` to add it | what was settled is not asked again |
| a cadrage whose section 3 is empty, holds fewer than about thirty words of the owner, or appears under « Non renseigné », and no `NN-preciser.md` | `/board:preciser <2 to 5 personas>`, first, whatever the deadline | without what the owner knows or can show, every answer stops at asking for it |
| a cadrage with other « Non renseigné » items that matter to the question | `/board:preciser <2 to 5 personas>` | the personas ask the owner what they need before answering |
| a cadrage and no `NN-base.md` | `/board:ask --base`, first | one good single call carries the verdict, the ranked hypotheses and the tests; for a meeting, it is often enough |
| a base, and a question of who buys, pays or blocks (a product, a positioning, a business plan) with no atelier yet | `/board:atelier <3 to 6 personas>`, in its default mode (parties prenantes, delta against the base) | the actor seats add channels, prices and incentives the base does not see (L-043) |
| a base or an atelier, a business plan or a decision to test against different temperaments, and no ask with personas | `/board:ask <1 to 3 personas>` | separate personal opinions, no debate |
| an ask whose answers split on one point | `/board:atelier` on that point | open the options from the actors' seats |
| a coach cadrage, a coach path, or a request for a table or a debate | only if the user names it: these skills are frozen | they added nothing over a single call on the dossiers tested |
| at least one session, and a document named in section 4 of the cadrage that no file of the dossier provides | `/board:livrable` | the owner asked for a document, not a map |
| a deliverable and a deadline still ahead | nothing to launch: the field comes next; remind the date and the field questions | the board has said what it can |
| a deadline that has passed | `/board:retro --terrain` | what the field showed, against what the board said |
| a session not yet in the lessons journal | `/board:retro <file>` | what the session taught about the tool |

Every other board skill ends its message with a `Suite possible` block built from this table for the state the dossier is then in: at most three commands, the recommended one first.
