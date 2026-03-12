import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

/* ---------------- UTILITIES ---------------- */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const uniqueOptions = (correct, generator) => {
  const set = new Set([correct]);
  // Safety cap to avoid infinite loops if a generator can't produce enough unique values
  let attempts = 0;
  while (set.size < 4 && attempts < 200) {
    set.add(generator());
    attempts += 1;
  }

  // Last-resort fallback: deterministically pad options (only used if generator is poor)
  if (set.size < 4) {
    if (typeof correct === "number" && Number.isFinite(correct)) {
      for (let i = 1; set.size < 4; i += 1) {
        set.add(correct + i);
      }
    } else if (typeof correct === "string") {
      for (let i = 0; set.size < 4 && i < letters.length; i += 1) {
        set.add(letters[i]);
      }
    } else {
      for (let i = 1; set.size < 4; i += 1) {
        set.add(String(correct) + i);
      }
    }
  }
  return shuffle([...set]);
};

const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43];
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/* ---------------- PUZZLE GENERATORS ---------------- */

const arithmetic = () => {
  const start = rand(2,20);
  const diff = rand(2,5);
  const series = [start,start+diff,start+2*diff,start+3*diff,"?"];
  const answer = start+4*diff;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-5,5))
  };
};

const geometric = () => {
  const start = rand(2,5);
  const ratio = rand(2,3);
  const series=[start,start*ratio,start*ratio**2,start*ratio**3,"?"];
  const answer=start*ratio**4;

  return {
    series,
    answer,
    // Use additive offsets to guarantee many unique distractors
    options: uniqueOptions(answer, () => answer + rand(-20, 20))
  };
};

const letterSeries = () => {
  const step = rand(1,3);
  const start = rand(0,20);

  const series=[
    letters[start],
    letters[start+step],
    letters[start+step*2],
    letters[start+step*3],
    "?"
  ];

  const answer = letters[start+step*4];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => letters[rand(0,25)])
  };
};

const squares = () => {
  const n = rand(2,6);
  const series=[n**2,(n+1)**2,(n+2)**2,(n+3)**2,"?"];
  const answer=(n+4)**2;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-10,10))
  };
};

const cubes = () => {
  const n = rand(1,4);
  const series=[n**3,(n+1)**3,(n+2)**3,(n+3)**3,"?"];
  const answer=(n+4)**3;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-20,20))
  };
};

const primeSeries = () => {
  const start = rand(0,4);

  const series=[
    primes[start],
    primes[start+1],
    primes[start+2],
    primes[start+3],
    "?"
  ];

  const answer = primes[start+4];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => primes[rand(0,8)])
  };
};

const fibonacci = () => {
  let a = rand(1,5);
  let b = rand(1,5);

  const series=[a,b];
  for(let i=2;i<5;i++) series.push(series[i-1]+series[i-2]);

  const answer=series[4]+series[3];
  series.push("?");

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-5,5))
  };
};

// Dynamic fraction series like 1/3,1/6,1/12,...
const fractions = () => {
  const base = rand(2,4);

  const series = [
    `1/${base}`,
    `1/${base * 2}`,
    `1/${base * 4}`,
    `1/${base * 8}`,
    "?"
  ];

  const answer = `1/${base * 16}`;

  return {
    series,
    answer,
    options: shuffle([
      answer,
      `1/${base * 12}`,
      `1/${base * 20}`,
      `1/${base * 24}`
    ])
  };
};

// Alternating pattern: +a, -b, +a, -b, ...
// Example: 2,5,4,7,6,?
const alternatingSeries = () => {
  const start = rand(2,10);
  const a = rand(2,5);
  const b = rand(1,3);

  const series = [
    start,
    start + a,
    start + a - b,
    start + a - b + a,
    start + a - b + a - b,
    "?"
  ];

  const answer = start + a - b + a - b + a;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-6,6))
  };
};

// Double step: ×2, +1, ×2, +1, ...
// Example: 3,6,7,14,15,?
const doubleStepSeries = () => {
  const start = rand(2,5);

  const series = [
    start,
    start * 2,
    start * 2 + 1,
    (start * 2 + 1) * 2,
    (start * 2 + 1) * 2 + 1,
    "?"
  ];

  const answer = ((start * 2 + 1) * 2 + 1) * 2;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-10,10))
  };
};

// Mixed operations: ×3,+2,×3,+2,...
// Example: 3,9,11,33,35,?
const mixedOperations = () => {
  const start = rand(2,5);

  const series = [
    start,
    start * 3,
    start * 3 + 2,
    (start * 3 + 2) * 3,
    (start * 3 + 2) * 3 + 2,
    "?"
  ];

  const answer = ((start * 3 + 2) * 3 + 2) * 3;

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => answer + rand(-20,20))
  };
};

/* ---------------- LETTER PATTERN PUZZLES ---------------- */

// Simple forward letter steps (e.g. B E H K ?)
const letterStepSeries = () => {
  const step = rand(2,4);
  const start = rand(0, 25 - step * 4);

  const series = [
    letters[start],
    letters[start + step],
    letters[start + step * 2],
    letters[start + step * 3],
    "?"
  ];

  const answer = letters[start + step * 4];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => letters[rand(0,25)])
  };
};

// Reverse alphabet pattern (e.g. Z X V T ?)
const reverseLetterSeries = () => {
  const step = rand(1,3);
  const start = rand(3 + step * 4, 25); // ensure we don't go below 0 when stepping back

  const series = [
    letters[start],
    letters[start - step],
    letters[start - step * 2],
    letters[start - step * 3],
    "?"
  ];

  const answer = letters[start - step * 4];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => letters[rand(0,25)])
  };
};

// Alternating letter jumps (e.g. A D B E C ?)
const alternatingLetters = () => {
  const start = rand(0,20); // start+5 must be <=25

  const series = [
    letters[start],
    letters[start + 3],
    letters[start + 1],
    letters[start + 4],
    letters[start + 2],
    "?"
  ];

  const answer = letters[start + 5];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => letters[rand(0,25)])
  };
};

// Pair pattern like AZ BY CX ?
const pairSeries = () => {
  const start = rand(0,22); // up to start+3 <=25

  const series = [
    letters[start] + letters[25 - start],
    letters[start + 1] + letters[24 - start],
    letters[start + 2] + letters[23 - start],
    "?"
  ];

  const answer = letters[start + 3] + letters[22 - start];

  return {
    series,
    answer,
    options: shuffle([
      answer,
      letters[start + 3] + letters[21 - start],
      letters[start + 4] + letters[22 - start],
      letters[start + 2] + letters[22 - start]
    ])
  };
};

// Alphabet growth using increasing gaps (e.g. A C F J ?)
const alphabetGrowth = () => {
  const start = rand(0,10); // start+14 <=24

  const series = [
    letters[start],
    letters[start + 2],
    letters[start + 5],
    letters[start + 9],
    "?"
  ];

  const answer = letters[start + 14];

  return {
    series,
    answer,
    options: uniqueOptions(answer, () => letters[rand(0,25)])
  };
};

/* ---------------- PUZZLE SELECTOR ---------------- */

const getPuzzlePool = (difficulty) => {
  if (difficulty === "easy") {
    return [
      arithmetic,
      geometric,
      letterSeries,
      letterStepSeries
    ];
  }

  if (difficulty === "medium") {
    return [
      arithmetic,
      geometric,
      squares,
      cubes,
      primeSeries,
      alternatingSeries,
      letterStepSeries,
      reverseLetterSeries
    ];
  }

  // hard
  return [
    squares,
    cubes,
    primeSeries,
    fibonacci,
    fractions,
    alternatingSeries,
    doubleStepSeries,
    mixedOperations,
    // additional letter-based puzzles for variety
    letterStepSeries,
    reverseLetterSeries,
    alternatingLetters,
    pairSeries,
    alphabetGrowth
  ];
};

/* ---------------- COMPONENT ---------------- */

const PuzzleSolver = ({
  onComplete,
  isPaused,
  difficulty="easy",
  onScoreUpdate,
  resetKey=0,
  dailyChallengeTasks
}) => {

  const configMap={
    easy:{count:8,time:15},
    medium:{count:15,time:18},
    hard:{count:20,time:22}
  };

  const baseConfig=configMap[difficulty]||configMap.easy;
  const count=dailyChallengeTasks??baseConfig.count;
  const puzzleTime=baseConfig.time;

  const puzzles = useMemo(() => {
    const basePool = shuffle(getPuzzlePool(difficulty));
    // Rotate pool based on resetKey so restart changes pattern sequence
    const offset = basePool.length > 0 ? resetKey % basePool.length : 0;
    const rotatedPool =
      offset === 0
        ? basePool
        : [...basePool.slice(offset), ...basePool.slice(0, offset)];

    const generated = [];
    for (let i = 0; i < count; i += 1) {
      const generator = rotatedPool[i % rotatedPool.length];
      generated.push(generator());
    }

    // Extra shuffle so order feels different across sessions
    return shuffle(generated);
  }, [difficulty, count, resetKey]);

  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState(null);
  const [score,setScore]=useState(0);
  const [correct,setCorrect]=useState(0);
  const [time,setTime]=useState(puzzleTime);
  const [gameActive,setGameActive]=useState(false);

  const timerRef=useRef(null);

  /* ---------- INITIALIZE GAME ---------- */

  useEffect(()=>{
    // Start immediately on mount and restart whenever `resetKey` changes.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIndex(0);
    setSelected(null);
    setScore(0);
    setCorrect(0);
    setTime(puzzleTime);
    setGameActive(true);
  },[resetKey,puzzleTime,difficulty]);

  /* ---------- TIMER ---------- */

  useEffect(()=>{

    if(!gameActive) return;

    if(timerRef.current) clearInterval(timerRef.current);

    if(isPaused) return;

    timerRef.current=setInterval(()=>{

      setTime(t=>{

        if(t<=1){

          clearInterval(timerRef.current);
          setIndex(i=>i+1);
          return puzzleTime;

        }

        return t-1;

      });

    },1000);

    return()=>clearInterval(timerRef.current);

  },[index,isPaused,gameActive,puzzleTime]);

  /* ---------- COMPLETE GAME ---------- */

  useEffect(()=>{

    if(index>=count && gameActive){

      const accuracy=Math.round((correct/count)*100);

      onComplete?.({
        score:Math.round(score),
        accuracy,
        correctAnswers:correct
      });

    }

  },[index,count,correct,score,gameActive,onComplete]);

  if(!gameActive){

    return(
      <div className="text-center p-8">
        <div className="text-gray-600 mt-4">Preparing puzzles...</div>
      </div>
    );

  }

  if(index>=count){

    return(
      <div className="text-center p-8">
        <div className="text-gray-600 mt-4">Loading results...</div>
      </div>
    );

  }

  const puzzle=puzzles[index];

  /* ---------- ANSWER ---------- */

  const handleClick=(i)=>{

    if(selected!==null) return;

    setSelected(i);

    const choice=puzzle.options[i];
    const isCorrect=choice===puzzle.answer;

    if(isCorrect) setCorrect(c=>c+1);

    const points=Math.floor(100/count);

    setScore(prev=>{
      const next=isCorrect?prev+points:prev;
      onScoreUpdate?.(Math.round(next));
      return next;
    });

    setTimeout(()=>{
      setIndex(i=>i+1);
      setSelected(null);
      setTime(puzzleTime);
    },500);

  };

  /* ---------- UI ---------- */

  return(

  <div className="text-center relative">
  {isPaused && (
    <div className="absolute inset-0 z-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-2">⏸️</div>
        <div className="text-lg font-bold text-gray-800">Paused</div>
        <div className="text-sm text-gray-600">Question hidden until you resume</div>
      </div>
    </div>
  )}
  <div className={isPaused ? "opacity-50 pointer-events-none select-none" : ""}>

  <div className="flex justify-center gap-10 mb-6">

  <div>
  <div className="text-2xl font-bold">{index+1}/{count}</div>
  <div className="text-xs text-gray-500">PUZZLES</div>
  </div>

  <div>
  <div className="text-2xl font-bold text-orange-600">{time}s</div>
  <div className="text-xs text-gray-500">TIME</div>
  </div>

  </div>

  <motion.div
  key={index}
  initial={{opacity:0,y:20}}
  animate={{opacity:1,y:0}}
  className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto"
  >

  <h3 className="text-lg font-bold mb-4">
  What comes next?
  </h3>

  <div className="text-2xl font-mono mb-6 tracking-wide">
  {puzzle.series.join("   ")}
  </div>

  <div className="grid grid-cols-2 gap-3">

  {puzzle.options.map((opt,i)=>{

  const isSelected=selected===i;
  const isCorrect=opt===puzzle.answer;

  let border="border-gray-200";

  if(selected!==null){

  if(isSelected && isCorrect) border="border-green-500";
  else if(isSelected && !isCorrect) border="border-red-500";
  else if(isCorrect) border="border-green-400";

  }

  return(

  <button
  key={i}
  onClick={()=>handleClick(i)}
  className={`border-2 ${border} rounded-lg py-3 text-lg font-bold`}
  >
  {opt}
  </button>

  );

  })}

  </div>

  </motion.div>

  </div>
  </div>

  );

};

export default PuzzleSolver;