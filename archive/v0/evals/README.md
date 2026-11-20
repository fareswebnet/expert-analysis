# Evals

**Depuis le 2026-11-20, les cas qui comptent sont dans `terrain/`** : jugés sur le terrain ou par l'utilisateur. Les cas générés de `cases/` ont été retirés, périmés (un seul passage, sur la v0.2.0) ; `build_cases.py` les regénère depuis `sources/` si besoin. Ce qui suit décrit l'ancien dispositif automatisé.

Two kinds: automated cases run by `claude plugin eval`, and one manual procedure (discrimination). Needs Claude Code 2.1.269 or later.

```
evals/
├── cases/                 generated, one folder per case (prompt.md + graders/*.md)
│   ├── golden/<id>/       20 cases: one persona agent on one dossier
│   └── facilitator/<id>/  4 cases: the debate skill end to end
├── sources/golden/        JSON source of the golden cases (edit these, not cases/)
├── facilitator/           scenarios.json (subjects) and checklist.md (all checks, manual or automated)
├── discrimination/        manual blind test
├── baseline/              manual comparison: one prompt against table and debate
├── tools/build_cases.py   regenerates cases/ from the sources
└── results/               written by claude plugin eval (not versioned)
```

## Regenerate

```
python3 -I evals/tools/build_cases.py
```

Run it after any change to `sources/golden/*.json` or `facilitator/scenarios.json`. When a persona sheet is corrected, regenerate that persona's golden source first: the cases derive from the sheets, so a sheet mistake can pass its own test.

## Golden cases (automated)

Each case calls the persona agent with `ROUND 1`, the sheet path and the dossier. Graders:

| Grader | Weight | Checks |
|---|---|---|
| `agent-used` | 1 | `board:<slug>` was dispatched |
| `position` | 2 | the Position is in `positions_allowed` (regex) |
| `engages` | 2 | at least 70 % of `must_engage` raised, in substance (llm) |
| `stays-in-character` | 2 | no `must_not` behavior, no disclaimer, no invented quote, not a generic consultant (llm) |
| `no-meta` | 1 | no mention of simulation or AI |

```
claude plugin eval . --tag golden --ablation none --judge-model sonnet --no-publish --threshold 0.7
claude plugin eval . --tag core --ablation none --judge-model sonnet --no-publish
claude plugin eval . --case 'buffett-*' --runs 1 --ablation none --no-publish
```

Notes:
- Use `--ablation none`. Without the plugin the agents do not exist, so the baseline arm only reports errors.
- The default LLM judge is small. Fidelity is a nuanced call: pass `--judge-model sonnet` or stronger.
- The judge cannot verify quotations. Quote authenticity is checked offline: add `--json evals/results/run.json`, then `python3 -I evals/tools/audit_quotes.py evals/results/run.json` searches every quotation of the answers in the persona's sheet.
- The sheet path in each prompt is absolute (this machine). Regenerate if the repo moves.
- The first run asks to trust the plugin directory. `--trust-plugin` skips the prompt.
- An expectation flagged as uncertain by its author (see the golden source `basis` and the author's note) is informative only: a failure there points at the sheet first.

## ASK cases (automated)

Four cases (`ask-buffett-1`, `ask-jobs-1`, `ask-grove-1`, `ask-graham-1`) on the golden dossiers, with the `ASK` brief instead of `ROUND 1`. They test what the golden cases do not: since v0.9.0, the ASK instruction asks each persona to put his own questions (sheet section 3) and rejects (section 4) to the dossier, to attack before advising, without caricature, and not to redo the arithmetic of an `Audit des chiffres` when one is given (the Buffett and Grove cases carry one). Source: `sources/ask/cases.json`.

| Grader | Weight | Checks |
|---|---|---|
| `agent-used` | 1 | `board:<slug>` was dispatched |
| `applies-sheet` | 2 | about 60 % of the persona's own questions put to passages of the dossier, at least one instant reject or yes named with its passage, the attack before the recommendations (llm) |
| `no-caricature` | 1 | no concept standing in for an analysis (named without a passage or a figure of the dossier), no forced objection, not a generic consultant; style and repeated signature words are not judged, quoting the audit is not redoing it (llm) |
| `uses-audit` | 2 | with an audit only: names the finding that weighs most, adds what the audit does not see, does not recompute it (llm) |
| `no-meta` | 1 | no mention of simulation or AI |

```
claude plugin eval . --tag ask --ablation none --judge-model sonnet --no-publish --threshold 0.7 --trust-plugin
```

The judge's reasons are not stored, only its votes. To read them, rejudge a failing grader with a fresh agent asked for its verdict, its reason and the passages that decide it (done once on 2026-11-19, see `results/history.md`).

## Facilitator cases (automated, expensive)

`fac-converge`, `fac-diverge`, `fac-quick`, `fac-thin`. Each full run launches more than 20 agent calls. The prompts pre-validate the jury so the run does not stall, which means check F4 (no agent before validation) is not tested here. The skill writes `board-reports/eval-<id>.md`, so grant it:

```
claude plugin eval . --tag facilitator --ablation none --allow-tools Write --judge-model sonnet --no-publish --max-cost-usd 15
```

Automated: skill used, report written, sections present, no numeric score, positions and recommendation consistent, tests trace back, annex complete, agent calls per round (full: 6 to 9; quick: exactly 4, no round 3, no duel), independence of round 1 briefs, duel rule (`fac-diverge`), at most 3 questions on a thin subject (`fac-thin`).

Not automated, check from the transcript: F6 (round 1 launched in the same message), F8 (round 2 briefs hold the other answers verbatim), F11 (recadrage limits), F13 and F14 (duel length and jurors), F22 (chat summary). `fac-failure` (an unavailable agent) is not converted: it needs a scaffold that renames an agent file.

Positions may converge or split run to run, so the duel assertions are conditional and live in `fac-diverge` only.

## Discrimination (manual)

A blind identification test cannot be expressed as a grader: the grader always knows the expected author. Procedure:

1. For each of the 3 dossiers in `discrimination/cases.json`, run ROUND 1 for all 14 personas.
2. Strip names, shuffle, label A to N.
3. Give them to a judge with the prompt in `discrimination/judge.md`, never the sheets or the key.
4. Score against the key. Thresholds are in `cases.json`: top-1 on the 6 core names at least 0.8, on all 14 at least 0.6, no pair confused more than once.

## Baseline (manual)

`baseline/README.md`: the same dossier goes to a single prompt, to `/board:table` and to `/board:debate --quick`; the outputs are reduced to anonymous lists and the user marks what changes the decision. It is the only eval that says whether the board is worth its cost.

## Table and retro (manual)

Checks T1 to T9 and R1 to R6 in `facilitator/checklist.md`, read from the session transcript.

## Rules for reading results

- A score is a snapshot: persona answers and the judge both vary from one call to the next. Never decide on a single run. For a case that fails or flips, run at least 3 (`--runs 3`) before touching an agent, a sheet or a grader.
- A failure with no explanation or a "session limit" error is not a result: rerun it.
- Before changing a grader, read why the judge failed the answer (`judgeVotes`, or ask a judge to apply the grader literally). Fix the thing that is wrong: the agent, the sheet, or the expectation.
- Record each series in `results/history.md` (date, plugin version, model, runs per case, score of each case, remarks). Compare a new series with the previous one on the same cases, never with memory.
- Rerun the 20 golden cases when the plugin version changes, a sheet or an agent is edited, or the model behind the agents changes: behavior can shift without any change to the repository.

## Reading failures

- A golden case fails on one persona: check the sheet sections its `basis` tags point to, then the agent body.
- Two personas confused in discrimination: sharpen sections 2-4 and 6 of both sheets.
- A facilitator check fails: fix `skills/debate/SKILL.md`, not the agents.
