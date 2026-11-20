"""Check that quotations in persona answers exist in the persona sheet.

Usage: python3 -I evals/tools/audit_quotes.py <results.json>
The results file comes from `claude plugin eval ... --json <path>`. For each golden
case, the answer is taken from the `engages` grader evidence and every quotation
(« ... » or "..." of at least 6 words) is searched in skills/debate/references/personas/<slug>.md.
Exit 1 if any quotation is not found.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "skills" / "debate" / "references" / "personas"


def norm(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"[^a-z0-9àâçéèêëîïôûùüÿœ']+", " ", text).strip()


def quotes(answer: str):
    found = re.findall(r"«\s*([^»]+?)\s*»", answer) + re.findall(r'"([^"\n]+)"', answer)
    return [q for q in found if len(q.split()) >= 6]


def main(path: str) -> int:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    missing = 0
    for case in data["cases"]:
        slug = case["name"].rsplit("-", 1)[0]
        sheet = SHEETS / f"{slug}.md"
        if not sheet.exists():
            continue
        # The answer may quote the dossier back; only the persona's own quotes need a source.
        sheet_text = norm(sheet.read_text(encoding="utf-8")) + " " + norm(case.get("promptMarkdown", ""))
        for run in case["arms"].get("with", []):
            answer = next((g.get("evidence") for g in run["graders"] if g["name"] == "engages"), None)
            if not answer:
                continue
            for q in quotes(answer):
                ok = norm(q) in sheet_text
                missing += not ok
                print(f"{case['name']}: {'ok     ' if ok else 'MISSING'} {q[:100]}")
    print(f"{missing} quotation(s) not found in the sheets")
    return 1 if missing else 0


sys.exit(main(sys.argv[1]))
