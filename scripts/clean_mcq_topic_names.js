/**
 * One-off: clean topic names in app_mcqs.json by removing
 * "Multiple Choice Questions on ", "MCQs on ", "MCQ on ", "Computer Network MCQ on ", "Data Structure MCQ on ".
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../frontend/public/data/app_mcqs.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function cleanTopic(t) {
  if (!t || typeof t !== 'string') return t;
  let s = t
    .replace(/^Multiple Choice Questions on /i, '')
    .replace(/^MCQs on /i, '')
    .replace(/^Computer Network MCQ on /i, '')
    .replace(/^Data Structure MCQ on /i, '')
    .replace(/^MCQ on /i, '');
  return s.trim();
}

let changed = 0;
data.forEach((m) => {
  if (m.topic) {
    const cleaned = cleanTopic(m.topic);
    if (cleaned !== m.topic) {
      m.topic = cleaned;
      changed++;
    }
  }
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated', changed, 'topic fields. Unique topics now:', [...new Set(data.map((m) => m.topic))].sort().join(', '));
