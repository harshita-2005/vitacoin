/**
 * CS Fundamentals MCQs – load from single JSON (public/data/app_mcqs.json).
 * Run: python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py (writes JSON from cs_mcq_dataset.json).
 * No need for os.js, dbms.js, etc. – one source of truth.
 */

export const MCQ_SUBJECTS = [
  { key: 'all', label: 'All' },
  { key: 'OS', label: 'Operating Systems' },
  { key: 'DBMS', label: 'DBMS' },
  { key: 'CN', label: 'Computer Networks' },
  { key: 'DSA', label: 'Data Structures' },
  { key: 'Algorithms', label: 'Algorithms' },
  { key: 'OOP', label: 'OOP' },
  { key: 'Misc', label: 'Miscellaneous' }
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildApi(allMcqs) {
  const BY_SUBJECT = {};
  MCQ_SUBJECTS.forEach(({ key }) => {
    if (key === 'all') return;
    BY_SUBJECT[key] = (allMcqs || []).filter(m => m.subject === key);
  });
  const ALL_MCQS = allMcqs || [];

  function getMCQsBySubject(subjectKey) {
    if (!subjectKey || subjectKey === 'all') return shuffleArray(ALL_MCQS);
    const list = BY_SUBJECT[subjectKey] || [];
    return shuffleArray(list.map(m => ({ ...m, subject: subjectKey })));
  }

  function getTopicsBySubject(subjectKey) {
    if (!subjectKey || subjectKey === 'all') return [{ key: 'all', label: 'All Topics' }];
    const list = BY_SUBJECT[subjectKey] || [];
    const topics = [...new Set(list.map(m => (m.topic || 'Other').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return [{ key: 'all', label: 'All Topics' }, ...topics.map(t => ({ key: t, label: t }))];
  }

  function getMCQsBySubjectAndTopic(subjectKey, topicKey) {
    let list;
    if (!subjectKey || subjectKey === 'all') {
      list = [...ALL_MCQS];
    } else {
      const subList = BY_SUBJECT[subjectKey] || [];
      list = subList.map(m => ({ ...m, subject: subjectKey }));
    }
    if (topicKey && topicKey !== 'all') {
      list = list.filter(m => (m.topic || 'Other').trim() === topicKey);
    }
    return shuffleArray(list);
  }

  return { getMCQsBySubject, getTopicsBySubject, getMCQsBySubjectAndTopic };
}

/**
 * Shuffle option order for display. The dataset stores answer as "a"/"b"/"c"/"d" (original index).
 * After shuffling, we must remap the answer to the new index so correctness checks still work.
 */
function shuffleOptions(mcq) {
  if (!mcq || !mcq.options) return mcq;
  const indices = mcq.options.map((_, i) => i);
  const shuffled = shuffleArray(indices);
  const newOptions = shuffled.map(i => mcq.options[i]);
  const ans = (mcq.answer || '').trim().toLowerCase();
  let newAnswer = mcq.answer;
  if (['a', 'b', 'c', 'd'].includes(ans)) {
    const originalCorrectIndex = 'abcd'.indexOf(ans);
    const newCorrectIndex = shuffled.indexOf(originalCorrectIndex);
    if (newCorrectIndex >= 0) newAnswer = 'abcd'[newCorrectIndex];
  }
  return { ...mcq, options: newOptions, answer: newAnswer };
}

/** Promise that resolves to { getMCQsBySubject, getTopicsBySubject, getMCQsBySubjectAndTopic } once data is loaded. */
export const mcqDataReady = fetch(`${process.env.PUBLIC_URL || ''}/data/app_mcqs.json`)
  .then(r => {
    if (!r.ok) throw new Error('app_mcqs.json not found. Run: python backend/tooling/mcq-dataset/convert_mcq_to_app_format.py');
    return r.json();
  })
  .then(data => buildApi(Array.isArray(data) ? data : []));

/** Use after mcqDataReady resolves. Shuffles option order for a single MCQ. */
export { shuffleOptions };
