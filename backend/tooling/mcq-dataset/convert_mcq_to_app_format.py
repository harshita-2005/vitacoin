#!/usr/bin/env python3
"""
Converts cs_mcq_dataset.json (from the Sanfoundry crawler) into a single
app-ready JSON: frontend/public/data/app_mcqs.json (frontend loads from this).
"""
import json
import re
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent.parent
INPUT_PATH = SCRIPT_DIR / "cs_mcq_dataset.json"
PUBLIC_DATA_DIR = REPO_ROOT / "frontend" / "public" / "data"

# Map crawler subject names to our app keys
SUBJECT_MAP = {
    "os": "OS",
    "operating system": "OS",
    "operating systems": "OS",
    "dbms": "DBMS",
    "database": "DBMS",
    "cn": "CN",
    "computer network": "CN",
    "computer networks": "CN",
    "networks": "CN",
    "dsa": "DSA",
    "data structure": "DSA",
    "data structures": "DSA",
    "algorithms": "Algorithms",
    "algorithm": "Algorithms",
    "oop": "OOP",
    "object oriented": "OOP",
    "computer fundamentals": "Misc",
    "fundamentals": "Misc",
    "misc": "Misc",
    "miscellaneous": "Misc",
}


def normalize_subject(raw):
    raw = (raw or "").strip().lower()
    return SUBJECT_MAP.get(raw) or SUBJECT_MAP.get(raw.replace(" ", "")) or "Misc"


def clean_question(text):
    """Remove leading '1. ', '2. ' etc."""
    if not text:
        return ""
    return re.sub(r"^\d+\.\s*", "", text).strip()


def parse_question_and_options_from_inline(question_text):
    """
    If question contains 'a) b) c) d)' inline, split into clean question and options list.
    Returns (question, [opt1, opt2, opt3, opt4]) or (question_text, []).
    """
    if not question_text or "a)" not in question_text:
        return question_text, []
    text = re.sub(r"\s+", " ", question_text).strip()
    text = text.replace("View Answer", "").strip()
    parts = re.split(r"\s*(?=[a-d]\))\s*", text, flags=re.IGNORECASE)
    if len(parts) < 5:
        return question_text, []
    q = re.sub(r"^\d+\.\s*", "", parts[0]).strip()
    opts = []
    for i in range(1, 5):
        t = parts[i].strip()
        for prefix in ("a)", "b)", "c)", "d)", "A)", "B)", "C)", "D)"):
            if t.startswith(prefix):
                t = t[len(prefix) :].strip()
                break
        opts.append(t)
    return q, opts


def ensure_four_options(options):
    """Ensure we have exactly 4 option strings; pad or trim."""
    if not options:
        return ["", "", "", ""]
    opts = [str(o).strip() for o in options[:4]]
    while len(opts) < 4:
        opts.append("")
    return opts[:4]


def assign_difficulty_and_reward(index):
    """Simple heuristic: every 3rd easy, 3rd medium, 3rd hard for variety."""
    r = index % 3
    if r == 0:
        return "easy", 10
    if r == 1:
        return "medium", 12
    return "hard", 15


def dedupe_by_question(items):
    seen = set()
    out = []
    for item in items:
        q = (item.get("question") or "").strip().lower()[:200]
        if q in seen:
            continue
        seen.add(q)
        out.append(item)
    return out


def main():
    if not INPUT_PATH.exists():
        print(f"Missing {INPUT_PATH}. Run sanfoundry_mcq_crawler.py first.")
        return

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    by_subject = defaultdict(list)
    for item in raw:
        sub = normalize_subject(item.get("subject", ""))
        question_raw = item.get("question", "")
        question = clean_question(question_raw)
        if len(question) < 10:
            continue
        options = item.get("options") or []
        if not options or (len(options) == 1 and "View Answer" in str(options[0])):
            question, options = parse_question_and_options_from_inline(question_raw)
        if len(question) < 10:
            continue
        answer = (item.get("answer") or "").strip()
        explanation = (item.get("explanation") or "").strip()
        if ("50k" in answer and "MCQs" in answer) or len(answer) > 400:
            answer = ""
        by_subject[sub].append({
            "question": question,
            "options": options,
            "answer": answer,
            "explanation": explanation,
            "topic": (item.get("topic") or "").strip(),
        })

    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    all_mcqs_for_json = []

    for subject, items in by_subject.items():
        items = dedupe_by_question(items)
        for i, row in enumerate(items):
            diff, reward = assign_difficulty_and_reward(i)
            opts = ensure_four_options(row["options"])
            ans = (row["answer"] or "").strip()
            obj = {
                "id": f"{subject.lower()}-{i + 1}",
                "subject": subject,
                "difficulty": diff,
                "question": row["question"],
                "options": opts,
                "answer": ans,
                "explanation": row["explanation"],
                "reward": reward,
            }
            if row.get("topic"):
                obj["topic"] = row["topic"]
            all_mcqs_for_json.append(obj)
        print(f"  {subject}: {len(items)} MCQs")

    json_path = PUBLIC_DATA_DIR / "app_mcqs.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_mcqs_for_json, f, indent=0, ensure_ascii=False)
    print(f"\n  Single JSON: {len(all_mcqs_for_json)} MCQs -> {json_path}")

    print("\nDone. frontend can load from public/data/app_mcqs.json (no .js files needed). Restart dev server if needed.")


if __name__ == "__main__":
    main()
