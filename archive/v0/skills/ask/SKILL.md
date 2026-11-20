---
name: ask
description: Consult one or several board personas directly on your own documents, in free prose, on your own question, after a short framing of your goal and of whom the answer is for. One call per persona, no rounds, no imposed format. Use for "ask Thiel", "what would Buffett and Musk say about this deck", "quick opinion from the board". For a structured multi-round debate use /board:debate.
argument-hint: "<persona | persona,persona | core | bench | all> <document path(s)> [question] [--dossier <slug>] [--direct] [--base] [--out <path>]"
---

# ask

You pass the user's documents to one or several persona agents and return their answers. You do not summarize the documents, you do not rewrite the question, and you do not speak for an expert.

## Setup

- `BASE` is this skill's base directory. Persona sheets are in `BASE/../debate/references/personas/<slug>.md`.
- Persona agents are launched with the Agent tool, `subagent_type` `board:<slug>` (`board-<slug>` for a standalone install).
- Personas: a slug (`thiel`, `musk`, `jobs`, `buffett`, `huang`, `bezos`, `munger`, `grove`, `arnault`, `dalio`, `drucker`, `graham`, `nadella`, `ma`), a comma list, `core` (the first six), `bench` (the other eight) or `all`. If the user names none, ask which one, in one short question.
- Documents: absolute paths of the user's own files. Pass the paths, not a summary. If a file has no extractable text (for example a deck whose slides are images), say so and ask for a text export or the text itself before continuing.
- **Dossier and cadrage.** Every session belongs to a dossier, `board/<slug>/`, whose first file, `00-cadrage.md`, is the owner's framing (see `BASE/../cadrage/SKILL.md`). Resolve the dossier in this order: `--dossier <slug>`; the dossier whose cadrage lists the documents given; the one named in `board/.courant`. If there is none, run the cadrage first, exactly as that skill describes, then go on without waiting for a validation. Read the cadrage in full and pass it as one more document in every brief, to the personas and to the non-persona agents alike. Documents not given on the command line are those the cadrage lists. If the owner gives a new fact along the way, amend the cadrage as that skill says. `--direct` skips all this: no dossier, no cadrage, and the report goes to `board-reports/`.
- **Thin cadrage.** If section 3 of the cadrage is empty, holds fewer than about thirty words of the owner, or appears under « Non renseigné », and the dossier has no `NN-preciser.md`, say so in one line before launching (the answers will stop at asking for what he has not said) and name `/board:preciser`. Do not wait for an answer.
- **Audit des chiffres.** When the documents hold figures and the dossier has no `NN-audit.md`, have it written before the personas (see « Audit » below) and pass it as one more document in every brief. An audit already in the dossier is reused, not redone. Not with `--direct`.
- Question: the user's own, sharpened by the cadrage; show him the final wording in one line before launching. Ask whether the personas would invest only if that is what he wants to know. When he asks whether they « buy » a product or an idea, word it as adhesion: « Adhérez-vous à l'idée et à ce positionnement, et pourquoi ? », not a purchase order or an investment. With `--direct` and no question: « Quelle est ta réaction ? Que ferais-tu à la place de l'auteur, et que manque-t-il ? »
- If the document already reports what these personas said (an earlier board report or a sheet drawn from one), tell the user before launching, in one line, that their agreement with it will not be independent evidence.
- Output: answers in French. Saved as `NN-ask.md` in the dossier (NN: the next free two-digit number), unless `--out` gives another path; with `--direct`, `board-reports/YYYY-MM-DD-ask-<subject-slug>.md`.

## Steps

1. **Resolve** the personas, the documents and the question. Apart from the cadrage, do not ask more than one question, and only if something blocks.
2. **Launch all the personas in one message, in parallel**, after the audit when one is due: wait for it, check it and save it first. Each brief contains only:

```
ASK
SHEET: <absolute path of the sheet>
DOCUMENTS: <absolute paths>
QUESTION: <the question>
```

Never put another persona's answer in a brief: each answers alone.

3. **Check each answer** before returning it:
   - it stays in the persona's voice and does not mention a sheet, a simulation or an exercise;
   - its critique applies the persona's own questions or rejects to passages or figures of the documents. Concepts that are named but applied to no passage, or repeated as decoration, are caricature: relaunch with `RECADRAGE`. Do not count a concept named once and put to work;
   - it does not redo the arithmetic of the audit;
   - every figure, name or episode that does not come from the documents is marked « (connaissance générale, non vérifiée) »;
   - nothing is drawn as market evidence from a figure the documents give as an assumption.
   If one of these fails, relaunch that persona once with `RECADRAGE: <what went wrong>` and the same brief. Exception: a trailing line that only lists the files read is a technical artifact, not the persona's words. Remove it, say so in your notes, and do not relaunch for it.
4. **Return** each answer verbatim under the persona's name, in the order asked. Add nothing in the persona's voice. After the answers, add at most six lines, labeled as yours: where the personas agree, where they split, what they add to the audit and where one of them disputes it, the elements marked as general knowledge that the user should verify before relying on them, and, if every answer leans the same way, that a unanimous result from one model is weak evidence.
5. **Save** the file and give its path. If the answers leave a point open (a split, or a question each persona asks and none can answer), offer `/board:atelier` on that point, in its default mode. The table and the debate are frozen: offer them only if the user asks for them by name. End your message with a `Suite possible` block: at most three commands, the recommended one first, taken from the table of `BASE/../suite/SKILL.md` for the state the dossier is now in.

## Base (`--base`)

The trunk of every dossier is one good single call, not personas: on the dossiers tested it carried the verdict, the ranked hypotheses and the tests. With `--base`, launch no persona: launch **one fresh agent that is not a persona** (general-purpose), on the copies of the cadrage, the documents and the audit, with the instruction written under « Delta against a single call » in `BASE/../atelier/SKILL.md`, and save its answer as `NN-base.md` in the dossier. One call. When the cadrage names a counterpart, its `NN-interlocuteur.md` is one more document.

## Audit

The arithmetic of a plan is the same for every reader. It is done once, by an agent with no view on the plan, so that the personas spend their words on what only their way of judging shows. Launch **one fresh agent that is not a persona** (general-purpose) with the owner's documents, the cadrage and this instruction:

```
Tu es auditeur des chiffres d'un dossier. Lis en entier les documents du porteur, et rien d'autre. Tu n'as pas d'avis sur le projet, tu ne recommandes rien et tu n'utilises aucune connaissance extérieure aux documents. Rends, sous le titre « # Audit des chiffres », dans cet ordre :

1. RECALCULS. Chaque total, ratio, taux ou multiple que les documents donnent et qu'on peut refaire à partir de leurs propres nombres : le chiffre du document, ton calcul posé, l'écart, les sections. Un écart qui s'explique par un arrondi est signalé comme tel.
2. CONTRADICTIONS. Les paires de passages qui ne peuvent pas être vrais ensemble, chacun cité mot pour mot avec sa section. Une hypothèse que le document présente comme telle n'est pas une contradiction, sauf si un autre passage la traite comme acquise ou si un calcul la contredit.
3. CE QUE LES CHIFFRES SUPPOSENT SANS LE DIRE. Ce qu'un calcul fait apparaître et que le texte ne dit pas (un poste absent, une grandeur constante d'une année sur l'autre, une part implicite), avec le calcul.
4. STATUT DES CHIFFRES CLÉS. Pour chacun : donné comme mesuré ; donné comme hypothèse, estimation ou exemple ; ou statut non dit. Citation à l'appui.
5. NON DOCUMENTÉ. Les éléments dont les calculs des documents ont besoin et qu'aucun ne donne.

Donne à chaque ligne une importance : forte, moyenne ou faible. N'invente pas d'écart pour allonger la liste et n'en écarte pas un parce qu'il paraît mineur. Aucun jugement sur le plan, aucun conseil.
```

Check that each quotation is in the documents and redo two of the calculations yourself; correct by hand what is only a copying error, relaunch once otherwise. Save it as `NN-audit.md` in the dossier. Tell the user its path and its lines of high importance, in five lines at most, before the personas' answers.

## Limits to state when relevant

Each persona is a fresh instance reading a sourced sheet, not the real person. General knowledge is the model's memory and can be wrong or outdated: it is marked, not verified.
