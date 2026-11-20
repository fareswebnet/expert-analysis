---
name: retro
description: Record what a board session taught, or what the field later showed, in the lessons journal, and turn confirmed lessons into proposed changes to the persona sheets, the agents, the skills or the evals. Use after /board:ask, /board:debate or /board:table ("retro", "lessons learned", "qu'a-t-on appris"), and again after the meeting or test the board prepared ("voici ce qui s'est passé chez le client").
argument-hint: "[<report or transcript path>] [--terrain]"
---

# retro

You keep the board's memory. A session is evidence about the tool, not about the market: you record what happened, you look for the same thing in earlier sessions, and you propose a change only when the rule below allows it. You never change a sheet, an agent or a skill without the user's explicit approval of that change.

## Setup

- `REPO` is the plugin's **source** repository, not the installed copy. Resolve it in this order: the current working directory if it contains `lessons/journal.md` and `.claude-plugin/plugin.json`; else the `installLocation` of `multi-expert-board` in `~/.claude/plugins/known_marketplaces.json`; else ask the user. Never write under `~/.claude/plugins/cache`.
- Journal: `REPO/lessons/journal.md`. Its header explains the format; follow it.
- Session: the path given; else the most recent session file of the current dossier (`board/.courant`, see `BASE/../cadrage/SKILL.md`); else the most recent file in `board-reports/` of the current working directory. When the session belongs to a dossier, read its `00-cadrage.md` too: the deadline and the stop criteria the owner wrote there are what the field mode asks about first. Read it in full, transcript included, and read the journal in full.
- All user-facing text and journal entries are in French.

## Mode terrain (`--terrain`, or the user reports what happened in the field)

1. List what the session sent to the field: the tests and stop criteria of a debate report, a preparation sheet's facts to establish and its questions, the "questions pour le terrain" of a table, and the entry under « Terrain en attente » of the journal if there is one for this subject. Take them from the dossier and its related dossiers.
2. **Debrief the user**, in one message. First ask him to tell what happened in his own words, if he has not. Then list every planned question, labelled A, B, C…, each in one line, and ask him to answer each in a word or a line; « pas posée » and « je ne sais plus » are answers. Add three questions: who he actually met (name, title, entity), what he asked or offered at the end and what was agreed, and which question he had in mind and did not ask. Take his words; do not infer a result he did not give.
3. **Score the preparation.** Write the field facts as a numbered list (F1, F2…), each in his words. For each, look in every file of the dossier and of its related dossiers, including any control file written with a single prompt: which file had foreseen it, in which words, whether as a fact, a possible answer or a minority view, and at what cost in agent calls. Save the table as `NN-terrain.md` in the dossier: one row per field fact, one column per file, and a last row for the facts that no file had foreseen. Say which preparation foresaw the most for the fewest calls, and whether a later file dropped something an earlier one had right.
4. Record one line per item in the journal's « Terrain » table: what the board said and which members said it, what was observed, and the verdict `confirmé`, `infirmé`, `non testé` or `sans objet`. Remove the subject from « Terrain en attente ».
5. Then record as lessons, in the normal way below: anything the field showed that **no member raised**, any point a member was sure of and the field contradicted, any member whose questions proved the most useful, and any case where a simpler preparation foresaw what a costlier one did not. A member proved wrong once is not a faulty sheet: it is one occurrence.

## Mode session (default)

1. **Observe**, from the document, with the evidence each time (section or turn number, and the words):
   - positions identical for every member, or at every round;
   - a member who changes his view in the facilitator's words or in another member's words, or without a stated reason;
   - wording that is the same for all members because the brief imposed it;
   - an assumption of the owner used as a fact, and whether anyone caught it;
   - a figure, name or episode from outside the documents that is not marked;
   - a voice that turned generic, or a caricature carried by signature vocabulary only;
   - a member speaking outside his documented domain without saying so;
   - what the facilitator or postman did that the skill does not say, and what the skill says that was not done;
   - at a table: an exchange that stayed between two members, a silent member, early passes, agreement without objection (the clerk's rubric 6).
   Report what is there. An empty list is a valid result.
2. **Ask the user**, in one message, at most three questions: which member was the most useful and why; which one sounded false or added nothing; what was missing from the session. Record the answers in « Jugement de l'utilisateur », in his words.
3. **Match** each observation against the journal. The same mechanism on another subject is an occurrence of the existing lesson, even if the wording differs: add the occurrence, do not create a duplicate. Otherwise create a new lesson with the next id and the status `observée`.

## The rule for changing the tool

- **One subject, no change.** A lesson seen on a single subject stays `observée`. Two sessions on the same subject count as one.
- **Two distinct subjects**: the lesson becomes `confirmée` and you may propose a change.
- **Or an eval first**: on a single subject, the user may ask to turn the lesson into an eval case or a checklist item (`evals/sources/golden/*.json`, `evals/facilitator/checklist.md`, then `python3 -I evals/tools/build_cases.py`). The status becomes `cas d'eval`; the tool itself is still unchanged.
- **Exception, corrections.** A factual error in a sheet (a quote, a source, a date, an attribution) is not a lesson: propose the fix at once and log it under « Corrections ».
- The user may override the rule for a given lesson. Record that he did.

## Proposing and applying

For each `confirmée` lesson:

1. Choose the **smallest target** that owns the problem: one sheet section (`fiche:<slug> §n`), the shared agent body (`agents`, all 14 files, which must stay identical apart from the names and Munger's assignment), one skill step, or an eval.
2. Write the change in **general terms**: a rule must not name the subject, the customer or the figure that revealed it. Prefer tightening or deleting an instruction to adding one; if a skill grows, say what could be removed in exchange.
3. Show it as a diff and say what would show that it worked (which eval, or what to look for at the next session). Wait for approval, proposal by proposal.
4. After approval, edit the files in `REPO`, set the lesson to `appliquée` with the date and the files touched, and give the user what remains for him to do: the eval command to rerun (see `evals/README.md`; rerun the golden cases after any change to a sheet or an agent), a commit if he wants one, and the plugin update that refreshes the installed copy.
5. A lesson the user rejects is set to `rejetée` with his reason, and stays in the journal so that it is not proposed again.

## Report to the user

At most six lines: lessons created, lessons seen again (with their count of subjects), lessons now confirmed, proposals awaiting his decision, field results recorded, and the path of the journal.
