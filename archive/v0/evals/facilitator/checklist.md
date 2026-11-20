# Facilitator conformity

Checked against the session transcript (tool calls and messages) and the written report. Each item is pass or fail with the evidence.

## Dossier and jury
- F1. If the essentials were missing, at most 3 questions were asked, in one message.
- F2. The dossier has Sujet, Faits fournis, Hypothèses, Question à trancher and Enjeu, and adds no fact absent from the user's input.
- F3. No web search was run during the debate.
- F4. The jury was proposed with a reason per bench member and a cost in agent calls, and no persona agent was launched before the user's validation.
- F5. Munger sits in the jury. Jury size is 6 to 9 in full mode and 4 in quick mode.

## Independence
- F6. All round 1 agents were launched in the same message.
- F7. No round 1 brief contains another expert's text.

## Rounds
- F8. Round 2 briefs contain every other expert's round 1 answer verbatim, labeled.
- F9. Full mode: no compromise proposal is put to the experts in round 3. The report states the zone of agreement and the remaining dissent separately.
- F10. Quick mode: no round 3, no round 4, no duel, no compromise proposal.
- F24. Before round 2, the tensions are named (2 or 3 axes with who stands where), and the round 2 briefs carry a TENSIONS block.
- F11. A RECADRAGE is used at most once per expert per round, with the reason stated, and the failed answer stays in the transcript.

## Duel
- F12. The duel starts only if, after round 3, two experts hold opposed positions and refuse the proposal on a point that is not a condition.
- F13. It involves the two most antagonistic experts, runs at most 3 turns each, one agent at a time, and every other expert is called with JURY.
- F14. No duel runs in a scenario where positions converge.

## Report
- F15. The file is at `board-reports/AAAA-MM-JJ-<sujet>.md`, or at `--out` when given.
- F16. Sections 1 to 6 and the annex are present (quick mode: 1, 3, 5, 6 and the annex).
- F17. Positions are Go, Go sous conditions, Pivot or Non, with no numeric score.
- F18. The recommendation matches the distribution of final positions. If they split, the report says so and names what separates them. No invented consensus.
- F19. Risks nobody raised are labeled as the facilitator's.
- F20. Every row of the tests table traces to an objection or a risk in section 2.
- F21. The annex holds every answer verbatim, labeled by expert and round.
- F22. The chat summary has the path and 5 lines: jury, final positions, recommendation, biggest disagreement, first test.

## Failures
- F23. In the failure scenario, an agent error is retried once, noted in the transcript, and the debate continues. With fewer than 3 experts left it stops and tells the user.
- F25. Full mode: before round 4, the shared assumptions are listed (statements three or more experts held as acquired and nobody tested).
- F26. Round 4 briefs carry the instruction to refute, with no compromise proposal and no fixed headings. The report lists shared assumptions separately from agreements.
- F27. Important expert claims carry a proof level (fact, inference, hypothesis, speculation), and no verdict rests on a hypothesis presented as a fact.
- F28. A figure the dossier gives as an assumption or an envisaged value is never used as market evidence; when an expert does so, the facilitator flags it as an inference.
- F29. The report states that the decision stays with the user, and does not present the refusal of a platform condition (data sharing or aggregation) as proof that no market exists.
- F30. In a normalized committee, every expert received identical fictional resources, and the report states they are fictional.
- F31. Red team evaluators saw only anonymized memos and no persona sheet; the key to authors was held apart until the results were in.
- F32. With `--stable`, each strategy choice is asked twice with two wordings, and experts whose choice changes are marked unstable.
- F33. In a revision round, corrections are presented as facts and questions, each expert names a flaw in the correction before adopting it, and the report counts who revised and who kept a position.

## Table (manual, from the session transcript and the written file)
- T1. 2 to 5 members; the cost was stated before launch; no validation was awaited.
- T2. All openings were launched in the same message, and no opening brief contains another member's text.
- T3. Each member's later turns went to the same instance (continued by its agent id), or the relaunch is noted at the end of the file.
- T4. Every turn in the file is the member's text verbatim. Between turns the facilitator added nothing but rappels.
- T5. Each next speaker follows the routing rules (inclusion, balance, addressee, open floor, pass) and nothing else.
- T10. Every `Rappel (fait)` quotes the documents exactly and stops there; every `Rappel (règle)` states a rule of the skill or the question asked. No rappel names a winner, rates an argument, adds a question, a test or a fact from outside the documents. At most one per turn.
- T11. A misreading of the documents that a later turn builds on received a rappel (compare with the clerk's rubric 7).
- T12. Each closing answers the question asked on the plan as presented, and the Position line is about that plan.
- T6. The conversation stopped because every member passed or the turn budget was spent, and the file says which.
- T7. The only relaunches are technical (empty answer, error, out of role), at most one per turn.
- T8. The clerk is not a persona; its decision sheet is at the top of the transcript and its notes at the end, both verbatim, citing turn numbers, with no recommendation of its own. The sheet keeps « Établi » (backed by a passage or a correct calculation) apart from « Construit par la table ».
- T9. The chat summary adds nothing of the facilitator's own on the subject, gives the number of rappels and offers `/board:retro`.
- T13. `Repères du document` come from the verifier's first pass: quotations only, each with its section, each found word for word in the documents by the facilitator before insertion (compare with the clerk's note 5).
- T14. When every opening is on the same side, a contre-pied is designated (the `--contre` member, else the last seat), announced in the transcript, briefed with the `RÔLE:` line at every turn, and takes turn 1. With split openings there is none.
- T15. The contre-pied argues his side from the documents until the closing, then gives his real position; the other members answer his arguments on their merits.
- T16. With `--suite`, no opening call is launched for the members present in the ask report, and their answers are copied verbatim as openings.
- T17. The verifier is not a persona and runs twice (after the openings, after half of the turn budget); its rappels are inserted verbatim, five at most then three at most, and none draws a conclusion or adds an outside fact.
- T18. The last `members` turns of the budget are the last word: one turn per member with `TABLE DERNIER MOT`, starting with the member last named, with no hand-over.
- T19. Every turn given by the inclusion or balance rule to another member than the one named is followed by the line that says so.
- T20. The chat message shows the clerk's decision sheet as it is, and the facilitator adds nothing of its own on the subject.

## Retro (manual)
- R1. Journal entries were written in the source repository, never in the installed copy of the plugin.
- R2. Every observation carries its evidence (section or turn number and the words).
- R3. An observation already in the journal was added as an occurrence, not as a new lesson.
- R4. No sheet, agent or skill was changed for a lesson seen on a single subject, unless the user overrode the rule and the journal says so.
- R5. Every change was shown as a diff and approved by the user before being written; its wording names no subject, customer or figure.
- R6. In field mode, each result is in the user's words, and no outcome was inferred.
