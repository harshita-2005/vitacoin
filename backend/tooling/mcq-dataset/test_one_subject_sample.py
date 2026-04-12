#!/usr/bin/env python3
"""
Full MCQ crawl using the same working logic as the single-page test.
- Uses Selenium (get_driver + scrape_one_page) for all 5 subjects and their sublinks.
- For Algorithms (DAA), only sublinks matching DAA_ALLOWED_TOPICS are followed.
- Saves after each subject; recreates driver after each subject to avoid crashes.
Run: python backend/tooling/mcq-dataset/test_one_subject_sample.py
Then: python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sanfoundry_mcq_crawler_selenium import (
    get_driver,
    scrape_one_page,
    get_chapter_links_from_html,
    extract_mcqs_from_html,
    load_url_with_retry,
    START_PAGES,
    DELAY_SECONDS,
    MAX_CHAPTER_PAGES_PER_SUBJECT,
)

# Set to a subject name (e.g. "OS") to crawl only that subject and merge into existing JSON; None = all 5 subjects.
SINGLE_SUBJECT = "OS"
# When scraping only Algorithms: resume from this topic number (1-based). E.g. 69 = skip topics 1–68. None = scrape all.
RESUME_ALGORITHMS_FROM_TOPIC = None
# Resume from this subject (e.g. "DBMS") – keeps CN, OS; re-scrapes DBMS, DSA, Algorithms. None = run all.
START_FROM_SUBJECT = None
# True = clear existing dataset and start fresh; False = load existing and append (or resume when START_FROM_SUBJECT set).
FRESH_START = False
# Recreate browser after each subject (recommended to avoid long-run crashes).
RECREATE_DRIVER_AFTER_EACH_SUBJECT = True
DRIVER_RECREATE_DELAY_SEC = 5


def main():
    script_dir = Path(__file__).resolve().parent
    out_path = script_dir / "cs_mcq_dataset.json"
    collected = []

    if FRESH_START:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump([], f)
        print("FRESH_START: cleared dataset.\n")
    elif out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                collected = json.load(f)
            print(f"Loaded {len(collected)} existing MCQs.\n")
        except Exception as e:
            print(f"Could not load existing: {e}. Starting fresh.\n")

    pages_to_run = START_PAGES
    if SINGLE_SUBJECT:
        pages_to_run = [(u, s, t) for u, s, t in START_PAGES if s == SINGLE_SUBJECT]
        resume_from_topic = RESUME_ALGORITHMS_FROM_TOPIC if SINGLE_SUBJECT == "Algorithms" else None
        if resume_from_topic:
            print(f"Single-subject mode: {SINGLE_SUBJECT} (resume from topic {resume_from_topic}, keep existing data).\n")
        else:
            before = len(collected)
            collected = [m for m in collected if m.get("subject") != SINGLE_SUBJECT]
            print(f"Single-subject mode: {SINGLE_SUBJECT} (kept {len(collected)} MCQs, will replace/add {SINGLE_SUBJECT} only).\n")
    elif START_FROM_SUBJECT:
        idx = next((i for i, (_, s, _) in enumerate(START_PAGES) if s == START_FROM_SUBJECT), None)
        if idx is not None:
            pages_to_run = START_PAGES[idx:]
            subjects_to_drop = {s for (_, s, _) in pages_to_run}
            before = len(collected)
            collected = [m for m in collected if m.get("subject") not in subjects_to_drop]
            print(f"Resume from {START_FROM_SUBJECT}: kept {len(collected)} MCQs, will re-scrape {[s for (_, s, _) in pages_to_run]}.\n")
        else:
            print(f"START_FROM_SUBJECT '{START_FROM_SUBJECT}' not in START_PAGES. Running all.\n")

    print("Starting full crawl (same logic as OS test). All subjects + sublinks; DAA filtered by DAA_ALLOWED_TOPICS.\n", flush=True)
    driver = None
    try:
        for main_url, subject, allowed_topics in pages_to_run:
            if RECREATE_DRIVER_AFTER_EACH_SUBJECT and driver is not None:
                try:
                    driver.quit()
                except Exception:
                    pass
                driver = None
                print(f"  Waiting {DRIVER_RECREATE_DELAY_SEC}s before next browser...")
                time.sleep(DRIVER_RECREATE_DELAY_SEC)
            if driver is None:
                print("  Launching browser (first time may download ChromeDriver, wait 1–2 min)...")
                sys.stdout.flush()
                driver = get_driver(headless=True)
                print("  Browser ready.\n")

            print(f"Subject: {subject}")
            print(f"  [{subject}] Loading main: {main_url[:70]}...")
            try:
                load_url_with_retry(driver, main_url)
            except Exception as e:
                print(f"  Error: {e}")
                continue
            time.sleep(1)
            html = driver.page_source
            chapter_links = get_chapter_links_from_html(html, main_url, subject, allowed_topics=allowed_topics)
            chapter_links = chapter_links[:MAX_CHAPTER_PAGES_PER_SUBJECT]
            resume_from = RESUME_ALGORITHMS_FROM_TOPIC if (SINGLE_SUBJECT == "Algorithms" and RESUME_ALGORITHMS_FROM_TOPIC) else None
            if resume_from:
                total_chapters = len(chapter_links)
                chapter_links = chapter_links[resume_from - 1:]
                print(f"  [{subject}] Found {total_chapters} chapter/topic links; resuming from topic {resume_from} ({len(chapter_links)} left).")
            else:
                total_chapters = len(chapter_links)
                print(f"  [{subject}] Found {len(chapter_links)} chapter/topic links.")

            if not resume_from:
                main_mcqs = extract_mcqs_from_html(html, subject, "Overview")
                collected.extend(main_mcqs)
                if main_mcqs:
                    print(f"  [{subject}] Main page: {len(main_mcqs)} MCQs (total so far: {len(collected)})")
            time.sleep(DELAY_SECONDS)

            for idx, (topic, sub_url) in enumerate(chapter_links):
                if len(collected) > 5000:
                    break
                current = (idx + resume_from) if resume_from else (idx + 1)
                print(f"  [{subject}] Topic '{topic[:40]}' ({current}/{total_chapters}) ...")
                mcqs = scrape_one_page(driver, sub_url, subject, topic, try_view_answer=True)
                collected.extend(mcqs)
                print(f"    -> {len(mcqs)} MCQs (total: {len(collected)})")
                time.sleep(DELAY_SECONDS)

            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(collected, f, indent=2, ensure_ascii=False)
            print(f"  -> Saved {len(collected)} MCQs to {out_path.name}\n")
    except Exception as e:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(collected, f, indent=2, ensure_ascii=False)
        print(f"\nError: {e}")
        print(f"Saved {len(collected)} MCQs to {out_path}")
        sys.exit(1)
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    print(f"Total MCQs collected: {len(collected)}")
    print(f"Saved to: {out_path}")
    print("\n=== First 3 entries (check question / options / answer) ===\n")
    for i, m in enumerate(collected[:3], 1):
        print(f"--- MCQ {i} ---")
        print("subject:", m.get("subject"))
        print("topic:", m.get("topic"))
        q = m.get("question") or ""
        print("question:", q[:120] + ("..." if len(q) > 120 else ""))
        print("options:", m.get("options"))
        a = m.get("answer") or ""
        print("answer:", a[:80] + ("..." if len(a) > 80 else ""))
        e = m.get("explanation") or ""
        print("explanation:", e[:80] + ("..." if len(e) > 80 else ""))
        print()
    print("Next: run  python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py")


if __name__ == "__main__":
    main()
