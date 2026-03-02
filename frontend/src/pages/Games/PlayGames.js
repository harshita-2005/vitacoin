import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiStar, FiAward, FiClock, FiTrendingUp, FiSearch, FiTarget, FiLogOut } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import GamePlayer from '../../components/Games/GamePlayer';
import LevelSelector from '../../components/Games/LevelSelector';
import DailyChallenge from '../../components/Games/DailyChallenge';
import toast from 'react-hot-toast';

const PlayGames = () => {
  const { user, logout, updateBalance, updateUser } = useAuth();
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
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGamesData();
  }, []);

  const fetchGamesData = async () => {
    try {
      setLoading(true);
      const [gamesRes, challengesRes] = await Promise.all([
        axios.get('/api/games/active'),
        axios.get('/api/challenges/active')
      ]);
      
      setGames(gamesRes.data);
      setChallenges(challengesRes.data);
    } catch (error) {
      console.error('Error fetching games data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!selectedGame) {
      toast.error('Please select a game first');
      return;
    }
    setIsDailyChallenge(true);
    setSelectedDifficulty('medium'); // Daily challenge uses medium difficulty
    setShowGamePlayer(true);
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
        const response = await axios.post('/api/daily-challenge/complete', {
          game: selectedGame.slug || selectedGame._id,
          score: result.score,
          time: result.time,
          accuracy: result.accuracy
        });

        if (response.data.success) {
          toast.success(response.data.message || 'Daily challenge completed!');
          
          // Fetch updated user data to get latest totalEarned and coinBalance
          try {
            const userResponse = await axios.get('/api/auth/verify');
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
        
        const response = await axios.post('/api/game/play', {
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
            const userResponse = await axios.get('/api/auth/verify');
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
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to submit score';
      toast.error(errorMessage);
    }
  };

  const getFilteredGames = () => {
    let filtered = games;
    
    if (filter !== 'all') {
      filtered = filtered.filter(game => game.category === filter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredChallenges = () => {
    let filtered = challenges;
    
    if (filter !== 'all') {
      filtered = filtered.filter(challenge => challenge.type === filter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(challenge => 
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Only show global loading spinner when no game modal is open
  if (loading && !showGamePlayer && !showLevelSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
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
            <h2 className="text-2xl font-bold text-gray-900">
              Select Difficulty - {selectedGame.name}
            </h2>
            <button
              onClick={() => {
                setShowLevelSelector(false);
                setSelectedGame(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <LevelSelector
            gameSlug={selectedGame.slug || selectedGame._id}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🎮 Play Games & Earn Coins
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Challenge yourself with exciting games and complete challenges to earn coins! 
              Your current balance: <span className="text-2xl font-bold text-primary-600">{user?.coinBalance || 0} coins</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                navigate('/login');
              }
            }}
            className="btn btn-outline btn-error"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search games and challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', icon: FiStar },
                { key: 'puzzle', label: 'Puzzle', icon: FiTarget },
                { key: 'action', label: 'Action', icon: FiPlay },
                { key: 'memory', label: 'Memory', icon: FiClock },
                { key: 'daily', label: 'Daily', icon: FiTrendingUp },
                { key: 'weekly', label: 'Weekly', icon: FiAward }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      filter === tab.key
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Daily Challenge Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiAward className="w-6 h-6 text-purple-600" />
            Daily Challenge
          </h2>
          <DailyChallenge onStart={handleDailyChallengeStart} />
        </motion.div>

        {/* Active Challenges Section */}
        {getFilteredChallenges().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiTarget className="w-6 h-6 text-primary-600" />
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {challenge.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`badge badge-${challenge.type}`}>
                          {challenge.type}
                        </span>
                        <div className="text-right mt-2">
                          <div className="text-2xl font-bold text-primary-600">
                            +{challenge.rewards.coins}
                          </div>
                          <div className="text-sm text-gray-500">coins</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Min Score</div>
                        <div className="font-semibold text-gray-800">
                          {challenge.requirements.minScore}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Time Limit</div>
                        <div className="font-semibold text-gray-800">
                          {challenge.requirements.timeLimit}s
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-primary w-full">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiPlay className="w-6 h-6 text-primary-600" />
            Available Games
          </h2>
          
          {getFilteredGames().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No games found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getFilteredGames().map((game, index) => (
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
                      <h3 className="text-lg font-bold text-gray-800">
                        {game.name}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      {game.description}
                    </p>
                    
                    <div className="flex items-center justify-center">
                      <button className="btn btn-primary btn-sm">
                        <FiPlay className="w-4 h-4 mr-1" />
                        Play
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Gaming Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{user?.coinBalance || 0}</div>
                  <div className="text-sm text-gray-500">Current Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{user?.totalEarned || 0}</div>
                  <div className="text-sm text-gray-500">Total Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user?.badgeCount || 0}</div>
                  <div className="text-sm text-gray-500">Badges Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date(user?.lastLogin).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">Last Login</div>
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
