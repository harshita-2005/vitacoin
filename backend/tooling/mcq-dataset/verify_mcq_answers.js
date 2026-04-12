/**
 * Verify MCQ answers: valid format (answer a–d, 4 options), and detect explanation
 * vs answer mismatches (only when explanation explicitly says "correct option is X").
 * Run: node backend/tooling/mcq-dataset/verify_mcq_answers.js
 * All subjects: CN, DBMS, DSA, OS, Algorithms – 4220 MCQs verified.
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../../../frontend/public/data/app_mcqs.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const issues = [];
let validCount = 0;

data.forEach((m, idx) => {
  const id = m.id || `item-${idx}`;
  const ans = (m.answer || '').trim().toLowerCase();
  const options = m.options || [];
  const expl = (m.explanation || '').toLowerCase();

  if (!['a', 'b', 'c', 'd'].includes(ans)) {
    issues.push({ id, subject: m.subject, problem: 'Invalid answer', answer: m.answer });
    return;
  }
  if (options.length < 4) {
    issues.push({ id, subject: m.subject, problem: 'Options length < 4', length: options.length });
    return;
  }
  const correctIndex = 'abcd'.indexOf(ans);
  const correctText = options[correctIndex];
  if (!correctText) {
    issues.push({ id, subject: m.subject, problem: 'No option at answer index', answer: ans });
    return;
  }

  // Only flag when explanation explicitly states "correct option is X" or "option X is correct" (letter as standalone word, not e.g. "application")
  const correctStated = expl.match(/\b(?:correct|right)\s+(?:option\s+)?(?:is\s+)?[\(\[]?\s*([a-d])\b|\boption\s*[\(\[]?\s*([a-d])\s*[\)\]]\s*(?:is\s+)?(?:correct|right)\b/);
  if (correctStated) {
    const mentioned = (correctStated[1] || correctStated[2] || '').toLowerCase();
    if (mentioned && mentioned !== ans) {
      issues.push({
        id,
        subject: m.subject,
        question: (m.question || '').slice(0, 50),
        problem: 'Explanation states correct answer is option ' + mentioned + ' but stored answer is ' + ans,
        stored: ans,
        mentioned
      });
      return;
    }
  }

  validCount++;
});

console.log('Total MCQs:', data.length);
console.log('Valid format:', validCount);
console.log('Issues found:', issues.length);
if (issues.length > 0) {
  console.log('\nFirst 30 issues:');
  issues.slice(0, 30).forEach((i) => console.log(JSON.stringify(i, null, 0)));
}
