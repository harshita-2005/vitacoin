/**
 * Cleanup MCQs: remove diagram-dependent questions, remove same/meaningless options,
 * fix unbalanced parentheses in options. Run: node scripts/cleanup_mcqs_diagrams_and_options.js
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../frontend/public/data/app_mcqs.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function isDiagramDependent(m) {
  const q = (m.question || '').toLowerCase();
  if (/given\s+tree|from\s+the\s+(following\s+)?given\s+tree|consider\s+the\s+tree\b|code\s+word\s+for\s+the\s+character/.test(q)) return true;
  if (/given\s+graph|from\s+the\s+given\s+graph|consider\s+the\s+graph\b|in\s+the\s+given\s+graph|traversal\s+of\s+the\s+given\s+graph/.test(q)) return true;
  if (/depth\s+first\s+traversal\s+in\s+the\s+foll|bfs\s+traversal\s+of\s+the\s+given|dfs\s+traversal\s+of\s+the\s+given/.test(q)) return true;
  if (/the\s+diagram\s+(given|below)|diagram\s+below\s+represents|from\s+the\s+figure|in\s+the\s+figure|see\s+the\s+figure/.test(q)) return true;
  if (/(figure|graph|tree|diagram)\s+(given|below)|as\s+shown\s+(below|in)|shown\s+below/.test(q) && /(tree|graph|figure|diagram)/.test(q)) return true;
  if (/given\s+graph\s+which\s+edge|minimum\s+spanning\s+tree\s+on\s+the\s+given|graph\s+shown\s+below|consider\s+the\s+graph\s+shown/.test(q)) return true;
  if (/consider\s+the\s+given\s+graph|shortest\s+path\s+.*given\s+graph|vertices\s+for\s+the\s+given\s+graph/.test(q)) return true;
  if (/adjacency\s+matrix\s+of\s+the\s+given|topological\s+sorting\s+of\s+the\s+g\b/.test(q)) return true;
  if (/construction\s+of\s+max-heap|essential\s+part\s+of\s+heap\s+sort\s+is\s+construction/.test(q)) return true;
  if (/original\s+array\s+[\d\s]+\.\s*how\s+many\s+comparis/.test(q)) return true;
  if (/consider\s+the\s+graph\s+m\s+with\s+\d+\s+vertices/.test(q)) return true;
  if (/edges\s+form\s+minimum\s+spanning\s+tree\s+on\s+the\s+given/.test(q)) return true;
  if (/consider\s+the\s+graph\s+shown\s+below/.test(q)) return true;
  if (/in\s+the\s+given\s+graph,?\s+identify\s+the\s+shortest\s+path/.test(q)) return true;
  return false;
}

function allOptionsSame(m) {
  const opts = (m.options || []).map(o => (o || '').trim());
  return opts.length === 4 && new Set(opts).size === 1;
}

// Two or more options with identical text (user asked: same options aren't repeated)
function hasDuplicateOptions(m) {
  const opts = (m.options || []).map(o => (o || '').trim());
  return opts.length === 4 && new Set(opts).size < 4;
}

function allOptionsSameOrMeaningless(m) {
  const opts = (m.options || []).map(o => (o || '').trim());
  if (opts.length !== 4 || new Set(opts).size !== 1) return false;
  const o = opts[0];
  if (o.length < 2) return true;
  if (o.length <= 5 && /^[a-zA-Z\d\s\(]+$/.test(o)) return true;
  return false;
}

function fixUnbalancedParens(str) {
  if (!str || typeof str !== 'string') return str;
  let open = 0;
  for (const c of str) {
    if (c === '(' || c === '[' || c === '{') open++;
    if (c === ')' || c === ']' || c === '}') open--;
  }
  if (open <= 0) return str;
  return str + ')'.repeat(open);
}

function hasUnbalancedParens(opts) {
  return (opts || []).some(o => {
    let open = 0;
    for (const c of (o || '')) {
      if (c === '(' || c === '[' || c === '{') open++;
      if (c === ')' || c === ']' || c === '}') open--;
    }
    return open !== 0 && (o || '').includes('(');
  });
}

const diagramIds = [];
const sameOptionIds = [];
const duplicateOptionIds = [];

// 1) Remove diagram-dependent, same/meaningless, and duplicate-option MCQs
let result = data.filter((m) => {
  if (isDiagramDependent(m)) {
    diagramIds.push(m.id);
    return false;
  }
  if (allOptionsSameOrMeaningless(m) || allOptionsSame(m)) {
    sameOptionIds.push(m.id);
    return false;
  }
  if (hasDuplicateOptions(m)) {
    duplicateOptionIds.push(m.id);
    return false;
  }
  return true;
});

// 2) Fix unbalanced parentheses in place
let fixedMcqCount = 0;
result.forEach((m) => {
  if (!m.options || !hasUnbalancedParens(m.options)) return;
  let changed = false;
  m.options = m.options.map((o) => {
    const fixed = fixUnbalancedParens(o);
    if (fixed !== o) changed = true;
    return fixed;
  });
  if (changed) fixedMcqCount++;
});

// 3) After fix, remove any that still have all four options identical or any duplicates
result = result.filter((m) => {
  if (allOptionsSame(m)) {
    sameOptionIds.push(m.id);
    return false;
  }
  if (hasDuplicateOptions(m)) {
    duplicateOptionIds.push(m.id);
    return false;
  }
  return true;
});

fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');

console.log('Removed diagram-dependent:', diagramIds.length);
console.log('Removed same/meaningless options:', sameOptionIds.length);
console.log('Removed duplicate-option MCQs:', duplicateOptionIds.length);
console.log('Fixed unbalanced parentheses in', fixedMcqCount, 'MCQs');
console.log('Final MCQ count:', result.length);
if (diagramIds.length) console.log('Diagram IDs:', diagramIds.join(', '));
if (sameOptionIds.length) console.log('Same/meaningless IDs (sample):', sameOptionIds.slice(0, 15).join(', '));
if (duplicateOptionIds.length) console.log('Duplicate-option IDs (sample):', duplicateOptionIds.slice(0, 15).join(', '));
