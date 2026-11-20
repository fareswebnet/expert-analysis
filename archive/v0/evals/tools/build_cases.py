"""Generate `claude plugin eval` cases from the JSON sources.

Sources:  evals/sources/golden/<slug>.json, evals/sources/ask/cases.json, evals/facilitator/scenarios.json
Output:   evals/cases/golden/<case-id>/, evals/cases/ask/<case-id>/, evals/cases/facilitator/<scenario>/

Run `python3 -I evals/tools/build_cases.py` after correcting a persona sheet and
its golden cases. The output folder is rebuilt from scratch.
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVALS = ROOT / "evals"
SHEETS = ROOT / "skills" / "debate" / "references" / "personas"
CASES = EVALS / "cases"

CORE = {"thiel", "musk", "jobs", "buffett", "huang", "bezos"}


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def grader(case_dir: Path, name: str, front: dict, body: str = "") -> None:
    lines = ["---"] + [f"{k}: {v}" for k, v in front.items()] + ["---", ""]
    write(case_dir / "graders" / f"{name}.md", "\n".join(lines) + body.strip() + ("\n" if body else ""))


def bullets(items) -> str:
    return "\n".join(f"- {item}" for item in items)


def position_pattern(allowed) -> str:
    allowed = list(allowed) + (["Pas encore"] if "Pivot" in allowed else [])
    alts = [r"Go(?! sous)" if p == "Go" else p for p in allowed]
    return r"^[-*\s]*Position[\s*:]{1,8}(?:" + "|".join(alts) + r")\b"


def golden_cases() -> None:
    for src in sorted((EVALS / "sources" / "golden").glob("*.json")):
        data = json.loads(src.read_text(encoding="utf-8"))
        slug = data["persona"]
        group = "core" if slug in CORE else "bench"
        for case in data["cases"]:
            d = CASES / "golden" / case["id"]
            write(
                d / "prompt.md",
                "\n".join(
                    [
                        "---",
                        f"name: {case['id']}",
                        f"description: {slug}, {case['focus']}",
                        f"tags: [golden, {group}, {slug}]",
                        "runs: 1",
                        "max_turns: 12",
                        "timeout_seconds: 600",
                        "allowed_tools: [Agent, Read, Glob]",
                        "---",
                        "",
                        f"Utilise l'agent board:{slug} pour le ROUND 1 sur le dossier ci-dessous. "
                        "Rends sa réponse telle quelle, sans commentaire ni reformulation.",
                        "",
                        "ROUND 1",
                        f"SHEET: {SHEETS / (slug + '.md')}",
                        "DOSSIER:",
                        case["dossier"],
                        "",
                    ]
                ),
            )
            exp = case["expect"]
            grader(d, "agent-used", {"type": "tool_used", "tool": "Agent", "input_match": f"'board:{slug}'"})
            grader(
                d,
                "position",
                {
                    "type": "regex",
                    "pattern": "'" + position_pattern(exp["positions_allowed"]) + "'",
                    "flags": "m",
                    "target": "last_message",
                    "weight": 2,
                },
            )
            need = max(1, round(len(exp["must_engage"]) * 0.7))
            grader(
                d,
                "engages",
                {"type": "llm", "weight": 2},
                f"PASS if the answer, in substance and not by keyword, raises at least {need} of these "
                f"{len(exp['must_engage'])} points:\n{bullets(exp['must_engage'])}\n\n"
                "FAIL if it raises fewer, or only generic business advice.",
            )
            grader(
                d,
                "stays-in-character",
                {"type": "llm", "weight": 2},
                "The answer is meant to sound like a specific, well-known business figure judging a dossier, "
                "in French, from that person's way of thinking.\n\n"
                f"FAIL if the answer does any of these:\n{bullets(exp['must_not'])}\n"
                "- adds disclaimers or steps out of the role (a plain \"c'est hors de mon domaine\" or \"je n'ai pas pris position\" in his own voice is allowed, it is not a disclaimer; neither is the marking \"(connaissance générale, non vérifiée)\" that the persona must put on anything not coming from the dossier)\n"
                "- reads like a neutral consultant who could have been anyone\n\n"
                "Do not judge whether quotations are authentic: you cannot check them here.\n\n"
                "PASS otherwise.",
            )
            grader(
                d,
                "no-meta",
                {
                    "type": "regex",
                    "pattern": "'en tant qu.(IA|intelligence artificielle)|mod[eè]le de langage|je suis (une )?(IA|simulation)|persona|ma fiche'",
                    "flags": "i",
                    "match": "not_contains",
                    "target": "last_message",
                },
            )


def ask_cases() -> None:
    """Cas ASK : la consigne ASK appliquée à la fiche (v0.9.0), sur les dossiers des cas golden."""
    golden = {}
    for src in (EVALS / "sources" / "golden").glob("*.json"):
        for case in json.loads(src.read_text(encoding="utf-8"))["cases"]:
            golden[case["id"]] = case
    meta_pattern = "'en tant qu.(IA|intelligence artificielle)|mod[eè]le de langage|je suis (une )?(IA|simulation)|persona|ma fiche'"
    for case in json.loads((EVALS / "sources" / "ask" / "cases.json").read_text(encoding="utf-8"))["cases"]:
        slug = case["persona"]
        d = CASES / "ask" / case["id"]
        documents = ["--- Document : dossier du porteur ---", golden[case["golden"]]["dossier"]]
        if case["audit"]:
            documents += ["", "--- Document : Audit des chiffres ---", case["audit"]]
        write(
            d / "prompt.md",
            "\n".join(
                [
                    "---",
                    f"name: {case['id']}",
                    f"description: {slug}, consigne ASK" + (" avec audit" if case["audit"] else ""),
                    f"tags: [ask, {slug}]",
                    "runs: 1",
                    "max_turns: 12",
                    "timeout_seconds: 600",
                    "allowed_tools: [Agent, Read, Glob]",
                    "---",
                    "",
                    f"Utilise l'agent board:{slug} pour le tour ASK ci-dessous, en lui passant tout le texte qui suit. "
                    "Rends sa réponse telle quelle, sans commentaire ni reformulation.",
                    "",
                    "ASK",
                    f"SHEET: {SHEETS / (slug + '.md')}",
                    "DOCUMENTS: les documents sont donnés ci-dessous, dans ce message.",
                    f"QUESTION: {case['question']}",
                    "",
                    *documents,
                    "",
                ]
            ),
        )
        grader(d, "agent-used", {"type": "tool_used", "tool": "Agent", "input_match": f"'board:{slug}'"})
        need = max(1, round(len(case["own_questions"]) * 0.6))
        grader(
            d,
            "applies-sheet",
            {"type": "llm", "weight": 2},
            "The answer comes from a persona asked to judge the dossier through his own questions and rejects, "
            "not through a general review of the plan.\n\n"
            f"PASS if all three hold:\n- it puts at least {need} of these {len(case['own_questions'])} questions to "
            f"specific passages or figures of the dossier (in substance, not by keyword):\n{bullets(case['own_questions'])}\n"
            f"- it names, with the passage that triggers it, at least one of the persona's instant rejects or yeses found in this dossier: {case['instant']}\n"
            "- it gives its hardest attack on the plan before its recommendations on what the owner should do. "
            "A verdict in the opening lines, and judgments made while putting the questions to the dossier, are not recommendations.\n\n"
            "FAIL if it reads as a review any careful analyst could have written, or if the recommendations on what to do come before the attack.",
        )
        grader(
            d,
            "no-caricature",
            {"type": "llm", "weight": 1},
            "The answer is meant to sound like a specific, well-known business figure, in French. Style is not judged here: "
            "a signature word used often, a marked tone or a persona's turns of phrase are fine as long as the analysis "
            "rests on the dossier. What fails is a concept that stands in for an analysis.\n\n"
            "FAIL if the answer does any of these:\n"
            f"{bullets(case['must_not'])}\n"
            "- names a signature concept (moat, margin of safety, insanely great, default alive, paired indicator, schlep...) "
            "as if it were an argument, without applying it to a passage or a figure of the dossier\n"
            "- raises an objection on a point the dossier answers well, just to object\n"
            "- adds disclaimers or steps out of the role (a plain \"c'est hors de mon domaine\" in his own voice is allowed, "
            "and so is saying, in his own voice, that a field is not his own and that he reasons from his principles; "
            "so is the marking \"(connaissance générale, non vérifiée)\")\n"
            "- reads like a neutral consultant who could have been anyone\n\n"
            "Quoting a figure of an « Audit des chiffres » while saying it comes from the audit is relying on the audit, not redoing it: it is not a caricature. "
            "Do not judge whether quotations are authentic: you cannot check them here.\n\nPASS otherwise.",
        )
        if case["audit"]:
            grader(
                d,
                "uses-audit",
                {"type": "llm", "weight": 2},
                "The dossier came with an « Audit des chiffres » written by someone with no view on the plan. "
                "PASS if the answer relies on the audit instead of redoing it: it says which finding of the audit "
                "weighs most in its own way of judging, and adds at least one point the audit does not see. "
                "FAIL if it recomputes and restates the audit's figures as its own calculation, or ignores the audit.",
            )
        grader(d, "no-meta", {"type": "regex", "pattern": meta_pattern, "flags": "i", "match": "not_contains", "target": "last_message"})


def report_graders(d: Path, report: str, quick: bool) -> None:
    src = {"source": "file", "path": report}
    grader(d, "report-written", {"type": "file_exists", "path": f"'{report}'"})
    sections = ["## 1. Positions", "## 3. Recommandation", "## 5. Tests", "## 6. Dossier", "## Annexe"]
    if not quick:
        sections.insert(1, "## 2. Carte")
        sections.insert(3, "## 4. Limites")
    pattern = "".join(f"(?=[\\s\\S]*{s})" for s in sections)
    grader(
        d,
        "sections",
        {"type": "regex", "pattern": f"'{pattern}'", "target": json.dumps(src)},
    )
    grader(
        d,
        "no-numeric-score",
        {
            "type": "regex",
            "pattern": r"'\b\d+([.,]\d+)?\s*/\s*10\b'",
            "match": "not_contains",
            "target": json.dumps(src),
        },
    )
    grader(
        d,
        "positions-and-recommendation",
        {"type": "llm", "weight": 2, "focus": json.dumps(src)},
        "PASS if every expert has a position among Go, Go sous conditions, Pivot, Pas encore, Non, and the recommendation "
        "matches the distribution of final positions. If the experts split, the report must say so and name what "
        "separates them. FAIL if a consensus is presented that the positions do not support, or a position is missing.",
    )
    grader(
        d,
        "tests-trace-back",
        {"type": "llm", "focus": json.dumps(src)},
        "PASS if each row of the tests table traces to an expert's objection or to a risk named in the report, "
        "and risks nobody raised are labeled as the facilitator's. FAIL otherwise.",
    )
    grader(
        d,
        "annex-verbatim",
        {"type": "llm", "focus": json.dumps(src)},
        "PASS if the annex holds the expert answers per round, labeled by expert and round, and the round 1 brief. "
        "FAIL if answers are only summarized or missing.",
    )


def call_graders(d: Path, rounds: dict) -> None:
    for tag, (lo, hi) in rounds.items():
        front = {"type": "tool_used", "tool": "Agent", "input_match": f"'{tag}'", "min": lo}
        if hi is not None:
            front["max"] = hi
        grader(d, f"calls-{tag.lower().replace(' ', '-')}", front)
    grader(
        d,
        "round1-independent",
        {
            "type": "tool_used",
            "tool": "Agent",
            "input_match": "'ROUND 1.*(Objection principale|ferait changer)'",
            "min": 0,
            "max": 0,
        },
    )


def facilitator_cases() -> None:
    scenarios = {
        s["id"]: s
        for s in json.loads((EVALS / "facilitator" / "scenarios.json").read_text(encoding="utf-8"))["scenarios"]
    }
    pre = "Je valide d'avance le jury que tu proposeras : lance le débat sans attendre ma réponse."

    def head(name, desc, tags, tools, turns=80, timeout=3000):
        return "\n".join(
            [
                "---",
                f"name: {name}",
                f"description: {json.dumps(desc, ensure_ascii=False)}",
                f"tags: [{', '.join(tags)}]",
                "runs: 1",
                f"max_turns: {turns}",
                f"timeout_seconds: {timeout}",
                f"allowed_tools: [{', '.join(tools)}]",
                "---",
                "",
            ]
        )

    tools = ["Skill", "Agent", "Read", "Glob", "Write"]
    for sid, quick in (("fac-converge", False), ("fac-diverge", False), ("fac-quick", True)):
        sc = scenarios[sid]
        report = f"board-reports/eval-{sid}.md"
        d = CASES / "facilitator" / sid
        mode = " en mode éclair (--quick)" if quick else ""
        write(
            d / "prompt.md",
            head(sid, sc["notes"] or sid, ["facilitator", "expensive"], tools)
            + f"Utilise le skill board:debate{mode} pour challenger ce sujet, avec le rapport écrit dans "
            f"{report}.\n\nSujet : {sc['subject']}\n\n{pre}\n",
        )
        grader(d, "skill-used", {"type": "tool_used", "tool": "Skill", "input_match": "'debate'"})
        report_graders(d, report, quick)
        if quick:
            call_graders(d, {"ROUND 1": (4, 4), "ROUND 2": (4, 4), "ROUND 3": (0, 0), "DUEL": (0, 0)})
        else:
            call_graders(d, {"ROUND 1": (6, 9), "ROUND 2": (6, 9), "ROUND 3": (6, 9), "ROUND 4": (6, 9)})
        if sid == "fac-diverge":
            grader(
                d,
                "duel-rule",
                {"type": "llm", "focus": json.dumps({"source": "file", "path": report})},
                "PASS if the report contains a duel only when two experts held opposed positions after round 3 "
                "and refused the compromise on a point that is not a mere condition, and contains no duel otherwise. "
                "If there is a duel, it names the two most antagonistic experts, runs at most 3 turns each and the "
                "other experts are shown as jurors. FAIL otherwise.",
            )

    sc = scenarios["fac-thin"]
    d = CASES / "facilitator" / "fac-thin"
    write(
        d / "prompt.md",
        head("fac-thin", sc["notes"], ["facilitator"], ["Skill", "Agent", "Read", "Glob"], 20, 600)
        + f"Utilise le skill board:debate pour challenger ceci : {sc['subject']}\n",
    )
    grader(d, "skill-used", {"type": "tool_used", "tool": "Skill", "input_match": "'debate'"})
    grader(d, "no-agent-yet", {"type": "tool_used", "tool": "Agent", "min": 0, "max": 0})
    grader(
        d,
        "three-questions-max",
        {"type": "llm"},
        "PASS if the final message asks the user at most 3 clarifying questions, all in one message, about the "
        "essentials (target, problem, value proposition, price or model, figures). FAIL if it asks more than 3, "
        "asks them one at a time, or invents facts about the app.",
    )


def main() -> None:
    if CASES.exists():
        shutil.rmtree(CASES)
    golden_cases()
    ask_cases()
    facilitator_cases()
    n = sum(1 for _ in CASES.rglob("prompt.md"))
    print(f"{n} cases written under {CASES}")


main()
