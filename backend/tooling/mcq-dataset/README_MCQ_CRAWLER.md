# MCQ dataset from Sanfoundry

This folder contains scripts to **collect MCQs from Sanfoundry** and convert them into the format used by the **Interview Arena → CS Fundamentals** section.

## 1. Install Python dependencies

```bash
cd E:\fouth_yr_projects\Vitacoin_User_interface_rewards_and_transactions
pip install -r backend/tooling/mcq-dataset/requirements.txt
```

This installs `requests`, `beautifulsoup4`, `lxml` (for the requests crawler) and optionally `selenium`, `webdriver-manager` (for the Selenium fallback). **No browser is required** for the requests crawler.

## 2. Run the crawler (requests + BeautifulSoup – recommended)

**Primary crawler:** `sanfoundry_mcq_crawler_requests.py` – no browser, fast, no Chrome crashes.

```bash
cd E:\fouth_yr_projects\Vitacoin_User_interface_rewards_and_transactions
python backend/tooling/mcq-dataset/sanfoundry_mcq_crawler_requests.py
```

Then convert to app format:

```bash
python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py
```

- **Output:** `backend/tooling/mcq-dataset/cs_mcq_dataset.json` → then `frontend/public/data/app_mcqs.json`.

If you get **403 Forbidden**, use the Selenium crawler instead (see section 4 below).

**Subjects covered (same as Selenium):** CN, OS, DBMS, DSA, Algorithms. No Misc / Computer Fundamentals.

**Resume / single subject:** Edit the top of `sanfoundry_mcq_crawler_requests.py`:
- `FRESH_START = False` and `START_FROM_SUBJECT = "OS"` to resume from OS (keeps existing CN data).
- `SINGLE_SUBJECT = "CN"` to crawl only CN (quick test).

## 3. Subject URLs and filters

| Subject   | Start URL | Sublinks |
|----------|-----------|----------|
| OS       | `operating-system-questions-answers/` | Only links containing `operating-system` |
| DBMS     | `1000-database-management-system-questions-answers/` | Only `database-management-system` or `dbms` |
| CN       | `computer-network-questions-answers/` | Only `computer-network` |
| DSA      | `1000-data-structure-questions-answers/` | Only `data-structure` |
| Algorithms (DAA) | `1000-data-structures-algorithms-ii-questions-answers/` | Only sublinks for: Searching, Sorting, Graph Search, Minimum Spanning Tree, Shortest Path, Recursion, Greedy Algorithms, Backtracking, Dynamic Programming, Cryptography, Checksum, Complexity Classes, NP Complete (Problems) |

## 4. Convert to app format

```bash
python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py
```

- **Input:** `backend/tooling/mcq-dataset/cs_mcq_dataset.json`
- **Output:** `frontend/public/data/app_mcqs.json` (single JSON; the app loads it at runtime).

The converter:

- Deduplicates by question text.
- Maps subject names to app keys (OS, DBMS, CN, DSA, Misc).
- Assigns `id`, `difficulty` (easy/medium/hard), and `reward` (10/12/15).
- Ensures each MCQ has exactly 4 options.

After this, restart the frontend dev server so it picks up the new `frontend/public/data/app_mcqs.json`.

## 5. Optional: add more subjects

Edit `backend/tooling/mcq-dataset/sanfoundry_mcq_crawler_requests.py` and add more entries to `START_PAGES`, for example:

```python
("https://www.sanfoundry.com/1000-algorithms-questions-answers/", "Algorithms"),
("https://www.sanfoundry.com/1000-oop-questions-answers/", "OOP"),
```

Then run the crawler again and the converter; it will only overwrite the subject files it generates (e.g. `algorithms.js`, `oop.js` if you add those and extend the converter to write them).

## If you get 403 Forbidden

Use the **Selenium crawler** instead – it drives a real Chrome browser (headless):

```bash
pip install selenium webdriver-manager
python backend/tooling/mcq-dataset/sanfoundry_mcq_crawler_selenium.py
python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py
```

Chrome or Chromium must be installed; `webdriver-manager` downloads the matching ChromeDriver. Same subjects and output format; use it only if the requests crawler is blocked.

## Notes

- **Legal / ToS:** Ensure your use of the crawled data complies with Sanfoundry’s terms of service and any copyright restrictions.
- **No scraping from this environment:** The crawler must be run on your machine; it is not executed by the app or by Cursor.
- **Strong dataset without 50k questions:** A few hundred MCQs per subject (e.g. 200 per subject) is usually enough for a rich-feeling Interview Arena.
