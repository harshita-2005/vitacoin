import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiAward, FiClock, FiTarget, FiStar, FiTrendingUp, FiCheckCircle, FiXCircle, FiPause, FiRotateCcw, FiZap, FiHelpCircle, FiEye, FiX, FiSearch, FiFilter, FiHeart, FiLock } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import GamePlayer from '../../components/Games/GamePlayer';
import { INTERVIEW_PUZZLES, PUZZLE_CATEGORIES, PUZZLE_COMPANIES, getPuzzlesByCategoryAndCompany } from '../../data/interviewPuzzles';
import { mcqDataReady, shuffleOptions, MCQ_SUBJECTS } from '../../data/mcqs';

/** Answer can be stored as letter "a"/"b"/"c"/"d" or as full option text. Returns true if option is correct. */
function isMcqOptionCorrect(mcq, optionText, optionIndex) {
  const ans = (mcq.answer || '').trim();
  if (['a', 'b', 'c', 'd'].includes(ans.toLowerCase())) {
    return optionIndex === 'abcd'.indexOf(ans.toLowerCase());
  }
  return optionText === ans;
}

const Challenges = () => {
  const { user, updateBalance } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [sectionNav, setSectionNav] = useState('puzzles'); // 'puzzles' | 'cs-fundamentals' for top nav
  const puzzlesSectionRef = useRef(null);
  const csFundamentalsSectionRef = useRef(null);
  const [activeChallenges, setActiveChallenges] = useState(new Set());
  const [challengeTimers, setChallengeTimers] = useState({});
  const [timerDisplay, setTimerDisplay] = useState({}); // New state for UI updates
  // Interview puzzles (Interview Arena)
  const [puzzleFilter, setPuzzleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [favorites, setFavorites] = useState(() => new Set());
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState(new Set());
  const [hintRevealed, setHintRevealed] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [puzzleUserAnswer, setPuzzleUserAnswer] = useState('');
  const [puzzleAnswerChecked, setPuzzleAnswerChecked] = useState(false);
  const [puzzleAnswerCorrect, setPuzzleAnswerCorrect] = useState(false);
  const [verificationSelected, setVerificationSelected] = useState(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [verificationCorrect, setVerificationCorrect] = useState(false);
  const [completingPuzzle, setCompletingPuzzle] = useState(false);
  const [rewardCard, setRewardCard] = useState({ show: false, coins: 0 });
  const [puzzleBlockedUntilTomorrow, setPuzzleBlockedUntilTomorrow] = useState(false); // true when user failed verification today
  const [lockCountdownTick, setLockCountdownTick] = useState(0); // force countdown recompute every minute when blocked
  const [puzzlesToShow, setPuzzlesToShow] = useState(5);

  const getPuzzleFailedDateKey = () => user ? `vitacoin_puzzle_failed_${user.id ?? user._id ?? ''}` : null;
  const getPuzzleFailedDate = (puzzleId) => {
    const key = getPuzzleFailedDateKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      return data[puzzleId] || null; // date string YYYY-MM-DD or null
    } catch { return null; }
  };
  const setPuzzleFailedToday = (puzzleId) => {
    const key = getPuzzleFailedDateKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      const today = new Date().toISOString().slice(0, 10);
      data[puzzleId] = today;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {}
  };
  const isPuzzleBlockedToday = (puzzleId) => {
    const failedDate = getPuzzleFailedDate(puzzleId);
    if (!failedDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return failedDate === today;
  };
  const PUZZLES_INITIAL = 5;
  const PUZZLES_INCREMENT = 10;
  // CS Fundamentals MCQs
  const [mcqSubject, setMcqSubject] = useState('all'); // subject tag (also used when no list filter)
  const [mcqListFilter, setMcqListFilter] = useState(null); // null | 'favorites' | 'completed'
  const [mcqFavorites, setMcqFavorites] = useState(() => new Set());
  const [mcqTopics, setMcqTopics] = useState([]); // multi-select: array of topic keys
  const [mcqDifficulties, setMcqDifficulties] = useState([]); // multi-select: array of 'easy'|'medium'|'hard'
  const [mcqsToShow, setMcqsToShow] = useState(5);
  const MCQ_INITIAL = 5;
  const MCQ_INCREMENT = 10;
  const [selectedMcq, setSelectedMcq] = useState(null);
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [mcqSelectedOption, setMcqSelectedOption] = useState(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [completedMcqIds, setCompletedMcqIds] = useState(() => {
    try {
      const raw = localStorage.getItem('vitacoin_mcq_completed');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [mcqApi, setMcqApi] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(true);
  const [inlineMcqSelections, setInlineMcqSelections] = useState({});
  const [inlineMcqSubmitted, setInlineMcqSubmitted] = useState({});
  const [completingMcq, setCompletingMcq] = useState(false);
  const mcqBatchRef = useRef([]);
  const [pendingMcqIds, setPendingMcqIds] = useState(new Set());
  const MCQ_REWARD_CARD_MS = 1500;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    mcqDataReady
      .then(api => { setMcqApi(api); setMcqLoading(false); })
      .catch(() => { setMcqApi(null); setMcqLoading(false); });
  }, []);

  // Load favorites from localStorage when user logs in (per-user key); clear when logged out
  const userId = user?.id ?? user?._id ?? null;
  const favoritesStorageKey = userId != null ? `vitacoin_puzzle_favorites_${userId}` : null;
  useEffect(() => {
    if (userId == null) {
      setFavorites(new Set());
      return;
    }
    try {
      const key = `vitacoin_puzzle_favorites_${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return setFavorites(new Set());
        if (arr.length >= INTERVIEW_PUZZLES.length - 2) {
          localStorage.setItem(key, '[]');
          return setFavorites(new Set());
        }
        setFavorites(new Set(arr));
      } else {
        setFavorites(new Set());
      }
    } catch (_) {
      setFavorites(new Set());
    }
  }, [userId]);

  useEffect(() => {
    if (!favoritesStorageKey) return;
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
    } catch (_) {}
  }, [favorites, favoritesStorageKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
    };
    if (showFilterPanel) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFilterPanel]);

  const timeUntilNextAttempt = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const ms = tomorrow - now;
    if (ms <= 0) return { h: 0, m: 0 };
    return {
      h: Math.floor(ms / (1000 * 60 * 60)),
      m: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    };
  }, [showPuzzleModal, puzzleBlockedUntilTomorrow, lockCountdownTick]);

  useEffect(() => {
    if (!showPuzzleModal || !puzzleBlockedUntilTomorrow) return;
    const id = setInterval(() => setLockCountdownTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, [showPuzzleModal, puzzleBlockedUntilTomorrow]);

  useEffect(() => {
    try {
      localStorage.setItem('vitacoin_mcq_completed', JSON.stringify([...completedMcqIds]));
    } catch (_) {}
  }, [completedMcqIds]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`vitacoin_mcq_favorites_${userId}`);
      setMcqFavorites(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch (_) {}
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`vitacoin_mcq_favorites_${userId}`, JSON.stringify([...mcqFavorites]));
    } catch (_) {}
  }, [mcqFavorites, userId]);

  const mcqTopicsForSubject = useMemo(() => mcqApi ? mcqApi.getTopicsBySubject(mcqSubject) : [{ key: 'all', label: 'All Topics' }], [mcqApi, mcqSubject]);

  // Base list by subject/topic/difficulty only – no favorites dependency, so favoriting doesn’t re-shuffle or “move” the question
  const baseFilteredMCQs = useMemo(() => {
    if (!mcqApi) return [];
    const subject = mcqListFilter === 'favorites' || mcqListFilter === 'completed' ? 'all' : mcqSubject;
    let list = mcqApi.getMCQsBySubjectAndTopic(subject, 'all');
    if (mcqTopics.length > 0) {
      const topicSet = new Set(mcqTopics);
      list = list.filter(m => topicSet.has((m.topic || 'Other').trim()));
    }
    if (mcqDifficulties.length > 0) {
      const diffSet = new Set(mcqDifficulties.map(d => d.toLowerCase()));
      list = list.filter(m => diffSet.has((m.difficulty || 'medium').toLowerCase()));
    }
    return list;
  }, [mcqApi, mcqSubject, mcqTopics, mcqDifficulties, mcqListFilter]);

  // Apply favorites/completed filter only when that view is active; otherwise same list as base (copy in favorites, don’t move)
  const filteredMCQs = useMemo(() => {
    if (mcqListFilter === 'favorites') return baseFilteredMCQs.filter(m => mcqFavorites.has(m.id));
    if (mcqListFilter === 'completed') return baseFilteredMCQs.filter(m => completedMcqIds.has(m.id) || pendingMcqIds.has(m.id));
    return baseFilteredMCQs;
  }, [baseFilteredMCQs, mcqListFilter, mcqFavorites, completedMcqIds, pendingMcqIds]);

  const displayedMcqIds = useMemo(() => filteredMCQs.slice(0, mcqsToShow).map(m => m.id).join(','), [filteredMCQs, mcqsToShow]);
  const displayedMcqs = useMemo(() => {
    return filteredMCQs.slice(0, mcqsToShow).map(m => shuffleOptions({ ...m }));
  }, [filteredMCQs, mcqsToShow]);

  // Flush MCQ batch only when leaving the page so all subjects (OS, CN, etc.) become one Coin Activity card
  useEffect(() => {
    return () => {
      if (mcqBatchRef.current.length > 0) {
        axios.post('/api/mcqs/complete-batch', { items: mcqBatchRef.current }).catch(() => {});
      }
    };
  }, []);

  // Reset inline MCQ state only when filters change, not when "Show more" is clicked
  useEffect(() => {
    setInlineMcqSelections({});
    setInlineMcqSubmitted({});
  }, [mcqSubject, mcqTopics, mcqDifficulties, mcqListFilter]);

  useEffect(() => {
    setPuzzlesToShow(PUZZLES_INITIAL);
  }, [puzzleFilter, companyFilter, difficultyFilter, searchQuery]);

  useEffect(() => {
    setMcqTopics([]);
  }, [mcqSubject]);

  useEffect(() => {
    setMcqsToShow(MCQ_INITIAL);
  }, [mcqSubject, mcqTopics, mcqDifficulties, mcqListFilter]);

  const showTopicFilter =
    mcqSubject &&
    mcqSubject !== 'all' &&
    mcqListFilter !== 'favorites' &&
    mcqListFilter !== 'completed';

  const mcqDifficultyCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    baseFilteredMCQs.forEach((m) => {
      const d = (m.difficulty || 'medium').toLowerCase();
      if (counts[d] !== undefined) counts[d]++;
    });
    return counts;
  }, [baseFilteredMCQs]);

  const openMcqModal = (mcq) => {
    setSelectedMcq(shuffleOptions({ ...mcq }));
    setMcqSelectedOption(null);
    setMcqSubmitted(false);
    setShowMcqModal(true);
  };

  const closeMcqModal = () => {
    setShowMcqModal(false);
    setSelectedMcq(null);
    setMcqSelectedOption(null);
    setMcqSubmitted(false);
  };

  const flushMcqBatch = async () => {
    const items = mcqBatchRef.current;
    if (items.length === 0) return;
    mcqBatchRef.current = [];
    const pending = new Set(items.map(i => i.mcqId));
    setPendingMcqIds(prev => {
      const next = new Set(prev);
      pending.forEach(id => next.delete(id));
      return next;
    });
    try {
      const res = await axios.post('/api/mcqs/complete-batch', { items });
      if (res.data?.newBalance != null) updateBalance(res.data.newBalance);
      const completedIds = res.data?.completed || [];
      if (completedIds.length) {
        setCompletedMcqIds(prev => new Set([...prev, ...completedIds]));
      }
    } catch (err) {
      mcqBatchRef.current = items;
      setPendingMcqIds(prev => new Set([...prev, ...pending]));
      const msg = err.response?.data?.error || 'Failed to save coins';
      alert(msg);
    }
  };

  const handleMcqComplete = (mcq) => {
    if (!mcq || completingMcq) return;
    if (completedMcqIds.has(mcq.id) || pendingMcqIds.has(mcq.id)) return;
    setCompletingMcq(true);
    const reward = mcq.reward ?? 10;
    mcqBatchRef.current.push({
      mcqId: mcq.id,
      reward,
      subject: mcq.subject
    });
    setPendingMcqIds(prev => new Set([...prev, mcq.id]));
    setRewardCard({ show: true, coins: reward });
    setTimeout(() => {
      setRewardCard(r => ({ ...r, show: false }));
      setCompletingMcq(false);
    }, MCQ_REWARD_CARD_MS);
  };

  const handleMcqSubmit = () => {
    if (!selectedMcq || mcqSelectedOption === null) return;
    setMcqSubmitted(true);
    const idx = selectedMcq.options.indexOf(mcqSelectedOption);
    const correct = idx >= 0 && isMcqOptionCorrect(selectedMcq, mcqSelectedOption, idx);
    if (correct) {
      handleMcqComplete(selectedMcq);
      closeMcqModal();
    }
  };

  const handleInlineMcqSubmit = (mcq) => {
    const idx = inlineMcqSelections[mcq.id];
    if (idx == null) return;
    setInlineMcqSubmitted(prev => ({ ...prev, [mcq.id]: true }));
    const opt = mcq.options[idx];
    const correct = isMcqOptionCorrect(mcq, opt, idx);
    if (correct) handleMcqComplete(mcq);
  };

  const toggleMcqFavorite = (mcqId, e) => {
    e?.stopPropagation?.();
    setMcqFavorites(prev => {
      const next = new Set(prev);
      if (next.has(mcqId)) next.delete(mcqId);
      else next.add(mcqId);
      return next;
    });
  };

  const toggleFavorite = (puzzleId, e) => {
    e?.stopPropagation?.();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(puzzleId)) next.delete(puzzleId);
      else next.add(puzzleId);
      return next;
    });
  };

  // Timer effect for active challenges - FIXED VERSION
  useEffect(() => {
    const timer = setInterval(() => {
      setChallengeTimers(prev => {
        const newTimers = { ...prev };
        const newTimerDisplay = { ...timerDisplay };
        let hasChanges = false;
        
        Object.keys(newTimers).forEach(challengeId => {
          if (newTimers[challengeId].isActive) {
            newTimers[challengeId].elapsed += 1;
            newTimers[challengeId].remaining = Math.max(0, newTimers[challengeId].limit - newTimers[challengeId].elapsed);
            
            // Update display timer for UI
            newTimerDisplay[challengeId] = {
              remaining: newTimers[challengeId].remaining,
              elapsed: newTimers[challengeId].elapsed,
              limit: newTimers[challengeId].limit
            };
            
            // Check if time is up
            if (newTimers[challengeId].remaining <= 0) {
              newTimers[challengeId].isActive = false;
              newTimers[challengeId].status = 'time_up';
              hasChanges = true;
              
              // Show time up alert
              alert(`⏰ Time's up for challenge! You didn't complete it in time.`);
            }
          }
        });
        
        // Update timer display for UI updates
        setTimerDisplay(newTimerDisplay);
        
        // Only return new timers if there are actual changes
        return hasChanges ? newTimers : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerDisplay]);

  useEffect(() => {
    console.log('Active challenges updated:', activeChallenges);
    console.log('Challenge timers updated:', challengeTimers);
  }, [activeChallenges, challengeTimers]);

  const fetchData = async () => {
    try {
      const [challengesRes, gamesRes, completedRes, mcqCompletedRes] = await Promise.all([
        axios.get('/api/challenges'),
        axios.get('/api/games'),
        axios.get('/api/puzzles/user/completed').catch(() => ({ data: { completed: [] } })),
        axios.get('/api/mcqs/user/completed').catch(() => null)
      ]);
      
      setChallenges(challengesRes.data);
      setGames(gamesRes.data);
      setCompletedPuzzleIds(new Set(completedRes.data?.completed || []));
      if (mcqCompletedRes?.data?.completed) {
        setCompletedMcqIds(new Set(mcqCompletedRes.data.completed));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Normalize for answer check: lowercase, trim, collapse spaces, remove punctuation */
  const normalizeForCheck = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,;:!?'"-]/g, '');

  /** Check if user's answer matches puzzle (puzzle.answer contains user's key answer, or exact short match). */
  const isPuzzleAnswerCorrect = (userAnswer, puzzle) => {
    const u = normalizeForCheck(userAnswer);
    if (u.length < 2) return false;
    const full = normalizeForCheck(puzzle.answer || '');
    return full.includes(u) || u.includes(full.slice(0, 50));
  };

  const hasVerification = (puzzle) => puzzle?.verification_question && Array.isArray(puzzle?.verification_options) && puzzle.verification_options.length >= 2;

  const openPuzzleModal = (puzzle) => {
    const blocked = hasVerification(puzzle) && isPuzzleBlockedToday(puzzle.id);
    const alreadyCompleted = completedPuzzleIds.has(puzzle.id);
    setPuzzleBlockedUntilTomorrow(blocked);
    setSelectedPuzzle(puzzle);
    setHintRevealed(alreadyCompleted);
    setAnswerRevealed(alreadyCompleted);
    setPuzzleUserAnswer('');
    setPuzzleAnswerChecked(false);
    setPuzzleAnswerCorrect(false);
    setVerificationSelected(null);
    setVerificationSubmitted(false);
    setVerificationCorrect(alreadyCompleted);
    setShowPuzzleModal(true);
  };

  const closePuzzleModal = () => {
    setShowPuzzleModal(false);
    setSelectedPuzzle(null);
    setHintRevealed(false);
    setAnswerRevealed(false);
    setPuzzleUserAnswer('');
    setPuzzleAnswerChecked(false);
    setPuzzleAnswerCorrect(false);
    setVerificationSelected(null);
    setVerificationSubmitted(false);
    setVerificationCorrect(false);
  };

  const handleVerificationSubmit = () => {
    if (!selectedPuzzle || verificationSelected === null || !hasVerification(selectedPuzzle)) return;
    const correctIndex = typeof selectedPuzzle.verification_answer === 'number' ? selectedPuzzle.verification_answer : 'abcd'.indexOf(String(selectedPuzzle.verification_answer).toLowerCase());
    const correct = verificationSelected === correctIndex;
    setVerificationSubmitted(true);
    setVerificationCorrect(correct);
    if (!correct) setPuzzleFailedToday(selectedPuzzle.id);
    if (correct) handlePuzzleComplete(); // auto-claim when correct; card has no Claim button
  };

  const handleCheckPuzzleAnswer = () => {
    if (!selectedPuzzle || !puzzleUserAnswer.trim()) return;
    const correct = isPuzzleAnswerCorrect(puzzleUserAnswer.trim(), selectedPuzzle);
    setPuzzleAnswerChecked(true);
    setPuzzleAnswerCorrect(correct);
    if (correct) handlePuzzleComplete(); // auto-claim when correct; card has no Claim button
  };

  const handlePuzzleComplete = async () => {
    if (!selectedPuzzle || completingPuzzle) return;
    if (completedPuzzleIds.has(selectedPuzzle.id)) return; // already completed: no API call, no popup
    setCompletingPuzzle(true);
    try {
      const res = await axios.post('/api/puzzles/complete', { puzzleId: selectedPuzzle.id });
      const coins = res.data?.coinsAwarded ?? selectedPuzzle.reward ?? 0;
      if (res.data?.newBalance != null) updateBalance(res.data.newBalance);
      setCompletedPuzzleIds(prev => new Set([...prev, selectedPuzzle.id]));
      closePuzzleModal();
      setRewardCard({ show: true, coins });
      setTimeout(() => setRewardCard(r => ({ ...r, show: false })), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to complete puzzle';
      alert(msg);
    } finally {
      setCompletingPuzzle(false);
    }
  };

  const filteredPuzzles = (() => {
    let list = puzzleFilter === 'favorites'
      ? getPuzzlesByCategoryAndCompany('all', companyFilter).filter(p => favorites.has(p.id))
      : puzzleFilter === 'completed'
        ? getPuzzlesByCategoryAndCompany('all', companyFilter).filter(p => completedPuzzleIds.has(p.id))
        : getPuzzlesByCategoryAndCompany(puzzleFilter, companyFilter);
    if (difficultyFilter && difficultyFilter !== 'all') {
      list = list.filter(p => p.difficulty === difficultyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.question && p.question.toLowerCase().includes(q)) ||
        (p.companies && p.companies.some(c => c.toLowerCase().includes(q)))
      );
    }
    return list;
  })();

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSelectedChallenge(null);
    setShowGamePlayer(true);
  };

  const handleChallengeSelect = async (challenge) => {
    console.log('Challenge selected:', challenge);
    
    try {
      // Start the challenge first
      const response = await axios.post(`/api/challenges/${challenge._id}/start`, {
        userId: user._id
      });
      
      if (response.data.success) {
        // Add to active challenges
        setActiveChallenges(prev => {
          const newSet = new Set(prev);
          newSet.add(challenge._id);
          return newSet;
        });
        
        // Initialize timer
        const timeLimit = challenge.requirements?.timeLimit || 300;
        const newTimer = {
          limit: timeLimit,
          elapsed: 0,
          remaining: timeLimit,
          isActive: true,
          status: 'active',
          startTime: Date.now()
        };
        
        setChallengeTimers(prev => ({
          ...prev,
          [challenge._id]: newTimer
        }));
        
        setTimerDisplay(prev => ({
          ...prev,
          [challenge._id]: {
            remaining: timeLimit,
            elapsed: 0,
            limit: timeLimit
          }
        }));
        
        // Start the game
        setSelectedChallenge(challenge);
        setSelectedGame(challenge.gameId);
        setShowGamePlayer(true);
        
        console.log(`Challenge ${challenge.title} started with ${timeLimit}s timer`);
      } else {
        alert('Failed to start challenge: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge. Please try again.');
    }
  };

  const handleGameComplete = async (result) => {
    try {
      let response;
      
      if (selectedChallenge) {
        // Get current challenge timer
        const timer = challengeTimers[selectedChallenge._id];
        const isTimeValid = timer && timer.isActive && timer.remaining > 0;
        
        if (!isTimeValid) {
          alert('⏰ Challenge time expired! You cannot complete this challenge.');
          // Remove from active challenges
          setActiveChallenges(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedChallenge._id);
            return newSet;
          });
          
          setChallengeTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[selectedChallenge._id];
            return newTimers;
          });
          
          setTimerDisplay(prev => {
            const newDisplay = { ...prev };
            delete newDisplay[selectedChallenge._id];
            return newDisplay;
          });
          
          setShowGamePlayer(false);
          setSelectedGame(null);
          setSelectedChallenge(null);
          return;
        }
        
        // Complete challenge with timer validation
        response = await axios.post(`/api/challenges/${selectedChallenge._id}/complete`, {
          score: result.score,
          time: result.time,
          accuracy: result.accuracy,
          challengeTime: timer.elapsed,
          isTimeValid: true
        });
        
        if (response.data.success) {
          // Show success message with rewards
          const rewards = response.data.rewards;
          alert(`🎉 Challenge Completed Successfully!\n\n🏆 Score: ${result.score}\n⏱️ Time: ${timer.elapsed}s\n💰 Coins Earned: +${rewards.coins}\n⭐ XP Earned: +${rewards.experience}`);
          
          // Remove from active challenges
          setActiveChallenges(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedChallenge._id);
            return newSet;
          });
          
          // Remove timer
          setChallengeTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[selectedChallenge._id];
            return newTimers;
          });
          
          setTimerDisplay(prev => {
            const newDisplay = { ...prev };
            delete newDisplay[selectedChallenge._id];
            return newDisplay;
          });
          
          // Refresh user data to show updated coin balance
          await fetchData();
        } else {
          alert('Challenge failed: ' + response.data.message);
        }
      } else {
        // Regular game completion
        response = await axios.post(`/api/games/${selectedGame._id}/score`, {
          score: result.score,
          time: result.time,
          accuracy: result.accuracy
        });
      }

      if (response.data.success) {
        setShowGamePlayer(false);
        setSelectedGame(null);
        setSelectedChallenge(null);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    }
  };

  const getFilteredChallenges = () => challenges;

  const getFilteredGames = () => games;

  const scrollToSection = (section) => {
    setSectionNav(section);
    const el = section === 'puzzles' ? puzzlesSectionRef.current : csFundamentalsSectionRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isChallengeActive = (challengeId) => {
    return activeChallenges.has(challengeId);
  };

  const getChallengeTimer = (challengeId) => {
    return timerDisplay[challengeId] || null;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (timer) => {
    if (!timer) return 'text-gray-600';
    
    const percentage = (timer.remaining / timer.limit) * 100;
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    if (percentage > 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getButtonState = (challenge) => {
    const timer = getChallengeTimer(challenge._id);
    const isActive = isChallengeActive(challenge._id);
    
    console.log(`Button state for challenge ${challenge._id}:`, {
      isActive,
      timer,
      timerStatus: timer?.status,
      timerIsActive: timer?.isActive
    });
    
    if (!isActive) {
      return {
        icon: FiPlay,
        text: 'Start Challenge',
        className: 'btn-primary',
        disabled: false
      };
    }
    
    if (timer?.status === 'time_up') {
      return {
        icon: FiXCircle,
        text: 'Time Up',
        className: 'btn-error',
        disabled: true
      };
    }
    
    if (timer?.isActive) {
      return {
        icon: FiPause,
        text: 'Continue Challenge',
        className: 'btn-success',
        disabled: false
      };
    }
    
    return {
      icon: FiRotateCcw,
      text: 'Restart Challenge',
      className: 'btn-warning',
      disabled: false
    };
  };

  const debugChallengeState = (challenge) => {
    const timer = getChallengeTimer(challenge._id);
    const isActive = isChallengeActive(challenge._id);
    
    console.log(`Debug for challenge ${challenge._id}:`, {
      title: challenge.title,
      isActive,
      timer,
      hasTimer: !!timer,
      timerStatus: timer?.status,
      timerIsActive: timer?.isActive,
      timerRemaining: timer?.remaining,
      timerLimit: timer?.limit
    });
    
    return { timer, isActive };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showGamePlayer && selectedGame) {
    return (
      <GamePlayer
        game={selectedGame}
        challenge={selectedChallenge}
        onComplete={handleGameComplete}
        onClose={() => {
          setShowGamePlayer(false);
          setSelectedGame(null);
          setSelectedChallenge(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-background">
      {/* Congratulations reward card – centered overlay with blurred background */}
      <AnimatePresence>
        {rewardCard.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setRewardCard(r => ({ ...r, show: false }))}
          >
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" aria-hidden />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative bg-white rounded-3xl shadow-2xl border-2 border-amber-200 px-14 py-12 flex flex-col items-center gap-6 min-w-[380px] max-w-[480px]"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 15 }}
                className="text-8xl leading-none"
                aria-hidden
              >
                🎉
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center font-bold text-warm-text text-3xl"
              >
                Congratulations!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-center text-warm-textSecondary text-xl"
              >
                You earned <span className="font-bold text-amber-600 text-2xl">+{rewardCard.coins} coins</span>
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-warm-text mb-4">
            Interview Arena
          </h1>
          <p className="text-lg text-warm-textSecondary max-w-2xl mx-auto">
            Solve real puzzles asked in tech interviews.
          </p>
        </motion.div>

        {/* Section nav: Puzzles | CS Fundamentals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => scrollToSection('puzzles')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                sectionNav === 'puzzles'
                  ? 'bg-warm-primary text-white shadow-lg'
                  : 'bg-white text-warm-textSecondary hover:bg-warm-container shadow-md border border-warm-border'
              }`}
            >
              <FiZap className="w-4 h-4" />
              Puzzles
            </button>
            <button
              onClick={() => scrollToSection('cs-fundamentals')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                sectionNav === 'cs-fundamentals'
                  ? 'bg-warm-primary text-white shadow-lg'
                  : 'bg-white text-warm-textSecondary hover:bg-warm-container shadow-md border border-warm-border'
              }`}
            >
              <FiAward className="w-4 h-4" />
              CS Fundamentals
            </button>
          </div>
        </motion.div>

        {/* Section: Puzzles – extra bottom margin so filter dropdown never overlaps CS Fundamentals */}
        <div ref={puzzlesSectionRef} className="scroll-mt-6 mb-[340px]">
        <h2 className="text-3xl font-bold text-warm-text mb-5 flex items-center gap-2">
          <FiZap className="w-8 h-8 text-warm-primary" />
          Puzzles
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 rounded-xl border border-warm-border bg-white shadow-sm overflow-visible"
        >
          {/* Category tags */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-warm-border bg-warm-container/50 overflow-x-auto rounded-t-xl">
            {PUZZLE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setPuzzleFilter(cat.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-base font-medium transition-all flex items-center gap-1.5 ${
                  puzzleFilter === cat.key
                    ? 'bg-warm-primary text-white'
                    : 'bg-white text-warm-textSecondary border border-warm-border hover:bg-warm-container hover:text-warm-text'
                }`}
              >
                {cat.key === 'favorites' && <FiHeart className="w-4 h-4" />}
                {cat.key === 'completed' && <FiCheckCircle className="w-4 h-4" />}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search + Filter bar – Filter and Clear filter on the left */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-warm-border bg-white">
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative" ref={filterPanelRef}>
                <button
                  onClick={() => setShowFilterPanel(prev => !prev)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${
                    showFilterPanel || difficultyFilter !== 'all' || companyFilter !== 'All'
                      ? 'bg-warm-primary text-white border-warm-primary'
                      : 'bg-white border-warm-border text-warm-textSecondary hover:bg-warm-container hover:text-warm-text'
                  }`}
                >
                  <FiFilter className="w-4 h-4" />
                  Filter
                </button>
              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-2 w-64 max-h-[300px] flex flex-col rounded-xl bg-white border border-warm-border shadow-xl z-50 overflow-hidden"
                  >
                    <div className="shrink-0 py-2.5 px-3.5 border-b border-warm-border">
                      <p className="text-[11px] font-semibold text-warm-textSecondary uppercase tracking-wider mb-1.5">Difficulty</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['all', 'easy', 'medium', 'hard'].map((d) => (
                          <button
                            key={d}
                            onClick={() => { setDifficultyFilter(d); setShowFilterPanel(false); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                              difficultyFilter === d ? 'bg-warm-primary text-white' : 'bg-warm-container text-warm-textSecondary hover:bg-warm-secondary hover:text-warm-text'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 py-1.5 px-3.5 border-b border-warm-border">
                      <p className="text-[11px] font-semibold text-warm-textSecondary uppercase tracking-wider">Company</p>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto py-0.5 max-h-[200px]">
                      {PUZZLE_COMPANIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCompanyFilter(c); setShowFilterPanel(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            companyFilter === c ? 'bg-warm-primary text-white' : 'text-warm-text hover:bg-warm-container'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="shrink-0 border-t border-warm-border p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDifficultyFilter('all');
                          setCompanyFilter('All');
                          setShowFilterPanel(false);
                        }}
                        className="w-full py-2 rounded-lg text-xs font-medium text-warm-textSecondary hover:bg-warm-container hover:text-warm-text transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDifficultyFilter('all');
                  setCompanyFilter('All');
                  setShowFilterPanel(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-warm-border text-sm font-medium text-warm-textSecondary hover:bg-warm-container hover:text-warm-text transition-colors"
              >
                Clear filter
              </button>
            </div>
            <div className="relative w-full max-w-[240px] ml-auto">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-textSecondary" />
              <input
                type="text"
                placeholder="Search puzzles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-warm-container/50 border border-warm-border text-sm text-warm-text placeholder-warm-textSecondary focus:outline-none focus:ring-2 focus:ring-warm-primary/30 focus:border-warm-primary"
              />
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 py-3 border-b border-warm-border bg-warm-container/30 flex items-center justify-between text-base text-warm-textSecondary">
            <span>{filteredPuzzles.filter(p => completedPuzzleIds.has(p.id)).length} / {filteredPuzzles.length} solved</span>
            <span>{favorites.size} favorites</span>
          </div>

          {/* Puzzle list */}
          <div className="max-h-[580px] overflow-y-auto">
            {filteredPuzzles.length === 0 ? (
              <div className="py-16 text-center text-warm-textSecondary text-base">No puzzles match your filters.</div>
            ) : (
              filteredPuzzles.slice(0, puzzlesToShow).map((puzzle, index) => {
                const isCompleted = completedPuzzleIds.has(puzzle.id);
                const isFavorite = favorites.has(puzzle.id);
                const difficultyColor = puzzle.difficulty === 'easy' ? 'text-green-600' : puzzle.difficulty === 'medium' ? 'text-amber-600' : 'text-red-600';
                return (
                  <div
                    key={puzzle.id}
                    onClick={() => openPuzzleModal(puzzle)}
                    className="flex items-center gap-5 px-5 py-4 border-b border-warm-border hover:bg-warm-container/50 cursor-pointer transition-colors group"
                  >
                    <button
                      onClick={(e) => toggleFavorite(puzzle.id, e)}
                      className="shrink-0 p-1.5 rounded hover:bg-warm-container transition-colors"
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <FiHeart
                        className={`w-6 h-6 transition-colors ${
                          isFavorite ? 'text-red-500 fill-red-500' : 'text-warm-textSecondary group-hover:text-red-400'
                        }`}
                      />
                    </button>
                    <div className="shrink-0 w-9 text-base text-warm-textSecondary">{index + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-warm-text text-base truncate">{puzzle.title}</span>
                        {isCompleted && <FiCheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                      </div>
                      {puzzle.companies && puzzle.companies.length > 0 && (
                        <p className="text-sm text-warm-textSecondary mt-1">Asked at: {puzzle.companies.slice(0, 3).join(', ')}{puzzle.companies.length > 3 ? '…' : ''}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-base font-medium capitalize ${difficultyColor}`}>
                      {puzzle.difficulty}
                    </span>
                    <span className="shrink-0 text-base text-warm-primary font-medium">+{puzzle.reward}</span>
                  </div>
                );
              })
            )}
          </div>
          {filteredPuzzles.length > puzzlesToShow && (
            <div className="px-5 py-4 border-t border-warm-border bg-warm-container/30 text-center">
              <button
                type="button"
                onClick={() => setPuzzlesToShow(p => p + PUZZLES_INCREMENT)}
                className="text-base font-medium text-warm-primary hover:underline"
              >
                Show more ({filteredPuzzles.length - puzzlesToShow} more)
              </button>
            </div>
          )}
        </motion.div>
        </div>

        {/* Section: CS Fundamentals – tags (subjects + Favorites + Completed), then two columns */}
        <div ref={csFundamentalsSectionRef} className="scroll-mt-6">
        <h2 className="text-3xl font-bold text-warm-text mb-4 flex items-center gap-2 mt-10">
          <FiAward className="w-8 h-8 text-warm-primary" />
          CS Fundamentals
        </h2>
        {/* Tag bar: subjects as tags + Favorites + Completed */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {MCQ_SUBJECTS.filter(s => s.key !== 'OOP' && s.key !== 'Misc').map((sub) => (
            <button
              key={sub.key}
              onClick={() => { setMcqSubject(sub.key); setMcqListFilter(null); }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mcqSubject === sub.key && !mcqListFilter
                  ? 'bg-warm-primary text-white'
                  : 'bg-white text-warm-text border border-warm-border hover:bg-warm-container'
              }`}
            >
              {sub.label}
            </button>
          ))}
          <button
            onClick={() => setMcqListFilter(mcqListFilter === 'favorites' ? null : 'favorites')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              mcqListFilter === 'favorites' ? 'bg-warm-primary text-white' : 'bg-white text-warm-text border border-warm-border hover:bg-warm-container'
            }`}
          >
            <FiHeart className="w-4 h-4" /> Favorites
          </button>
          <button
            onClick={() => setMcqListFilter(mcqListFilter === 'completed' ? null : 'completed')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              mcqListFilter === 'completed' ? 'bg-warm-primary text-white' : 'bg-white text-warm-text border border-warm-border hover:bg-warm-container'
            }`}
          >
            <FiCheckCircle className="w-4 h-4" /> Completed
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col lg:flex-row gap-6"
        >
          {/* Left: fixed-height section – scroll only inside */}
          <div className="flex-1 min-w-0 flex flex-col h-[72vh] min-h-[520px] max-h-[800px]">
            <div className="rounded-xl overflow-hidden border border-warm-border bg-white shadow-sm flex flex-col h-full flex-1 min-h-0">
              {/* Score / progress bar – fixed at top */}
              <div className="shrink-0 px-5 py-3 border-b border-warm-border bg-warm-container/30 flex items-center justify-between text-base text-warm-textSecondary">
                <span>
                  {mcqLoading ? 'Loading…' : !mcqApi ? 'Data not loaded' : `Score: ${filteredMCQs.filter(m => completedMcqIds.has(m.id) || pendingMcqIds.has(m.id)).length} / ${filteredMCQs.length} solved`}
                </span>
                <span>{mcqsToShow} shown</span>
              </div>
              {/* MCQ cards – scroll within this area only */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
              {mcqLoading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-warm-textSecondary">
                  <LoadingSpinner className="w-6 h-6" /> Loading MCQs…
                </div>
              ) : !mcqApi ? (
                <div className="py-16 text-center text-warm-textSecondary px-4">
                  <p className="font-medium text-warm-text mb-2">MCQ data not found.</p>
                  <p className="text-sm">Run: <code className="bg-warm-container px-1.5 py-0.5 rounded">python scripts/convert_mcq_to_app_format.py</code></p>
                </div>
              ) : displayedMcqs.length === 0 ? (
                <div className="py-16 text-center text-warm-textSecondary text-base">No MCQs match your filters.</div>
              ) : (
                <>
                {displayedMcqs.map((mcq, index) => {
                  const submitted = inlineMcqSubmitted[mcq.id];
                  const selectedIdx = inlineMcqSelections[mcq.id];
                  const isMcqFav = mcqFavorites.has(mcq.id);
                  const difficultyStyle = (mcq.difficulty || 'medium').toLowerCase() === 'easy'
                    ? 'bg-green-500/90 text-white'
                    : (mcq.difficulty || 'medium').toLowerCase() === 'hard'
                      ? 'bg-red-500/90 text-white'
                      : 'bg-amber-500/90 text-white';
                  return (
                    <div
                      key={mcq.id}
                      className="rounded-xl border border-warm-border bg-warm-container/20 overflow-hidden"
                    >
                      {/* Card header: Question N + favorite */}
                      <div className="px-4 py-2.5 bg-warm-container/60 border-b border-warm-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-warm-text">Question {index + 1}</span>
                          <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${difficultyStyle}`}>
                            {mcq.difficulty || 'Medium'}
                          </span>
                          <span className="text-sm font-medium text-warm-primary">+{mcq.reward}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleMcqFavorite(mcq.id, e)}
                          className="p-1.5 rounded hover:bg-warm-container transition-colors shrink-0"
                          title={isMcqFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <FiHeart className={`w-5 h-5 ${isMcqFav ? 'text-red-500 fill-red-500' : 'text-warm-textSecondary'}`} />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-warm-text font-medium mb-4">{mcq.question}</p>
                        <p className="text-xs text-warm-textSecondary mb-3">{mcq.subject}{mcq.topic && mcq.topic !== 'Overview' ? ` · ${mcq.topic}` : ''}</p>
                        <div className="space-y-2">
                          {mcq.options.map((opt, i) => {
                            const isSelected = selectedIdx === i;
                            const correct = submitted && isMcqOptionCorrect(mcq, opt, i);
                            const wrong = submitted && isSelected && !isMcqOptionCorrect(mcq, opt, i);
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={submitted}
                                onClick={() => !submitted && setInlineMcqSelections(prev => ({ ...prev, [mcq.id]: i }))}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                  wrong ? 'border-red-300 bg-red-50 text-red-800' :
                                  correct ? 'border-green-300 bg-green-50 text-green-800' :
                                  isSelected ? 'border-warm-primary bg-warm-container text-warm-text ring-1 ring-warm-primary' :
                                  'border-warm-border hover:bg-warm-container/50 text-warm-text'
                                }`}
                              >
                                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                  wrong ? 'border-red-400 bg-red-100 text-red-700' :
                                  correct ? 'border-green-400 bg-green-100 text-green-700' :
                                  isSelected ? 'border-warm-primary bg-warm-primary text-white' :
                                  'border-warm-border text-warm-textSecondary bg-white'
                                }`}>
                                  {['A', 'B', 'C', 'D'][i]}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                        {!submitted ? (
                          <button
                            type="button"
                            disabled={selectedIdx == null || completingMcq}
                            onClick={() => handleInlineMcqSubmit(mcq)}
                            className="mt-4 w-full py-2.5 rounded-xl bg-warm-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                          >
                            {completingMcq ? 'Awarding…' : 'Submit'}
                          </button>
                        ) : (
                          <div className="mt-4 p-4 rounded-xl bg-warm-container border border-warm-border">
                            <p className="text-sm font-medium text-warm-text mb-1">Explanation</p>
                            <p className="text-sm text-warm-textSecondary">{mcq.explanation}</p>
                            {selectedIdx != null && isMcqOptionCorrect(mcq, mcq.options[selectedIdx], selectedIdx) && (
                              <p className="text-sm text-green-600 font-medium mt-2">Correct! +{mcq.reward} coins earned.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredMCQs.length > mcqsToShow && (
                  <div className="pt-4 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setMcqsToShow(p => p + MCQ_INCREMENT)}
                      className="px-5 py-2.5 rounded-xl bg-warm-container border border-warm-border text-warm-text font-medium hover:bg-warm-secondary hover:border-warm-primary/50 transition-colors"
                    >
                      Show more ({filteredMCQs.length - mcqsToShow} more)
                    </button>
                  </div>
                )}
                </>
              )}
              </div>
            </div>
          </div>

          {/* Right: Filter sidebar – flexible height for All/Favorites/Completed (only Difficulty); fixed height when subject has Topic + Difficulty */}
          <aside className={`lg:w-80 shrink-0 ${showTopicFilter ? 'flex flex-col h-[72vh] min-h-[520px] max-h-[800px]' : ''}`}>
            <div className={`rounded-xl border border-warm-border bg-white shadow-md overflow-hidden sticky top-4 ${showTopicFilter ? 'flex flex-col flex-1 min-h-0' : ''}`}>
              <div className="shrink-0 px-4 py-3 border-b border-warm-border bg-warm-container/40 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-warm-text uppercase tracking-wider">
                  <FiFilter className="w-4 h-4 shrink-0" />
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => { setMcqTopics([]); setMcqDifficulties([]); }}
                  disabled={mcqTopics.length === 0 && mcqDifficulties.length === 0}
                  className={`text-sm font-semibold shrink-0 hover:underline disabled:opacity-50 disabled:cursor-default disabled:no-underline ${mcqTopics.length > 0 || mcqDifficulties.length > 0 ? 'text-black' : 'text-warm-textSecondary'}`}
                >
                  Clear filters
                </button>
              </div>
              <div className={showTopicFilter ? 'flex-1 min-h-0 overflow-y-auto flex flex-col p-0' : 'p-0'}>
                {/* TOPIC – only when subject selected */}
                {showTopicFilter && (
                  <div className="p-4 border-b border-warm-border flex-1 min-h-0 flex flex-col">
                    <p className="text-sm font-semibold uppercase tracking-wider mb-1.5 text-warm-text">Topic</p>
                    <p className="text-sm text-warm-textSecondary mb-2">Select one or more</p>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                      {mcqTopicsForSubject.filter(t => t.key !== 'all').map((t) => {
                        const checked = mcqTopics.includes(t.key);
                        return (
                          <label key={t.key} className="flex items-center gap-2 cursor-pointer group py-1 pr-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setMcqTopics(prev => checked ? prev.filter(k => k !== t.key) : [...prev, t.key])}
                              className="w-4 h-4 rounded border-warm-border text-warm-primary focus:ring-warm-primary shrink-0"
                            />
                            <span className="text-base text-warm-text group-hover:text-warm-primary">{t.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Spacer so DIFFICULTY sits at bottom and empty space isn’t wasted below it */}
                {/* DIFFICULTY – with counts */}
                <div className="px-4 py-3 shrink-0 border-t border-warm-border">
                  <p className="text-sm font-semibold uppercase tracking-wider mb-1 text-warm-text">Difficulty</p>
                  <p className="text-sm text-warm-textSecondary mb-1.5">Select one or more</p>
                  <div className="space-y-1.5">
                    {['easy', 'medium', 'hard'].map((d) => {
                      const checked = mcqDifficulties.includes(d);
                      const count = mcqDifficultyCounts[d] ?? 0;
                      return (
                        <label key={d} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setMcqDifficulties(prev => checked ? prev.filter(k => k !== d) : [...prev, d])}
                            className="w-4 h-4 rounded border-warm-border text-warm-primary focus:ring-warm-primary shrink-0"
                          />
                          <span className="text-base font-medium capitalize text-warm-text group-hover:text-warm-primary">{d}</span>
                          <span className="text-sm text-warm-textSecondary">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </motion.div>
        </div>

        {/* Active Rounds Section */}
        {getFilteredChallenges().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-warm-text mb-6 flex items-center gap-2">
              <FiTarget className="w-6 h-6 text-warm-primary" />
              Active Rounds
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredChallenges().map((challenge, index) => {
                const { timer, isActive } = debugChallengeState(challenge);
                const buttonState = getButtonState(challenge);
                const Icon = buttonState.icon;
                
                return (
                  <motion.div
                    key={challenge._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`card hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      isChallengeActive(challenge._id) ? 'ring-2 ring-warm-primary' : ''
                    }`}
                    onClick={() => !buttonState.disabled && handleChallengeSelect(challenge)}
                    style={{ borderLeft: `4px solid ${challenge.color || '#7B5E4A'}` }}
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-warm-text mb-2">
                            {challenge.title}
                          </h3>
                          <p className="text-warm-textSecondary mb-3">
                            {challenge.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`badge badge-${challenge.type}`}>
                            {challenge.type}
                          </span>
                          {isChallengeActive(challenge._id) && (
                            <div className="mt-2 text-warm-primary text-sm font-semibold">
                              <FiCheckCircle className="w-4 h-4 inline mr-1" />
                              Active
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Challenge Timer Display - ENHANCED VERSION */}
                      {isChallengeActive(challenge._id) && (
                        <div className="mb-4 p-3 bg-warm-container border border-warm-border rounded-lg">
                          <div className="text-center">
                            <div className="text-sm font-medium text-warm-text mb-2">
                              Challenge Active!
                            </div>
                            <div className={`text-lg font-bold ${getTimerColor(timer)}`}>
                              {timer ? (
                                <>
                                  <FiClock className="w-4 h-4 inline mr-2" />
                                  {formatTime(timer.remaining)} remaining
                                </>
                              ) : (
                                'Initializing...'
                              )}
                            </div>
                            {timer && (
                              <div className="text-xs text-warm-primary mt-1">
                                Progress: {Math.round(((timer.limit - timer.remaining) / timer.limit) * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-warm-textSecondary">Min Score</div>
                          <div className="font-semibold text-warm-text">
                            {challenge.requirements?.minScore || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-warm-textSecondary">Time Limit</div>
                          <div className="font-semibold text-warm-text">
                            {challenge.requirements?.timeLimit || 300}s
                          </div>
                        </div>
                      </div>

                      <div className="text-right mb-4">
                        <div className="text-2xl font-bold text-warm-primary">
                          +{challenge.rewards?.coins || 0}
                        </div>
                        <div className="text-sm text-warm-textSecondary">coins + {challenge.rewards?.experience || 0} XP</div>
                      </div>

                      <button 
                        className={`btn w-full ${buttonState.className}`}
                        disabled={buttonState.disabled}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {buttonState.text}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Interview Puzzle Modal – larger card, bigger text, verification always after reveal, wrong answer blocks same day */}
        <AnimatePresence>
          {showPuzzleModal && selectedPuzzle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={closePuzzleModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full min-h-[480px] max-h-[92vh] overflow-hidden flex flex-col border border-warm-border"
              >
                <div className="p-6 border-b border-warm-border flex items-center justify-between bg-warm-container/50 shrink-0">
                  <div>
                    <h3 className="text-2xl font-bold text-warm-text">{selectedPuzzle.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-sm px-2.5 py-1 rounded-full bg-warm-container text-warm-textSecondary capitalize">{selectedPuzzle.category}</span>
                      <span className="text-sm px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">{selectedPuzzle.difficulty}</span>
                      <span className="text-base font-semibold text-warm-primary">+{selectedPuzzle.reward} coins</span>
                      {completedPuzzleIds.has(selectedPuzzle.id) && (
                        <span className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                          <FiCheckCircle className="w-4 h-4" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={closePuzzleModal} className="p-2 rounded-lg hover:bg-warm-border text-warm-textSecondary">
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                  {puzzleBlockedUntilTomorrow ? (
                    <div className="py-8 flex flex-col items-center justify-center h-full">
                      <div className="w-full max-w-md p-5 rounded-xl text-center border border-amber-300 bg-amber-50/80">
                        <p className="flex items-center justify-center gap-2 text-base font-semibold text-amber-800 mb-2">
                          <FiLock className="w-5 h-5 shrink-0" />
                          Attempt locked
                        </p>
                        <p className="text-sm text-amber-700">
                          Next attempt in {timeUntilNextAttempt.h}h {timeUntilNextAttempt.m}m
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-warm-text text-base leading-relaxed whitespace-pre-wrap mb-5">{selectedPuzzle.question}</p>
                      {/* Collapsible hint */}
                      <div className="mb-5">
                        <button
                          type="button"
                          onClick={() => setHintRevealed(prev => !prev)}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-warm-container text-warm-text text-base hover:bg-warm-secondary transition-colors"
                        >
                          <FiHelpCircle className="w-5 h-5" />
                          {hintRevealed ? 'Hide hint' : 'Show hint'}
                        </button>
                        {hintRevealed && (
                          <div className="mt-3 p-5 rounded-xl bg-amber-50 border border-amber-200">
                            <p className="text-base font-medium text-amber-800 mb-2">Hint</p>
                            <p className="text-warm-text text-base">{selectedPuzzle.hint}</p>
                          </div>
                        )}
                      </div>
                      {!completedPuzzleIds.has(selectedPuzzle.id) && !hasVerification(selectedPuzzle) && (
                        <div className="mb-5">
                          <label className="block text-base font-medium text-warm-text mb-2">Your answer (type key number, word, or phrase to verify)</label>
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="text"
                              value={puzzleUserAnswer}
                              onChange={e => setPuzzleUserAnswer(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCheckPuzzleAnswer()}
                              placeholder="e.g. 533, switch, 4 litres"
                              className="flex-1 min-w-[140px] px-4 py-2.5 border border-warm-border rounded-xl text-base text-warm-text placeholder-warm-textSecondary focus:ring-2 focus:ring-warm-primary focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={handleCheckPuzzleAnswer}
                              disabled={!puzzleUserAnswer.trim()}
                              className="px-5 py-2.5 rounded-xl bg-warm-secondary text-warm-text font-medium hover:bg-warm-container disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Check answer
                            </button>
                          </div>
                          {puzzleAnswerChecked && (
                            <p className={`mt-2 text-base font-medium ${puzzleAnswerCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                              {puzzleAnswerCorrect ? 'Correct! You can claim coins below.' : "Not quite. Try again or reveal the full answer to learn."}
                            </p>
                          )}
                        </div>
                      )}
                      {!answerRevealed ? (
                        <button
                          type="button"
                          onClick={() => setAnswerRevealed(true)}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-warm-container text-warm-text text-base hover:bg-warm-border transition-colors"
                        >
                          <FiEye className="w-5 h-5" /> Reveal answer
                        </button>
                      ) : (
                        <>
                          <div className="p-5 rounded-xl bg-green-50 border border-green-200 mb-5">
                            <p className="text-base font-medium text-green-800 mb-2">Answer</p>
                            <p className="text-warm-text text-base leading-relaxed whitespace-pre-wrap">{selectedPuzzle.answer}</p>
                          </div>
                          {/* Verification: always show when answer is revealed and puzzle has verification data */}
                          {!completedPuzzleIds.has(selectedPuzzle.id) && selectedPuzzle.verification_question && Array.isArray(selectedPuzzle.verification_options) && selectedPuzzle.verification_options.length >= 2 && (
                            <div className="p-5 rounded-xl bg-warm-container/50 border border-warm-border" key="verification-block">
                              <p className="text-base font-semibold text-warm-text mb-2">Verification question</p>
                              <p className="text-warm-text text-base mb-4">{selectedPuzzle.verification_question}</p>
                              <div className="space-y-3">
                                {selectedPuzzle.verification_options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => !verificationSubmitted && setVerificationSelected(idx)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border text-base transition-all ${
                                      verificationSelected === idx
                                        ? 'border-warm-primary bg-warm-primary/10 text-warm-text'
                                        : 'border-warm-border bg-white text-warm-text hover:bg-warm-container'
                                    } ${verificationSubmitted ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                                  >
                                    <span className="font-medium text-warm-textSecondary mr-2">{String.fromCharCode(65 + idx)})</span>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              {!verificationSubmitted ? (
                                <button
                                  type="button"
                                  onClick={handleVerificationSubmit}
                                  disabled={verificationSelected === null}
                                  className="mt-4 px-5 py-2.5 rounded-xl bg-warm-primary text-white text-base font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Submit
                                </button>
                              ) : (
                                <div className="mt-4">
                                  <p className={`text-base font-medium ${verificationCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                                    {verificationCorrect ? 'Correct! You can claim coins below.' : 'Incorrect. You can try this puzzle again tomorrow.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                {puzzleBlockedUntilTomorrow && (
                  <div className="shrink-0 w-full py-2 px-6 border-t border-warm-border bg-warm-container/30 rounded-b-2xl flex justify-end">
                    <button type="button" onClick={closePuzzleModal} className="px-5 py-2.5 rounded-xl border border-warm-border text-warm-textSecondary hover:bg-warm-border text-base">
                      Close
                    </button>
                  </div>
                )}
                {!puzzleBlockedUntilTomorrow && (
                  <div className="py-2.5 px-6 border-t border-warm-border bg-warm-container/30 flex justify-end shrink-0">
                    <button type="button" onClick={closePuzzleModal} className="px-5 py-2.5 rounded-xl border border-warm-border text-warm-textSecondary hover:bg-warm-border text-base">
                      Close
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CS Fundamentals MCQ Modal */}
        <AnimatePresence>
          {showMcqModal && selectedMcq && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={closeMcqModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-warm-border"
              >
                <div className="p-6 border-b border-warm-border flex items-center justify-between bg-warm-container/50">
                  <div>
                    <span className="text-xs font-medium text-warm-textSecondary uppercase">{selectedMcq.subject}</span>
                    {selectedMcq.topic && (
                      <span className="text-xs text-warm-textSecondary ml-2">· {selectedMcq.topic}</span>
                    )}
                    <p className="text-sm text-warm-textSecondary mt-0.5">+{selectedMcq.reward} coins · {selectedMcq.difficulty}</p>
                  </div>
                  <button onClick={closeMcqModal} className="p-2 rounded-lg hover:bg-warm-border text-warm-textSecondary">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <p className="text-warm-text font-medium mb-4">{selectedMcq.question}</p>
                  <div className="space-y-2">
                    {selectedMcq.options.map((opt, i) => {
                      const isSelected = mcqSelectedOption === opt;
                      const correct = mcqSubmitted && isMcqOptionCorrect(selectedMcq, opt, i);
                      const wrong = mcqSubmitted && isSelected && !isMcqOptionCorrect(selectedMcq, opt, i);
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={mcqSubmitted}
                          onClick={() => !mcqSubmitted && setMcqSelectedOption(opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            wrong ? 'border-red-300 bg-red-50 text-red-800' :
                            correct ? 'border-green-300 bg-green-50 text-green-800' :
                            isSelected ? 'border-warm-primary bg-warm-container text-warm-text' :
                            'border-warm-border hover:bg-warm-container/50 text-warm-text'
                          }`}
                        >
                          <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span> {opt}
                        </button>
                      );
                    })}
                  </div>
                  {!mcqSubmitted ? (
                    <button
                      type="button"
                      disabled={mcqSelectedOption === null || completingMcq}
                      onClick={handleMcqSubmit}
                      className="mt-4 w-full py-2 rounded-xl bg-warm-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completingMcq ? 'Awarding…' : 'Submit'}
                    </button>
                  ) : (
                    <div className="mt-4 p-4 rounded-xl bg-warm-container border border-warm-border">
                      <p className="text-sm font-medium text-warm-text mb-1">Explanation</p>
                      <p className="text-sm text-warm-textSecondary">{selectedMcq.explanation}</p>
                      {mcqSelectedOption != null && isMcqOptionCorrect(selectedMcq, mcqSelectedOption, selectedMcq.options.indexOf(mcqSelectedOption)) && (
                        <p className="text-sm text-green-600 font-medium mt-2">Correct! +{selectedMcq.reward} coins earned.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-warm-border bg-warm-container/30">
                  <button type="button" onClick={closeMcqModal} className="w-full py-2 rounded-xl border border-warm-border text-warm-textSecondary hover:bg-warm-border">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Challenges;
