---
name: terrain
description: Step 6 of the board, after the meeting or the test. Debrief the owner (he tells, then each planned question is put back to him, A, B, C...), score every file of the dossier against what the field showed and at what cost, record the result in the private lessons journal (board/journal.md, next to the dossiers, never in the plugin repository) and, when it settles something, a private field case in board/terrain/. Writes 06-terrain.md. Needs /board:livrable or at least /board:base.
argument-hint: "[--dossier <slug>]"
---

# terrain

Read `BASE/../../references/principes.md` first and apply it.

## Setup

- The journal and the field cases are **private**: they hold names of clients and counterparts and the owner's words. They live in the working directory, next to the dossiers: `board/journal.md` and `board/terrain/`. Never write them in the plugin repository or under `~/.claude/plugins/`.
- Prerequisites: `00-cadrage.md` and `02-base.md` (else name `/board:cadrage` or `/board:base`).

## Steps

1. **Collect what was sent to the field**: the decisive questions and the field questions of `02-base.md`, `03-acteurs.md` and `05-livrable.md`, and the stop criteria of the cadrage.
2. **Debrief**, in one message. First ask the owner to tell what happened in his own words, if he has not. Then list every planned question, labelled A, B, C…, one line each, and ask him to answer each in a word or a line; « pas posée » and « je ne sais plus » are answers. Add: whom he actually met (name, title, entity); what he asked or offered at the end and what was agreed; which question he had in mind and did not ask. Take his words; infer nothing he did not say.
3. **Score.** Write the field facts as a numbered list (F1, F2…), each in his words. For each, look in every file of the dossier: which file had foreseen it, in which words (fact, possible answer, minority view), and at what cost in calls. Add a last row for what no file had foreseen. Say which file foresaw the most for the fewest calls, and whether a later file dropped something an earlier one had right.
4. Save `06-terrain.md` with the debrief, the answers A, B, C… and the scoring table.
5. **Record** in `board/journal.md` (create it with the format of the plugin's `lessons/README.md` if it does not exist): one line in the « Terrain » table (subject, what the board said, what was observed, verdict `confirmé`, `infirmé`, `non testé` or `sans objet`), and a lesson for anything the field showed that no file raised. When the field settles a question cleanly, add a case to `board/terrain/`. An anonymized version for the plugin's `evals/terrain/` (no names of people, companies, products or paths) is proposed to the owner, and written only with his approval.
6. **Tell the user**: the facts, the scoring in a few lines, what to do next with the counterpart (a short follow-up message, if useful, drafted from his answers only), and the lesson recorded. Propose a change to `references/principes.md` only when the same lesson has been seen on two distinct subjects, and apply it only with his approval.
