# Discrimination judge

Give the judge only this prompt and the anonymized answers. It must not see persona sheets, agent files or the key.

```
You are given {N} anonymous answers (A to {last}) to the same business dossier. Each was written by a different well-known business figure, in French, from that person's way of thinking.

Candidates: {list of names, without descriptions}

For each answer, name the most likely author, give a confidence from 0 to 1, and the two cues that decided it (a concept, a question asked, a verdict logic, a tone). Each candidate is used at most once. If two candidates are plausible for an answer, name both and say what separates them.

Return JSON: [{"answer":"A","guess":"<name>","confidence":0.0,"alt":"<name or null>","cues":["...","..."]}]
```

Scoring is done by the runner against the key, never by the judge.

Reading the result:
- A pair confused at least twice means the two sheets or agents are too close. Look at the sections 2-4 and 6 of both sheets for what should differ, and sharpen the agent body or the sheet.
- A persona never identified usually has a generic voice: its sheet section 6 or section 3 is too thin.
