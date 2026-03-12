# Daily Challenge – FAQ (for teachers / evaluation)

Use these points when explaining how the Daily Challenge works.

---

## Does the daily challenge have 7 rounds?

**Yes.** The Daily Challenge always has **7 tasks** in total. These are grouped into **3 rounds**. Each round is one game type (e.g. Math Quiz, Pattern IQ, Code Breaker). The number of tasks per round varies (e.g. Round 1: 2 tasks, Round 2: 2 tasks, Round 3: 3 tasks = 7 total). So we say “7 tasks in 3 rounds” – same total every day.

---

## Do the 7 tasks come from the same dataset every time?

**No.** We do **not** use one fixed dataset for all days.

- **Same day, same recipe:** The *combination* of games and task counts (which game in round 1, round 2, round 3) is decided by a **date-based seed**. So on a given calendar day, every user gets the same *structure* (e.g. “Math Quiz → Pattern IQ → Code Breaker” with 2+2+3 tasks).
- **Different days, different mix:** The seed changes every day, so the order and mix of games change (e.g. Monday: Math, Pattern IQ, Word Shuffle; Tuesday: Verbal IQ, Code Breaker, Pattern IQ).
- **Questions themselves:** Within each game, questions are generated from:
  - **Procedural engines** (e.g. number patterns, coding–decoding) that create new questions each time.
  - **Curated + dynamic datasets** (e.g. word banks for Verbal IQ, with optional admin-added words from APIs). So the *content* is not a single static “same dataset” – it’s a mix of generated and stored data.

So: **same recipe per day for everyone; different recipe per day; question content comes from generators and expandable datasets, not one fixed list.**

---

## Do you guarantee uniqueness?

We guarantee **uniqueness in these ways**:

1. **Daily recipe:** The 3-round, 7-task combination is unique per day (date seed). No two days have the same order/mix unless we explicitly reuse a seed.
2. **Variety over time:**  
   - Pattern IQ and Code Breaker use **procedural generation** (many pattern types, random parameters), so repeated plays produce different questions.  
   - Verbal IQ uses a **word bank** and avoids reusing the same word for different synonym/antonym questions in a session; grammar questions are drawn from a pool with difficulty and reuse checks.  
   - Admin can **add data** (e.g. from external APIs) to grow the pool, which increases variety for returning users.
3. **What we don’t guarantee:** We don’t guarantee that *every* question across *all* users and *all* time is globally unique (like a UUID). We *do* guarantee that the daily challenge is **date-driven**, **varied day-to-day**, and that **content is generated/curated to reduce repetition** for the same user over multiple days.

So in short: **we guarantee a unique daily recipe per day and design the system so that question content is varied and not the same fixed set every time; we don’t promise every single question is unique across the entire system forever.**

---

## Reward system (coins and XP)

- **Fixed part:** Users get a **fixed reward** just for **completing** the 7 tasks (e.g. 5 coins + 10 XP).
- **Variable part:** They get **extra** coins and XP based on **how many tasks they answered correctly** (e.g. up to 10 more coins and 15 more XP when all 7 are correct).
- The UI shows this breakdown after completion: “Completion bonus” and “Correct answers (X/7)” and “Total earned.”

This is documented in the backend constants and in the Daily Challenge card UI.
