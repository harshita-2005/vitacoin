#!/usr/bin/env python3
"""
Sanfoundry MCQ Crawler (requests + BeautifulSoup) – no browser, fast and stable.
- Same subjects and logic as Selenium version: CN, OS, DBMS, DSA, Algorithms.
- Extracts question, 4 options, answer (a/b/c/d), explanation from HTML.
- Output: backend/tooling/mcq-dataset/cs_mcq_dataset.json (then run convert_mcq_to_app_format.py)
"""
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.sanfoundry.com"
DELAY_SECONDS = 1.0
MAX_CHAPTER_PAGES_PER_SUBJECT = 300

# Same config as Selenium crawler
DAA_ALLOWED_TOPICS = [
    "Searching", "Sorting", "Graph Search", "Minimum Spanning Tree", "Shortest Path",
    "Recursion", "Greedy Algorithms", "Backtracking", "Dynamic Programming", "Cryptography",
    "Checksum", "Complexity Classes", "NP Complete", "NP Complete Problems",
]

START_PAGES = [
    ("https://www.sanfoundry.com/computer-network-questions-answers/", "CN", None),
    ("https://www.sanfoundry.com/operating-system-questions-answers/", "OS", None),
    ("https://www.sanfoundry.com/1000-database-management-system-questions-answers/", "DBMS", None),
    ("https://www.sanfoundry.com/1000-data-structure-questions-answers/", "DSA", None),
    ("https://www.sanfoundry.com/1000-data-structures-algorithms-ii-questions-answers/", "Algorithms", DAA_ALLOWED_TOPICS),
]

SUBJECT_URL_SLUGS = {
    "OS": ["operating-system"],
    "DBMS": ["database-management-system", "dbms"],
    "CN": ["computer-network", "computer-networks"],
    "DSA": ["data-structure", "data-structures"],
    "Algorithms": ["data-structures-algorithms", "algorithms"],
}

SINGLE_SUBJECT = None
MAX_TOPIC_PAGES_WHEN_SINGLE = None
START_FROM_SUBJECT = None
FRESH_START = True

mcq_dataset = []

# Browser-like headers to reduce 403
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


def get_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    s.timeout = 30
    return s


def fetch_url(session, url, max_retries=2):
    for attempt in range(max_retries):
        try:
            r = session.get(url)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            raise e
    return None


def normalize_topic(heading_text):
    if not heading_text:
        return "Overview"
    return re.sub(r"^\d+\.\s*", "", heading_text).strip() or "Overview"


def _topic_matches_allowed(topic_text, link_text, allowed_topics):
    if not allowed_topics:
        return True
    combined = (topic_text or "") + " " + (link_text or "")
    combined = combined.lower()
    return any(kw.lower() in combined for kw in allowed_topics)


def _url_belongs_to_subject(url, subject):
    slugs = SUBJECT_URL_SLUGS.get(subject, [])
    url_lower = url.lower()
    return any(s in url_lower for s in slugs)


def get_chapter_links_from_html(html, subject_base_url, subject, allowed_topics=None):
    soup = BeautifulSoup(html, "lxml")
    seen_urls = set()
    base_stripped = subject_base_url.rstrip("/")
    out = []
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if not href or ("sanfoundry.com" not in href and not href.startswith("/")):
            continue
        url = href if href.startswith("http") else urljoin(BASE_URL, href)
        if "sanfoundry.com" not in url:
            continue
        if "questions-answers" not in url and "questions" not in url.lower():
            continue
        if url in seen_urls:
            continue
        if url.rstrip("/") == base_stripped:
            continue
        if not _url_belongs_to_subject(url, subject):
            continue
        prev = a.find_previous(["h2", "h3", "h4", "h5", "strong", "b"])
        topic = normalize_topic(prev.get_text(strip=True)) if prev else "Other"
        link_text = a.get_text(strip=True)
        if not _topic_matches_allowed(topic, link_text, allowed_topics):
            continue
        seen_urls.add(url)
        out.append((topic, url))
    return out


def _get_entry_content(soup):
    for selector in ["div.entry-content", "div[class*='entry-content']", "article", "main"]:
        el = soup.select_one(selector)
        if el and ("a)" in el.get_text() and "b)" in el.get_text() and "View Answer" in el.get_text()):
            return el
    return soup


def _is_mcq_paragraph(p_tag):
    if p_tag.name != "p":
        return False
    text = (p_tag.get_text() or "").strip()
    if not re.search(r"^\d+\.\s+.", text):
        return False
    for opt in ("a)", "b)", "c)", "d)"):
        if opt not in text and opt.upper() not in text:
            return False
    return True


def _parse_mcq_from_p_tag(p_tag):
    text = p_tag.get_text(separator="\n")
    text = re.sub(r"\s*View Answer\s*", "\n", text, flags=re.IGNORECASE).strip()
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    question = None
    options = []
    for line in lines:
        if re.match(r"^\d+\.\s+.", line) and question is None:
            question = re.sub(r"^\d+\.\s*", "", line).strip()
            continue
        if len(options) >= 4:
            break
        m = re.match(r"^([a-dA-D])\)\s*(.*)$", line)
        if m:
            options.append((m.group(1).lower(), m.group(2).strip()))
            continue
        parts = re.split(r"\s*(?=[a-dA-D]\))\s*", line, flags=re.IGNORECASE)
        for part in parts:
            if len(options) >= 4:
                break
            m = re.match(r"^([a-dA-D])\)\s*(.*)$", part.strip())
            if m:
                options.append((m.group(1).lower(), m.group(2).strip()))
    if not question or len(options) != 4:
        return None, []
    opts_ordered = ["", "", "", ""]
    for letter, opt_text in options:
        idx = ord(letter) - ord("a")
        if 0 <= idx < 4:
            opts_ordered[idx] = opt_text
    if not all(opts_ordered):
        return None, []
    return question, opts_ordered


def _get_view_answer_span_id(p_tag):
    for tag in p_tag.find_all(["span", "a"]):
        tid = tag.get("id") or ""
        if not tid:
            continue
        text = tag.get_text() or ""
        title = (tag.get("title") or "").strip()
        if "View Answer" in text or title == "View Answer":
            return tid
    for tag in p_tag.find_all(True):
        if tag.get("id") and ("View Answer" in (tag.get_text() or "") or (tag.get("title") or "").strip() == "View Answer"):
            return tag.get("id")
    return None


def _find_answer_div_by_target_id(soup_or_content, view_answer_id):
    if not view_answer_id:
        return None
    target_id = "target-" + view_answer_id if not view_answer_id.startswith("target-") else view_answer_id
    div = soup_or_content.find("div", id=target_id)
    if div:
        return div
    return soup_or_content.find("div", id=re.compile(re.escape(target_id)))


def _parse_answer_div(div_tag):
    if not div_tag:
        return "", ""
    text = div_tag.get_text(separator="\n").strip()
    letter = ""
    m = re.search(r"Answer:\s*([a-dA-D])\b", text, re.IGNORECASE)
    if m:
        letter = m.group(1).strip().lower()
    exp = ""
    m = re.search(r"Explanation:\s*(.*)", text, re.DOTALL | re.IGNORECASE)
    if m:
        exp = m.group(1).strip()[:800]
        exp = re.sub(r"\s*advertisement\s*", " ", exp, flags=re.IGNORECASE).strip()
        exp = re.sub(r"\n\s*Sanfoundry.*", "", exp, flags=re.IGNORECASE).strip()
        exp = re.sub(r"\n\s*Chapterwise.*", "", exp, flags=re.IGNORECASE).strip()
    return letter, exp


def extract_mcqs_from_html(html, subject, topic):
    soup = BeautifulSoup(html, "lxml")
    content = _get_entry_content(soup)
    mcqs = []
    for p in content.find_all("p"):
        if not _is_mcq_paragraph(p):
            continue
        question, options = _parse_mcq_from_p_tag(p)
        if not question or len(options) != 4:
            continue
        view_answer_id = _get_view_answer_span_id(p)
        answer_div = _find_answer_div_by_target_id(content, view_answer_id) if view_answer_id else None
        if not answer_div and content != soup:
            answer_div = _find_answer_div_by_target_id(soup, view_answer_id)
        if not answer_div:
            answer_div = p.find_next("div", class_=lambda c: c and "collapseomatic_content" in " ".join(c or []))
        answer, explanation = _parse_answer_div(answer_div)
        if answer and answer not in ("a", "b", "c", "d"):
            answer = ""
        if answer and ("50k" in answer or "MCQs" in answer or len(answer) > 10):
            answer = ""
        mcqs.append({
            "subject": subject,
            "topic": topic,
            "question": question,
            "options": options,
            "answer": answer,
            "explanation": explanation,
        })
    return mcqs


def _save_dataset(out_path):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(mcq_dataset, f, indent=2, ensure_ascii=False)


def scrape_subject(session, main_url, subject, allowed_topics=None):
    global mcq_dataset
    print(f"  [{subject}] Loading main: {main_url[:70]}...")
    try:
        html = fetch_url(session, main_url)
    except Exception as e:
        print(f"  Request error: {e}")
        return
    time.sleep(DELAY_SECONDS)

    chapter_links = get_chapter_links_from_html(html, main_url, subject, allowed_topics=allowed_topics)
    cap = MAX_TOPIC_PAGES_WHEN_SINGLE if SINGLE_SUBJECT else MAX_CHAPTER_PAGES_PER_SUBJECT
    chapter_links = chapter_links[:cap] if cap is not None else chapter_links
    print(f"  [{subject}] Found {len(chapter_links)} chapter/topic links" + (f" (capped at {cap})." if cap else "."))

    main_mcqs = extract_mcqs_from_html(html, subject, "Overview")
    if main_mcqs:
        mcq_dataset.extend(main_mcqs)
        print(f"  [{subject}] Main page: {len(main_mcqs)} MCQs (total so far: {len(mcq_dataset)})")

    for idx, (topic, sub_url) in enumerate(chapter_links):
        if len(mcq_dataset) > 5000:
            break
        print(f"  [{subject}] Topic '{topic[:40]}' ({idx + 1}/{len(chapter_links)}) ...")
        try:
            page_html = fetch_url(session, sub_url)
            mcqs = extract_mcqs_from_html(page_html, subject, topic)
            mcq_dataset.extend(mcqs)
            print(f"    -> {len(mcqs)} MCQs (total: {len(mcq_dataset)})")
        except Exception as e:
            print(f"    Request error: {e}")
        time.sleep(DELAY_SECONDS)


def main():
    global mcq_dataset
    script_dir = Path(__file__).resolve().parent
    out_path = script_dir / "cs_mcq_dataset.json"

    if FRESH_START:
        mcq_dataset = []
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump([], f)
        print("FRESH_START: cleared dataset, starting from CN.\n")
    elif out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                mcq_dataset = json.load(f)
            print(f"Loaded existing {len(mcq_dataset)} MCQs from {out_path.name}\n")
        except Exception as e:
            print(f"Could not load existing dataset: {e}. Starting fresh.\n")
            mcq_dataset = []

    pages_to_run = START_PAGES
    if SINGLE_SUBJECT:
        pages_to_run = [(u, s, t) for u, s, t in START_PAGES if s == SINGLE_SUBJECT]
        cap_info = f" (max {MAX_TOPIC_PAGES_WHEN_SINGLE} topic pages)" if MAX_TOPIC_PAGES_WHEN_SINGLE else " (all topic pages)"
        print(f"Single-subject mode: only {SINGLE_SUBJECT}{cap_info}.\n")
    elif START_FROM_SUBJECT:
        idx = next((i for i, (_, s, _) in enumerate(START_PAGES) if s == START_FROM_SUBJECT), None)
        if idx is not None:
            pages_to_run = START_PAGES[idx:]
            subjects_to_replace = {s for (_, s, _) in pages_to_run}
            before = len(mcq_dataset)
            mcq_dataset = [m for m in mcq_dataset if m.get("subject") not in subjects_to_replace]
            if len(mcq_dataset) < before:
                print(f"Removed {before - len(mcq_dataset)} MCQs for subjects {subjects_to_replace} (will re-scrape).\n")
            print(f"Resuming from subject: {START_FROM_SUBJECT} ({len(pages_to_run)} subjects to run).\n")
        else:
            print(f"START_FROM_SUBJECT '{START_FROM_SUBJECT}' not in START_PAGES. Running all.\n")

    print("Starting Sanfoundry MCQ crawler (requests + BeautifulSoup). No browser required.\n")
    session = get_session()
    try:
        for main_url, subject, allowed_topics in pages_to_run:
            print(f"Subject: {subject}")
            scrape_subject(session, main_url, subject, allowed_topics=allowed_topics)
            print(f"  Total MCQs so far: {len(mcq_dataset)}\n")
            _save_dataset(out_path)
            print(f"  -> Saved to {out_path.name}\n")
    except Exception as e:
        _save_dataset(out_path)
        print(f"\nError: {e}")
        print(f"Saved {len(mcq_dataset)} MCQs to {out_path}")
        print("To resume, set START_FROM_SUBJECT = '<next_subject>' in the script and run again.")
        print("Then run:  python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py")
        sys.exit(1)

    _save_dataset(out_path)
    print(f"Total MCQs collected: {len(mcq_dataset)}")
    print(f"Saved to: {out_path}")
    print("\nNext: run  python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py")


if __name__ == "__main__":
    main()
