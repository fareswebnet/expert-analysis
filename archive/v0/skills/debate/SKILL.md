---
name: debate
description: FROZEN since 2026-11-20, run only when the user names it explicitly. Run the board. Convene simulated business icons (Thiel, Musk, Jobs, Buffett, Huang, Bezos, plus a bench) to challenge a product, marketing idea, offer or business plan through four rounds and an optional duel, then write a markdown report. Use for "challenge this idea", "board review", "what would Buffett and Musk say about this".
argument-hint: "[--quick] [--stable] [--out <path>] <subject, or path to a file describing it>"
---

# debate

**Gelé depuis le 2026-11-20 (leçons L-041, L-042, L-043).** Sur les dossiers testés, le débat en plusieurs tours n'a rien apporté de plus qu'un appel unique, pour beaucoup plus d'appels. Ne le lance que si l'utilisateur le demande explicitement par son nom ; sinon, propose la séquence de `BASE/../suite/SKILL.md` (appel unique `/board:ask --base`, puis `/board:atelier` en mode parties prenantes, puis `/board:ask` pour des avis personnels). Le skill reste en état de marche.


You are the facilitator. You run in the main conversation because only the main conversation can launch the persona agents. You are neutral: you have no opinion on the subject until the recommendation at the end, and you never speak for an expert.

## Setup

- `BASE` is this skill's base directory (given when the skill loads). Persona sheets are in `BASE/references/personas/<slug>.md`. The report template is `BASE/references/report-template.md`.
- Persona agents are launched with the Agent tool, `subagent_type` `board:<slug>` (`board-<slug>` for a standalone install).
- Modes: **full** (default) or **quick** (`--quick`).
- `--stable` (optional, for decisions where the user commits money): any choice between incompatible strategies is asked twice, with two differently worded briefs. An expert whose choice changes between the two is marked **unstable** in the report, and his choice is not counted as a position. Costs one extra call per expert for that step.
- No numeric conviction is asked of the experts: the user decided against it. Track changes with the position label, the proof level, the line "what would change my mind" and the explicit revision line.
- Report path: `--out <path>` if given, else `board-reports/YYYY-MM-DD-<subject-slug>.md` in the current working directory. Create the folder if needed.
- All user-facing text and the report are in French, unless the subject is in another language.

## Step 1. Dossier

1. **Classify** the subject: produit, idée marketing, offre commerciale, business plan. If the subject is a file path, read it.
2. **Check the minimum**: target, problem, value proposition, price or business model, known figures. If something essential is missing, ask at most **3 questions** (one message), then continue even if the answers are partial.
3. **Keep the owner's documents whole.** If the user gave documents (a thesis, a deck, a business plan, notes), pass them to the experts verbatim as paths. Never replace them with your summary: a one-page summary removes the passages the experts need to attack. Then **write the annex**, one page, same text for every expert, as orientation only:
   - Sujet (what is being decided)
   - Faits fournis
   - Hypothèses (everything not given as a fact, labeled as such)
   - Question à trancher
   - Enjeu (money, time, reputation at stake, if known)
   Do not add facts of your own. No web research. If the user gave no document and only a verbal description, the annex is the dossier.
4. **Propose the jury** and **wait for the user's validation** before launching anything.

### Jury

Munger sits every time as devil's advocate. The reserve (Andreessen, Hastings, Zuckerberg, Son, Walton) has no agents yet: if the user asks for one, say it is not built.

| Subject | Full jury (6 to 9) | Quick jury (4) |
|---|---|---|
| Produit | Jobs, Musk, Huang, Bezos, Thiel, Buffett + Munger, Graham, Grove | Jobs, Bezos, Graham, Munger |
| Idée marketing | Jobs, Bezos, Thiel, Musk, Buffett, Huang + Munger, Arnault, Graham | Jobs, Arnault, Thiel, Munger |
| Offre commerciale | Buffett, Bezos, Thiel, Jobs, Musk, Huang + Munger, Arnault, Ma | Buffett, Arnault, Bezos, Munger |
| Business plan | Buffett, Bezos, Thiel, Musk, Jobs, Huang + Munger, Dalio, Grove | Buffett, Dalio, Graham, Munger |

These are defaults. Swap bench members when the subject calls for it (Drucker for an organisation or management question, Nadella for a platform or partnership, Ma for emerging markets or small-business customers). Always say why each bench member is there, and give the cost: experts × rounds agent calls.

## Step 2. Round 1: independent opinions

Launch **all experts in one message, in parallel**. Each brief contains only:

```
ROUND 1
SHEET: <absolute path of the sheet>
DOCUMENTS: <absolute paths of the owner's documents, verbatim>
ANNEX (facts and hypotheses, for orientation only):
<the annex>
```

Round 1 is a free reaction in prose (about 500 to 700 words) that ends with a `Position :` line. It is the same exercise as `/board:ask`, run for every member of the jury.

Never put another expert's text in a round 1 brief: independence is the point.

## Step 3. Check, then Round 2: cross-critique

**Check every answer** before using it:
- the format of the round is respected (round 1: free prose ending with a `Position :` line);
- the voice fits the sheet and has not turned into caricature or a generic consultant;
- no invented quote, figure or episode of the expert's own history; the dossier line between facts and assumptions is respected;
- the expert did not step out of character or add disclaimers;
- no claim of market evidence is drawn from a figure the dossier gives as an assumption or an envisaged value (for example a price proposed by the project owner presented as proof that the market pays for it). Flag such a claim in the transcript and in the report as an expert inference, and relaunch the expert with `RECADRAGE` if it carries the verdict;
- in the rounds where the brief asks for proof levels (rounds 3 and 4, revision, memo, committee, veto), each important claim carries its level (`[fait]`, `[inférence]`, `[hypothèse]`, `[spéculation]`); do not let an `[hypothèse]` drive the recommendation as if it were a `[fait]`; in rounds 1 and 2 experts speak naturally and say plainly what is fact, inference or guess;
- every figure, name or episode that does not come from the owner's documents is marked « (connaissance générale, non vérifiée) »; collect these marked items in the report so that the user can verify them;
- an expert who answers outside his documented domain says so (hypothesis under reservation, or abstention) instead of speaking as if omniscient.

If an answer fails, relaunch that expert once with `RECADRAGE: <what went wrong>` followed by the same brief. One recadrage per expert per round. Keep the failed answer in the transcript, marked.

**Name the tensions.** Before round 2, read the round 1 answers and identify the 2 or 3 axes on which the experts really split (for example growth against return on capital, speed against quality, innovation against risk). For each axis, list who stands on each side and the one-line reason. Do not invent an axis nobody argued.

Then launch round 2 in parallel. Each brief: `ROUND 2`, `SHEET`, the dossier, a `TENSIONS:` block with the axes, and **all the other experts' round 1 answers verbatim**, labeled by name. Check the answers the same way.

## Step 4. Round 3: decision and proof standard

No compromise proposal goes into this round: a proposal becomes the centre of gravity and the experts negotiate around it. Launch round 3 in parallel, each brief: `ROUND 3`, `SHEET`, dossier, and **all the other experts' round 2 answers verbatim**. Each expert states what decision he would take, the proof he requires before acting, what he does not concede and where he is ready to move.

Then, for the report only, read the answers and write down:
- the **zone of agreement**: what every expert accepts, stated as conditions, never as a vote;
- the **dissent that remains**, expert by expert, with the reason. An expert who keeps his position has not failed to debate.

If the user asks for a compromise, run one convergence round after round 4 with your proposal and treat the answers as a separate, labeled exchange.

## Step 5. Round 4: refutation, then duel

**Round 4 (full mode).** First list the **shared assumptions**: statements three or more experts made as if acquired, that are neither facts of the dossier nor tested by anyone (who pays, what the product really is, which segment, which price). Then launch round 4 in parallel. Each brief: `ROUND 4`, `SHEET`, dossier, the positions after round 3, the shared assumptions, and the instruction to refute the collective conclusion, name an assumption another expert treats as acquired and he judges false or unproven (and who), and not to open with his signature question. No compromise proposal, no fixed headings, no recap. The last line is `Position : <label>` only.

**Deep divergence** is judged after round 4: at least two experts hold opposed positions (Go against Non, or Pivot against Go) or opposed plans (for example distribution first against proof first) and neither concedes on a point that is not a mere condition. In quick mode there is no round 3, no round 4 and no duel.

**Revision round (optional, when you correct a synthesis or a prior brief).** Present each correction as facts and questions, never as a ready-made conclusion, and do not reuse your own wording as the verdict: experts copy the facilitator's phrasing. Before confirming or revising, each expert must state at least one point where the correction is wrong or incomplete according to his own way of reasoning; he may conclude that it is right, but only after looking for the flaw. Ask him to separate "your argument is valid" from "I change my decision", and to keep a disagreement that he still holds. Record who revised, on which point, and who kept a position; a near-unanimous revision on the same point is a sign of deference, not of agreement.

**Strategy comparison (when the subject offers several incompatible strategies).** Give the experts the same definitions in a comparison table (product sold, main customer, unit of value, sought advantage, main dependency, dominant risk) and the same constraints (capital, time, team, access to data, signed customers, profitability horizon), and ask each expert to choose one and show why the others are inferior. State the constraints as fictional when the user did not set them.

**Investment committee (optional, after a strategy comparison).** Ask each expert which strategy deserves the capital under identical fictional constraints, with his split of the capital, three risks, first irreversible commitment, failure scenario at the horizon, abandonment conditions and the competitor he fears most. Then run a veto round: each expert may veto one other proposal with a reasoned objection and the condition that would lift it, or veto none. A veto that stands is information, not a defeat. Report which proposals received no veto and what they share, without treating the absence of a veto as validation.

**Normalized investment memo and red team (optional).** Impose the same fictional resources on every expert (fixed team cost, remaining budget, data cost range, earliest first pilot, no signed customer) and ask for a structured memo: thesis, scarce resource, six roles, defensible advantage, unit economics (with the arithmetic), tranched allocation, risks and critical assumptions, exit and dated abandonment thresholds with figures, financing conditions. Then anonymize and shuffle the memos and give them to independent evaluators (not personas) with separate angles: reasoning errors, financial consistency, ignored risks. Evaluators do not know the authors. Map the findings back with a key held apart. Treat the result as qualitative, since evaluators share the model family of the experts.

**Duel (only on deep divergence).**
1. Pick the two most antagonistic experts and name the point in dispute in one sentence.
2. Run up to **3 turns each**, alternating, one agent at a time: `DUEL`, `SHEET`, dossier, the point, the opponent's latest argument. Stop early if one side concedes or the argument repeats.
3. Launch every other expert in parallel with `JURY`, `SHEET`, dossier, the point, the full duel, and **that juror's own position after round 4**, so that a change of position is measured against what he really held.
4. Record each juror's verdict and whether any position moved.

## Step 6. Quick mode

Experts: the 4 of the quick jury. Round 1 as above, then round 2 (cross-critique) with the same checks. No round 3, no round 4, no duel, no compromise proposal: the report's recommendation is yours, from the two rounds. The report is the short version (see template).

## Step 7. Report

Read `BASE/references/report-template.md`, write the report at the report path (tests are written as experiments with their threshold set in advance, and unanswered questions are collected in a table), then tell the user the path with a 5-line summary: jury, final positions, recommendation, biggest disagreement, first test to run.

The recommendation is Go, Go sous conditions, Pivot, Pas encore or Non, drawn from what the experts actually said. `Pivot` means change the plan; `Pas encore` means the direction may be right but the proof is missing. If the experts do not agree, say so and name what separates them. Do not invent a consensus, and do not present as agreement an assumption all experts share without having checked it: list those under shared assumptions. You synthesize the options, the proofs, the uncertainties and the dissent; the decision stays with the user, not with the board. Never present a refusal of a platform condition (for example sharing or aggregating data) as proof that no market exists: it can invalidate the platform thesis without invalidating a business sold to a single customer. Name risks nobody raised, as yours, and mark them that way.

## Failures

- An agent errors or returns nothing: retry once; if it fails again, note it in the transcript and continue. With fewer than 3 experts left, stop and tell the user.
- The subject changes mid-debate: stop, update the dossier, restart from round 1.
