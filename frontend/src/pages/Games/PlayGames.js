import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiStar, FiAward, FiSearch, FiTarget, FiLogOut } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import GamePlayer from '../../components/Games/GamePlayer';
import LevelSelector from '../../components/Games/LevelSelector';
import DailyChallenge, { setDailyChallengeCompleted } from '../../components/Games/DailyChallenge';
import DailyChallengeSession from '../../components/Games/DailyChallengeSession';
import { setExtendedWordBank } from '../../utils/verbalEngine';
import { getDailyChallengeProgress } from '../../utils/dailyChallengeStorage';
import toast from 'react-hot-toast';

const PlayGames = () => {
  const { user, loading: authLoading, logout, updateBalance, updateUser } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [showDailyChallengeSession, setShowDailyChallengeSession] = useState(false);
  const [dailyChallengeRefreshKey, setDailyChallengeRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGamesData = useCallback(async () => {
    try {
      setLoading(true);
      const [gamesRes, challengesRes] = await Promise.all([
        api.get('/api/games/active'),
        api.get('/api/challenges/active')
      ]);
      const gamesList = Array.isArray(gamesRes.data) ? gamesRes.data : (gamesRes.data?.games ?? []);
      const challengesList = Array.isArray(challengesRes.data) ? challengesRes.data : (challengesRes.data?.challenges ?? []);
      setGames(gamesList);
      setChallenges(challengesList);
    } catch (error) {
      console.error('Error fetching games data:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        toast.error('Session expired or not allowed. Please log in again.');
      } else if (!error.response) {
        toast.error(
          'Could not reach the game server. Check that REACT_APP_API_URL points to your Render API.'
        );
      }
      // Don't clear games/challenges on error so a failed refresh doesn't wipe the list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchVerbalDataset = async () => {
      try {
        const r = await api.get('/api/dataset/verbal');
        if (r.data?.words?.length) setExtendedWordBank(r.data.words);
      } catch (_) {
        // ignore; use default word bank only
      }
    };
    fetchVerbalDataset();
  }, []);

  // Fetch games after auth is ready (avoids 401 before session cookie is used on first paint)
  useEffect(() => {
    if (authLoading || !user) return;
    fetchGamesData();
  }, [authLoading, user?._id, fetchGamesData]);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setShowLevelSelector(true);
    setSelectedDifficulty('easy');
    setIsDailyChallenge(false);
  };

  const handleLevelSelected = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setShowLevelSelector(false);
    setShowGamePlayer(true);
  };

  const handleDailyChallengeStart = () => {
    setShowDailyChallengeSession(true);
  };

  const handleDailyChallengeComplete = async (result) => {
    try {
      const response = await api.post('/api/daily-challenge/complete', {
        game: 'daily_challenge',
        score: result?.score ?? 0,
        time: result?.time ?? 0,
        accuracy: result?.accuracy ?? 0,
        correctAnswers: result?.correctAnswers ?? 0
      });
      if (response.data.success) {
        setDailyChallengeCompleted();
        setDailyChallengeRefreshKey((k) => k + 1);
        const coins = response.data.coinsAwarded ?? 0;
        const xp = response.data.xpAwarded ?? 0;
        toast.success(response.data.message || `Daily challenge completed! +${coins} coins, +${xp} XP`);
        try {
          const userResponse = await api.get('/api/auth/verify');
          if (userResponse.data.user) updateUser(userResponse.data.user);
        } catch (e) {
          console.error(e);
        }
      } else {
        toast.error(response.data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete daily challenge');
    } finally {
      setShowDailyChallengeSession(false);
    }
  };

  const handleChallengeSelect = (challenge) => {
    setSelectedChallenge(challenge);
    setSelectedGame(challenge.gameId);
    // Challenges should use medium or hard difficulty (not easy)
    // Default to medium, but can be set based on challenge requirements
    const challengeDifficulty = challenge.requirements?.difficulty || 'medium';
    setSelectedDifficulty(challengeDifficulty === 'easy' ? 'medium' : challengeDifficulty);
    setShowGamePlayer(true);
  };

  const handleGameComplete = async (result) => {
    try {
      if (isDailyChallenge) {
        // Submit daily challenge completion
        const response = await api.post('/api/daily-challenge/complete', {
          game: selectedGame.slug || selectedGame._id,
          score: result.score,
          time: result.time,
          accuracy: result.accuracy
        });

        if (response.data.success) {
          toast.success(response.data.message || 'Daily challenge completed!');
          
          // Fetch updated user data to get latest totalEarned and coinBalance
          try {
            const userResponse = await api.get('/api/auth/verify');
            if (userResponse.data.user) {
              updateUser(userResponse.data.user);
            }
          } catch (error) {
            console.error('Error fetching updated user data:', error);
          }
          
          await fetchGamesData();
          // Do NOT auto-close game player; let user close via X
        }
      } else {
        // Submit regular game play with backend validation
        // Debug: Log what we're sending
        console.log('Submitting game result:', {
          game: selectedGame.slug || selectedGame._id,
          difficulty: selectedDifficulty,
          score: result.score,
          correctAnswers: result.correctAnswers,
          time: result.time,
          accuracy: result.accuracy
        });
        
        const response = await api.post('/api/game/play', {
          game: selectedGame.slug || selectedGame._id,
          difficulty: selectedDifficulty,
          score: result.score || 0,
          time: result.time || 0,
          accuracy: result.accuracy || 0,
          correctAnswers: result.correctAnswers || 0
        });

        if (response.data.success) {
          toast.success(response.data.message || `You earned ${response.data.coinsAwarded} coins!`);
          
          if (response.data.levelUnlocked) {
            toast.success(`🎉 Level unlocked! You can now play ${selectedDifficulty === 'easy' ? 'Medium' : 'Hard'} difficulty!`);
          }
          
          // Fetch updated user data to get latest totalEarned and coinBalance
          try {
            const userResponse = await api.get('/api/auth/verify');
            if (userResponse.data.user) {
              updateUser(userResponse.data.user);
            }
          } catch (error) {
            console.error('Error fetching updated user data:', error);
            // Fallback: update balance if provided
            if (response.data.newBalance !== undefined) {
              updateBalance(response.data.newBalance);
            }
          }
          
          // Refresh data
          await fetchGamesData();
          // Do NOT auto-close game player here; user can close with X
        } else {
          toast.error(response.data.error || 'Failed to process game completion');
        }
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      const d = error.response?.data;
      const msg =
        (typeof d?.error === 'string' && d.error) ||
        (Array.isArray(d?.errors) && d.errors[0]) ||
        (typeof d?.message === 'string' && d.message) ||
        error.message ||
        'Failed to submit score';
      toast.error(msg);
    }
  };

  const getFilteredGames = () => {
    if (!searchQuery) return games;
    const q = searchQuery.toLowerCase();
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q)
    );
  };

  const getFilteredChallenges = () => {
    if (!searchQuery) return challenges;
    const q = searchQuery.toLowerCase();
    return challenges.filter(
      (challenge) =>
        challenge.title.toLowerCase().includes(q) ||
        challenge.description.toLowerCase().includes(q)
    );
  };

  // Only show global loading spinner when no game modal is open
  if (loading && !showGamePlayer && !showLevelSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showDailyChallengeSession) {
    const progressForResume = getDailyChallengeProgress();
    return (
      <DailyChallengeSession
        onComplete={handleDailyChallengeComplete}
        onClose={() => {
          setShowDailyChallengeSession(false);
          setDailyChallengeRefreshKey((k) => k + 1);
        }}
        initialProgress={progressForResume}
      />
    );
  }

  if (showLevelSelector && selectedGame) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-warm-text">
              {selectedGame.slug === 'memory-game' || selectedGame.slug === 'verbal-iq'
                ? 'Verbal IQ'
                : selectedGame.slug === 'reaction-time'
                  ? 'Code Breaker'
                  : selectedGame.slug === 'puzzle-solver'
                    ? 'Pattern IQ'
                    : selectedGame.slug === 'word-scramble'
                      ? 'Word Shuffle'
                      : selectedGame.name}
            </h2>
            <button
              onClick={() => {
                setShowLevelSelector(false);
                setSelectedGame(null);
              }}
              className="text-warm-textSecondary hover:text-warm-text transition-colors"
            >
              ✕
            </button>
          </div>
          <LevelSelector
            gameSlug={selectedGame.slug || selectedGame._id}
            game={selectedGame}
            onLevelSelect={handleLevelSelected}
            selectedLevel={selectedDifficulty}
          />
        </motion.div>
      </div>
    );
  }

  if (showGamePlayer && selectedGame) {
    return (
      <GamePlayer
        game={selectedGame}
        challenge={selectedChallenge}
        difficulty={selectedDifficulty}
        onComplete={handleGameComplete}
        onClose={() => {
          setShowGamePlayer(false);
          setSelectedGame(null);
          setSelectedChallenge(null);
          setIsDailyChallenge(false);
          setSelectedDifficulty('easy');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-background">
      <div className="container-fluid py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-warm-text mb-4">
              🎮 Play Games & Earn Coins
            </h1>
            <p className="text-lg text-warm-textSecondary max-w-2xl mx-auto">
              Challenge yourself with exciting games and complete challenges to earn coins! 
              Your current balance: <span className="text-2xl font-bold text-warm-primary">{user?.coinBalance || 0} coins</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                navigate('/login');
              }
            }}
            className="btn-secondary"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search games and challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-warm-textSecondary w-5 h-5" />
          </div>
        </motion.div>

        {/* Daily Challenge Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-warm-text mb-6 flex items-center gap-2">
            <FiAward className="w-6 h-6 text-warm-primary" />
            Daily Challenge
          </h2>
          <DailyChallenge key={dailyChallengeRefreshKey} onStart={handleDailyChallengeStart} />
        </motion.div>

        {/* Active Challenges Section */}
        {getFilteredChallenges().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-warm-text mb-6 flex items-center gap-2">
              <FiTarget className="w-6 h-6 text-warm-primary" />
              Active Challenges
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredChallenges().map((challenge, index) => (
                <motion.div
                  key={challenge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => handleChallengeSelect(challenge)}
                  style={{ borderLeft: `4px solid ${challenge.color || '#3B82F6'}` }}
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
                        <div className="text-right mt-2">
                          <div className="text-2xl font-bold text-warm-primary">
                            +{challenge.rewards.coins}
                          </div>
                          <div className="text-sm text-warm-textSecondary">coins</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-warm-textSecondary">Min Score</div>
                        <div className="font-semibold text-warm-text">
                          {challenge.requirements.minScore}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-warm-textSecondary">Time Limit</div>
                        <div className="font-semibold text-warm-text">
                          {challenge.requirements.timeLimit}s
                        </div>
                      </div>
                    </div>

                    <button className="btn bg-warm-primary text-white hover:opacity-90 w-full">
                      <FiPlay className="w-4 h-4 mr-2" />
                      Start Challenge
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-warm-text mb-6 flex items-center gap-2">
            <FiPlay className="w-6 h-6 text-warm-primary" />
            Available Games
          </h2>
          
          {getFilteredGames().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-warm-textSecondary mb-2">No games found</h3>
              <p className="text-warm-textSecondary">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getFilteredGames().map((game, index) => {
                const isVerbal = game.slug === 'memory-game' || game.slug === 'verbal-iq';
                const isCodeBreaker = game.slug === 'reaction-time';
                const isPatternIQ = game.slug === 'puzzle-solver';
                const isWordShuffle = game.slug === 'word-scramble';
                const displayName = isVerbal ? 'Verbal IQ' : isCodeBreaker ? 'Code Breaker' : isPatternIQ ? 'Pattern IQ' : isWordShuffle ? 'Word Shuffle' : game.name;
                const displayDescription = isVerbal
                  ? 'Test your vocabulary, synonyms, antonyms and grammar skills.'
                  : isCodeBreaker
                    ? 'Coding–decoding puzzles: alphabet positions, letter shifts and word transformations.'
                    : isPatternIQ
                      ? 'Identify patterns in numbers and letters to find the missing piece.'
                      : isWordShuffle
                        ? 'Rearrange letters to discover the hidden word.'
                        : game.description;

                return (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="relative overflow-hidden rounded-t-2xl">
                    {/* Custom thumbnails for each game by ID. Update 'gameImages.js' to change images. */}
                    {/* <img
                      src={
                        game.thumbnail
                          ? game.thumbnail
                          :gameImages[game._id] || gameImages[game.id] || "/images/reaction-time.jpg"
                      }
                      alt={game.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    /> */}
                    <div className="absolute top-2 right-2">
                      <span className={`badge badge-${game.difficulty}`}>
                        {game.difficulty}
                      </span>
                    </div>
                    {game.isFeatured && (
                      <div className="absolute top-2 left-2">
                        <FiStar className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{game.icon || '🎮'}</span>
                      <h3 className="text-lg font-bold text-warm-text">
                        {displayName}
                      </h3>
                    </div>
                    
                    <p className="text-warm-textSecondary text-sm mb-4">
                      {displayDescription}
                    </p>
                    
                    <div className="flex items-center justify-center">
                      <button className="btn bg-warm-primary text-white hover:opacity-90 btn-sm">
                        <FiPlay className="w-4 h-4 mr-1" />
                        Play
                      </button>
                    </div>
                  </div>
                </motion.div>
              )})}
            </div>
          )}
        </motion.div>

        {/* User Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <div className="card">
            <div className="card-body">
              <h3 className="text-xl font-bold text-warm-text mb-4">Your Gaming Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warm-primary">{user?.coinBalance || 0}</div>
                  <div className="text-sm text-warm-textSecondary">Current Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warm-primary">{user?.totalEarned || 0}</div>
                  <div className="text-sm text-warm-textSecondary">Total Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warm-primary">{user?.badgeCount || 0}</div>
                  <div className="text-sm text-warm-textSecondary">Badges Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warm-primary">
                    {user?.lastLogin && !Number.isNaN(new Date(user.lastLogin).getTime())
 ? new Date(user.lastLogin).toLocaleDateString()
                    : '—'}
                  </div>
                  <div className="text-sm text-warm-textSecondary">Last Login</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayGames;
