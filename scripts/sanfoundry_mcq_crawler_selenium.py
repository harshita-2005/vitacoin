#!/usr/bin/env python3
"""
Sanfoundry MCQ Crawler (Selenium) – follows chapter/sub-topic links to get 500+ MCQs per subject.
- Parses question vs options from combined text (a) b) c) d)) and strips "View Answer".
- Clicks "View Answer" to capture answer/explanation when possible.
- Hierarchy: subject (e.g. OS) -> topic (e.g. Processes) -> MCQs.
Output: scripts/cs_mcq_dataset.json (then run convert_mcq_to_app_format.py)
"""
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

BASE_URL = "https://www.sanfoundry.com"
DELAY_SECONDS = 1.5
PAGE_LOAD_WAIT = 2
MAX_CHAPTER_PAGES_PER_SUBJECT = 300

# Only these subjects and start URLs; only sublinks from each page are followed.
# Only these 5 subjects are crawled. No Misc / Computer Fundamentals.
# For DAA (Algorithms), only sublinks matching DAA_ALLOWED_TOPICS are followed.
DAA_ALLOWED_TOPICS = [
    "Searching", "Sorting", "Graph Search", "Minimum Spanning Tree", "Shortest Path",
    "Recursion", "Greedy Algorithms", "Backtracking", "Dynamic Programming", "Cryptography",
    "Checksum", "Complexity Classes", "NP Complete", "NP Complete Problems",
]

# (main_page_url, subject_name, allowed_topics=None). allowed_topics only for DAA.
START_PAGES = [
    ("https://www.sanfoundry.com/computer-network-questions-answers/", "CN", None),
    ("https://www.sanfoundry.com/operating-system-questions-answers/", "OS", None),
    ("https://www.sanfoundry.com/1000-database-management-system-questions-answers/", "DBMS", None),
    ("https://www.sanfoundry.com/1000-data-structure-questions-answers/", "DSA", None),
    ("https://www.sanfoundry.com/1000-data-structures-algorithms-ii-questions-answers/", "Algorithms", DAA_ALLOWED_TOPICS),
]

# URL path must contain one of these for a link to be followed (keeps sublinks within subject only).
SUBJECT_URL_SLUGS = {
    "OS": ["operating-system", "os"],
    "DBMS": ["database-management-system", "dbms", "database-mcqs"],
    "CN": ["computer-network", "computer-networks"],
    "DSA": ["data-structure", "data-structures"],
    "Algorithms": ["data-structures-algorithms", "algorithms"],
}

# Set to a subject key (e.g. "CN", "OS") to crawl only that subject. Use for reliable full data: run once per subject with FRESH_START=True only on first run (see README_MCQ_CRAWLER.md).
SINGLE_SUBJECT = "CN"
# When SINGLE_SUBJECT is set, limit topic pages so the test run is quick (e.g. 2 = main + 2 topic pages). None = no limit (full crawl).
MAX_TOPIC_PAGES_WHEN_SINGLE = None
# Resume from this subject (e.g. "OS" to keep CN and run OS, DBMS, DSA, Algorithms only). None = run all from CN.
START_FROM_SUBJECT = None
# True = ignore existing cs_mcq_dataset.json and collect from scratch (CN first). False = load existing and append next subject.
FRESH_START = True
# Create a new browser after each subject (frees memory; helps avoid crash on long subjects like CN).
RECREATE_DRIVER_AFTER_EACH_SUBJECT = True
# Seconds to wait after closing browser before starting the next (reduces "failed to write prefs file" / session errors).
DRIVER_RECREATE_DELAY_SEC = 10

mcq_dataset = []


def get_driver(headless=True):
    """Use minimal Chrome options so session creation is stable (same as test_one_subject_sample.py)."""
    opts = Options()
    if headless:
        opts.add_argument("--headless")  # more stable on Windows than --headless=new
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-infobars")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--disable-background-networking")
    opts.add_argument("--disable-sync")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    # Use Selenium 4's built-in driver manager (no webdriver-manager – avoids 15+ min hang on install())
    print("  [driver] Starting Chrome (Selenium will use/cache driver)...", flush=True)
    last_err = None
    for attempt in range(3):
        try:
            driver = webdriver.Chrome(options=opts)
            driver.set_page_load_timeout(90)
            return driver
        except Exception as e:
            last_err = e
            print(f"  [driver] Attempt {attempt + 1}/3 failed: {e}", flush=True)
            if attempt < 2:
                time.sleep(3)
                continue
            raise last_err
    raise last_err


def normalize_topic(heading_text):
    """e.g. '1. Processes' -> 'Processes'."""
    if not heading_text:
        return "Overview"
    return re.sub(r"^\d+\.\s*", "", heading_text).strip() or "Overview"


def _topic_matches_allowed(topic_text, link_text, allowed_topics):
    """True if topic or link text contains (case-insensitive) any of allowed_topics."""
    if not allowed_topics:
        return True
    combined = (topic_text or "") + " " + (link_text or "")
    combined = combined.lower()
    return any(kw.lower() in combined for kw in allowed_topics)


def _url_belongs_to_subject(url, subject):
    """True only if url path contains one of SUBJECT_URL_SLUGS for this subject (no Misc/other subjects)."""
    slugs = SUBJECT_URL_SLUGS.get(subject, [])
    url_lower = url.lower()
    return any(s in url_lower for s in slugs)


def get_chapter_links_from_html(html, subject_base_url, subject, allowed_topics=None):
    """
    From main subject page HTML, extract (topic, url) for chapter sublinks only.
    - OS/DBMS/Algorithms use table.sf-2col-tbl > td > li > a; prefer links from those tables when present.
    - Only links whose URL belongs to this subject (SUBJECT_URL_SLUGS) are included.
    - For DAA (allowed_topics set), only links whose topic/anchor matches DAA_ALLOWED_TOPICS.
    """
    soup = BeautifulSoup(html, "lxml")
    seen_urls = set()
    base_stripped = subject_base_url.rstrip("/")
    out = []
    # Prefer links inside table.sf-2col-tbl (OS, DBMS, DAA all use this structure)
    tables = soup.find_all("table", class_=lambda c: c and "sf-2col-tbl" in (c or []))
    if tables:
        link_containers = tables
    else:
        link_containers = [soup]
    for container in link_containers:
        for a in container.find_all("a", href=True):
            href = a.get("href", "")
            if not href or ("sanfoundry.com" not in href and not href.startswith("/")):
                continue
            url = href if href.startswith("http") else urljoin(BASE_URL, href)
            if "sanfoundry.com" not in url:
                continue
            # DBMS/Algorithms/OS use "mcqs" or "questions" in chapter URLs (table.sf-2col-tbl > td > li > a)
            if "questions-answers" not in url and "questions" not in url.lower() and "mcqs" not in url.lower():
                continue
            if url in seen_urls:
                continue
            if url.rstrip("/") == base_stripped:
                continue
            prev = a.find_previous(["h2", "h3", "h4", "h5", "strong", "b"])
            topic = normalize_topic(prev.get_text(strip=True)) if prev else "Other"
            link_text = a.get_text(strip=True)
            # Algorithms sub-pages use URLs like searching-multiple-choice-questions-mcq; allow by topic/URL
            if not _url_belongs_to_subject(url, subject):
                if subject == "Algorithms" and allowed_topics and (
                    _topic_matches_allowed(topic, link_text, allowed_topics)
                    or any(kw.lower() in url.lower() for kw in allowed_topics)
                ):
                    pass
                else:
                    continue
            if not _topic_matches_allowed(topic, link_text, allowed_topics):
                continue
            seen_urls.add(url)
            out.append((topic, url))
    return out


def parse_one_block(block_text):
    """
    Split combined '1. Question? a) A b) B c) C d) D' into question and 4 options.
    Returns (question, [opt1, opt2, opt3, opt4]) or (None, []) if not valid.
    """
    block_text = re.sub(r"\s+", " ", block_text).strip()
    block_text = block_text.replace("View Answer", "").strip()
    parts = re.split(r"\s*(?=[a-d]\))\s*", block_text, flags=re.IGNORECASE)
    if len(parts) < 5:
        return None, []
    question_raw = parts[0]
    question = re.sub(r"^\d+\.\s*", "", question_raw).strip()
    opts = []
    for i in range(1, 5):
        t = (parts[i] if i < len(parts) else "").strip()
        for prefix in ("a)", "b)", "c)", "d)", "A)", "B)", "C)", "D)"):
            if t.startswith(prefix):
                t = t[len(prefix) :].strip()
                break
        opts.append(t)
    if len(question) < 5:
        return None, []
    return question, opts


def _get_entry_content(soup):
    """Get the main content div: entry-content where MCQs live (p tags + collapseomatic_content divs)."""
    for selector in ["div.entry-content", "div[class*='entry-content']", "article", "main"]:
        el = soup.select_one(selector)
        if el and ("a)" in el.get_text() and "b)" in el.get_text() and "View Answer" in el.get_text()):
            return el
    return soup


def _is_mcq_paragraph(p_tag):
    """True if this <p> has question pattern and all four options (a) b) c) d))."""
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
    """
    Extract question and exactly 4 options from a <p> that contains:
    "N. Question text\na) opt1\nb) opt2\nc) opt3\nd) opt4\nView Answer"
    Options may be on separate lines (<br>) or inline. Returns (question, [opt_a, opt_b, opt_c, opt_d]) or (None, []).
    """
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
    """Find the 'View Answer' span/link in this <p>; its id is like 'id69a424abf2e17'. Return that id or None."""
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
    """Answer/explanation live in div with id='target-<view_answer_id>' e.g. target-id69a424abf2e17."""
    if not view_answer_id:
        return None
    target_id = "target-" + view_answer_id if not view_answer_id.startswith("target-") else view_answer_id
    div = soup_or_content.find("div", id=target_id)
    if div:
        return div
    return soup_or_content.find("div", id=re.compile(re.escape(target_id)))


def _parse_answer_div(div_tag):
    """From div (id=target-...) get 'Answer: d' and 'Explanation: ...'. Returns (letter, explanation)."""
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
    """
    Parse using DOM: <p> inside div.entry-content for question + options.
    Answer/explanation in div with id='target-<id>' where <id> is the View Answer span's id inside the same <p>.
    """
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


def get_answers_by_clicking_view_answer(driver, count):
    """
    Find up to `count` 'View Answer' buttons/links, click each, read revealed text.
    Returns list of (answer_text, explanation_text).
    """
    results = []
    try:
        buttons = driver.find_elements(By.XPATH, "//*[contains(text(),'View Answer')]")
        buttons = buttons[:count]
        for i, btn in enumerate(buttons):
            try:
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                time.sleep(0.2)
                btn.click()
                time.sleep(0.4)
                container = driver.find_elements(By.XPATH, "//*[contains(@class,'collapse') or contains(@class,'answer') or contains(@class,'solution')]")
                text = ""
                for el in container[-3:]:
                    if el.is_displayed():
                        text = el.text or ""
                        if text and len(text) > 5:
                            break
                if not text:
                    for el in driver.find_elements(By.XPATH, "//*[contains(translate(text(),'ANSWER','answer'),'answer')]"):
                        if el.is_displayed() and el.text:
                            text = el.text
                            break
                answer, explanation = "", ""
                if "answer:" in text.lower():
                    parts = re.split(r"answer:\s*", text, maxsplit=1, flags=re.IGNORECASE)
                    if len(parts) > 1:
                        rest = parts[1]
                        if "explanation:" in rest.lower():
                            sp = re.split(r"explanation:\s*", rest, maxsplit=1, flags=re.IGNORECASE)
                            answer = sp[0].strip()[:500]
                            explanation = sp[1].strip()[:1000] if len(sp) > 1 else ""
                        else:
                            answer = rest.strip()[:500]
                else:
                    answer = text.strip()[:500]
                results.append((answer, explanation))
            except Exception:
                results.append(("", ""))
    except Exception:
        pass
    while len(results) < count:
        results.append(("", ""))
    return results[:count]


def load_url_with_retry(driver, url, max_retries=2):
    """Same as single-subject: load URL with one retry on timeout."""
    for attempt in range(max_retries):
        try:
            driver.get(url)
            time.sleep(PAGE_LOAD_WAIT)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(3)
                continue
            raise e
    return False


def scrape_one_page(driver, url, subject, topic, try_view_answer=False):
    """Load URL, extract MCQs (question, options, answer, explanation) from HTML. No View Answer click (answers are parsed from page text)."""
    try:
        load_url_with_retry(driver, url)
    except Exception as e:
        print(f"    Load error: {e}")
        return []
    html = driver.page_source
    mcqs = extract_mcqs_from_html(html, subject, topic)
    return mcqs


def scrape_subject(driver, main_url, subject, allowed_topics=None):
    """Scrape main page + all chapter sub-topic pages for this subject. If allowed_topics is set (e.g. for DAA), only follow those topic links."""
    print(f"  [{subject}] Loading main: {main_url[:70]}...")
    try:
        load_url_with_retry(driver, main_url)
    except Exception as e:
        print(f"  Error: {e}")
        return
    html = driver.page_source
    chapter_links = get_chapter_links_from_html(html, main_url, subject, allowed_topics=allowed_topics)
    cap = MAX_TOPIC_PAGES_WHEN_SINGLE if SINGLE_SUBJECT else MAX_CHAPTER_PAGES_PER_SUBJECT
    chapter_links = chapter_links[:cap] if cap is not None else chapter_links
    print(f"  [{subject}] Found {len(chapter_links)} chapter/topic links" + (f" (capped at {cap})." if cap is not None else "."))

    main_mcqs = extract_mcqs_from_html(html, subject, "Overview")
    if main_mcqs:
        mcq_dataset.extend(main_mcqs)
        print(f"  [{subject}] Main page: {len(main_mcqs)} MCQs (total so far: {len(mcq_dataset)})")
    time.sleep(DELAY_SECONDS)

    for idx, (topic, sub_url) in enumerate(chapter_links):
        if len(mcq_dataset) > 5000:
            break
        print(f"  [{subject}] Topic '{topic[:40]}' ({idx + 1}/{len(chapter_links)}) ...")
        mcqs = scrape_one_page(driver, sub_url, subject, topic, try_view_answer=True)
        mcq_dataset.extend(mcqs)
        print(f"    -> {len(mcqs)} MCQs (total: {len(mcq_dataset)})")
        time.sleep(DELAY_SECONDS)


def _save_dataset(out_path):
    """Write current mcq_dataset to JSON (used on normal finish or on browser crash)."""
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(mcq_dataset, f, indent=2, ensure_ascii=False)


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

    print("Starting Sanfoundry MCQ crawler (batch: save after each subject). This may take a long time.\n")
    driver = None
    try:
        for i, (main_url, subject, allowed_topics) in enumerate(pages_to_run):
            if RECREATE_DRIVER_AFTER_EACH_SUBJECT and driver is not None:
                try:
                    driver.quit()
                except Exception:
                    pass
                driver = None
                print(f"  Waiting {DRIVER_RECREATE_DELAY_SEC}s before next browser...")
                time.sleep(DRIVER_RECREATE_DELAY_SEC)
            if driver is None:
                driver = get_driver(headless=True)
            print(f"Subject: {subject}")
            scrape_subject(driver, main_url, subject, allowed_topics=allowed_topics)
            print(f"  Total MCQs so far: {len(mcq_dataset)}\n")
            _save_dataset(out_path)
            print(f"  -> Saved to {out_path.name}\n")
    except Exception as e:
        _save_dataset(out_path)
        print(f"\nError (browser may have closed or connection lost): {e}")
        print(f"Saved {len(mcq_dataset)} MCQs to {out_path}")
        print("To resume, set START_FROM_SUBJECT = '<next_subject>' in the script and run again.")
        print("Then run:  python scripts/convert_mcq_to_app_format.py")
        sys.exit(1)
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    _save_dataset(out_path)
    print(f"Total MCQs collected: {len(mcq_dataset)}")
    print(f"Saved to: {out_path}")
    print("\nNext: run  python scripts/convert_mcq_to_app_format.py")


if __name__ == "__main__":
    main()
