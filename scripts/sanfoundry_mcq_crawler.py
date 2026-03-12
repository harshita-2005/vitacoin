#!/usr/bin/env python3
"""
Sanfoundry MCQ Crawler – collects MCQs from Sanfoundry by subject.
Run locally: pip install requests beautifulsoup4 tqdm lxml
Then: python scripts/sanfoundry_mcq_crawler.py
Output: scripts/cs_mcq_dataset.json (then run convert_mcq_to_app_format.py)
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
from pathlib import Path

BASE_URL = "https://www.sanfoundry.com"
DELAY_SECONDS = 1.5  # Be polite to the server

START_PAGES = [
    ("https://www.sanfoundry.com/1000-computer-fundamentals-questions-answers/", "Misc"),
    ("https://www.sanfoundry.com/1000-operating-system-questions-answers/", "OS"),
    ("https://www.sanfoundry.com/1000-dbms-questions-answers/", "DBMS"),
    ("https://www.sanfoundry.com/1000-data-structure-questions-answers/", "DSA"),
    ("https://www.sanfoundry.com/1000-computer-network-questions-answers/", "CN"),
    # Uncomment to also crawl Algorithms / OOP (if URLs exist on Sanfoundry):
    # ("https://www.sanfoundry.com/1000-algorithms-questions-answers/", "Algorithms"),
    # ("https://www.sanfoundry.com/1000-oop-questions-answers/", "OOP"),
]

# Browser-like headers to reduce 403 (site often blocks plain script requests)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}

visited_pages = set()
mcq_dataset = []
session = requests.Session()
session.headers.update(HEADERS)


def normalize_option(text):
    """Strip leading a), b), c), d) and trim."""
    text = text.strip()
    for prefix in ("a)", "b)", "c)", "d)", "A)", "B)", "C)", "D)"):
        if text.startswith(prefix):
            return text[len(prefix):].strip()
    return text


def extract_mcqs(url, subject):
    try:
        res = session.get(url, timeout=15)
        res.raise_for_status()
    except Exception as e:
        print(f"  Request error: {e}")
        return
    soup = BeautifulSoup(res.text, "lxml")
    paragraphs = soup.find_all("p")
    current = None

    for p in paragraphs:
        text = p.get_text(strip=True)
        if not text:
            continue
        # Question: often starts with number. like "1. Which scheduling..."
        if re.match(r"^\d+\.\s", text) and len(text) > 20:
            current = {
                "subject": subject,
                "question": text,
                "options": [],
                "answer": "",
                "explanation": ""
            }
            mcq_dataset.append(current)
        elif current is not None and re.match(r"^[a-dA-D]\)", text):
            current["options"].append(normalize_option(text))
        elif current is not None and "answer:" in text.lower():
            current["answer"] = text.split(":", 1)[-1].strip()
        elif current is not None and "explanation:" in text.lower():
            current["explanation"] = text.split(":", 1)[-1].strip()


def get_links(url):
    try:
        res = session.get(url, timeout=15)
        res.raise_for_status()
    except Exception:
        return []
    soup = BeautifulSoup(res.text, "lxml")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href.startswith("http"):
            link = BASE_URL + href if href.startswith("/") else BASE_URL + "/" + href
        else:
            link = href
        if "sanfoundry.com" in link and "questions-answers" in link and link not in visited_pages:
            links.append(link)
    return list(dict.fromkeys(links))  # dedupe


def crawl(start_url, subject, max_pages_per_subject=50):
    queue = [start_url]
    pages_done = 0
    while queue and pages_done < max_pages_per_subject:
        url = queue.pop(0)
        if url in visited_pages:
            continue
        visited_pages.add(url)
        pages_done += 1
        print(f"  [{subject}] Scraping ({pages_done}): {url[:60]}...")
        try:
            extract_mcqs(url, subject)
            for link in get_links(url):
                if link not in visited_pages and link not in queue:
                    queue.append(link)
        except Exception as e:
            print(f"  Error: {e}")
        time.sleep(DELAY_SECONDS)


def main():
    script_dir = Path(__file__).resolve().parent
    out_path = script_dir / "cs_mcq_dataset.json"

    print("Starting Sanfoundry MCQ crawler (with delays). This may take a while.\n")
    # Warm-up: hit homepage first so we get cookies (helps avoid 403 on some sites)
    try:
        session.get(BASE_URL + "/", timeout=10)
        time.sleep(1)
    except Exception as e:
        print(f"Warm-up request failed: {e}\n")
    for start_url, subject in START_PAGES:
        print(f"Subject: {subject}")
        crawl(start_url, subject, max_pages_per_subject=50)
        print(f"  Total MCQs so far: {len(mcq_dataset)}\n")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(mcq_dataset, f, indent=2, ensure_ascii=False)

    print(f"Total MCQs collected: {len(mcq_dataset)}")
    print(f"Saved to: {out_path}")
    print("\nNext: run  python scripts/convert_mcq_to_app_format.py")


if __name__ == "__main__":
    main()
