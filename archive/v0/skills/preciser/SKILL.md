---
name: preciser
description: Before the board answers, let 2 to 5 personas each ask the owner the one question whose answer would most change what they say; his answers are added to the dossier's cadrage. Use after /board:cadrage when the framing leaves things unanswered, or for "what would they need to know first".
argument-hint: "<persona,persona[,...]> [--dossier <slug>]"
---

# preciser

You carry questions from the personas to the owner and his answers back to the cadrage. You ask nothing of your own and you do not answer for him.

## Setup

- `BASE` is this skill's base directory. Persona sheets are in `BASE/../debate/references/personas/<slug>.md`; persona agents are `board:<slug>` (`board-<slug>` for a standalone install).
- Dossier: `--dossier <slug>`, else `board/.courant`. Without a cadrage, run `BASE/../cadrage/SKILL.md` first.
- Participants: 2 to 5 slugs. Cost, told in one line: one agent call each.

## Steps

1. **Launch all participants in one message, in parallel.** Each brief contains only:

```
ATELIER QUESTION
SHEET: <absolute path of the sheet>
DOCUMENTS: <the documents of the cadrage, and the cadrage file>
QUESTION: <the working question of the cadrage>
MANDAT: libre : ta propre façon de raisonner
```

2. **Keep one question per participant**: his first sentence ending with a question mark. Drop a question the cadrage or the documents already answer, and say that you dropped it.
3. **Show the questions to the owner in one message**, each under its author's name, with no comment, and wait for his answers. He may leave one unanswered.
4. **Save** `NN-preciser.md` in the dossier: each question, its author, and the owner's answer in his words. **Amend the cadrage** as `BASE/../cadrage/SKILL.md` says: one dated line per answer under « Précisions », the sections concerned updated, « Non renseigné » reduced.
5. **Tell the user** what the cadrage now holds that it did not, what is still not known, and the `Suite possible` block from `BASE/../suite/SKILL.md`.
