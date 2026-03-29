import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getAllRewardBases } from '../../utils/gameRewardPreview';

/** Light stat tile: value block + small muted label (centered) — compact for admin cards */
function StatTile({ label, children }) {
  return (
    <div className="rounded-xl bg-warm-container/30 px-1.5 py-2 sm:py-2.5 text-center shadow-sm ring-1 ring-warm-border/15">
      <div className="min-h-[1.5rem] sm:min-h-[1.75rem] flex flex-col items-center justify-center">
        {children}
      </div>
      <p className="mt-1 text-[9px] sm:text-[10px] font-medium text-warm-textSecondary uppercase tracking-wide leading-tight">
        {label}
      </p>
    </div>
  );
}

function GameStatGrid({ game }) {
  const b = getAllRewardBases(game);
  const cE = b.easy.coins;
  const cM = b.medium.coins;
  const cH = b.hard.coins;
  const xE = b.easy.xp;
  const xM = b.medium.xp;
  const xH = b.hard.xp;
  const xpOne = xE === xM && xM === xH;
  const coinsOne = cE === cM && cM === cH;

  const tl = game.gameConfig?.timeLimit;
  const plays = game.stats?.totalPlays ?? 0;

  const big = 'text-lg sm:text-xl font-bold text-warm-primary tabular-nums leading-tight';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      <StatTile label="Coins">
        {coinsOne ? (
          <span className={big}>{cE}</span>
        ) : (
          <span className={`${big} !text-sm sm:!text-base normal-case tracking-normal`}>
            {cE} · {cM} · {cH}
          </span>
        )}
      </StatTile>
      <StatTile label="XP (E / M / H)">
        {xpOne ? (
          <span className={big}>{xE}</span>
        ) : (
          <span className={`${big} !text-sm sm:!text-base normal-case tracking-normal`}>
            {xE} · {xM} · {xH}
          </span>
        )}
      </StatTile>
      <StatTile label="Time (sec)">
        <span className={big}>{tl != null ? tl : '—'}</span>
      </StatTile>
      <StatTile label="Total plays">
        <span className={big}>{plays}</span>
      </StatTile>
    </div>
  );
}

function DifficultyPills() {
  return (
    <div>
      <p className="text-xs font-medium text-warm-textSecondary uppercase tracking-wide mb-2">Difficulty</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
          Easy
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 ring-1 ring-amber-200/80">
          Medium
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/70">
          Hard
        </span>
      </div>
    </div>
  );
}

/** Number inputs: select all on focus so typing replaces 0 instead of producing "01". */
function AdminNumberInput({
  id,
  label,
  hint,
  min,
  max,
  value,
  onChange,
  placeholder,
  required: isRequired
}) {
  const strVal = value === '' || value === null || value === undefined ? '' : String(value);
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-warm-text mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        placeholder={placeholder}
        required={isRequired}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="w-full px-3 py-2 border border-warm-border/80 rounded-xl bg-warm-container/20 text-warm-text focus:ring-2 focus:ring-warm-primary/40 focus:border-warm-primary"
      />
      {hint && <p className="text-xs text-warm-textSecondary mt-1">{hint}</p>}
    </div>
  );
}

const DEFAULT_MIN_SCORES = { easy: 35, medium: 50, hard: 75 };

function clampMinScorePct(n) {
  return Math.min(100, Math.max(0, Number(n) || 0));
}

/** Load per-difficulty min scores: new minScores, else legacy single minScore, else defaults. Stored 0 = use default. */
function initialMinScoresFromGame(gc) {
  const ms = gc?.minScores;
  const legacy = gc?.minScore;
  const hasTier =
    ms &&
    typeof ms === 'object' &&
    ['easy', 'medium', 'hard'].some((k) => typeof ms[k] === 'number' && !Number.isNaN(ms[k]));
  if (hasTier) {
    const pick = (k) => {
      const v = ms[k];
      if (typeof v === 'number' && !Number.isNaN(v) && v > 0) {
        return clampMinScorePct(v);
      }
      return DEFAULT_MIN_SCORES[k];
    };
    return { easy: pick('easy'), medium: pick('medium'), hard: pick('hard') };
  }
  if (typeof legacy === 'number' && legacy > 0 && legacy <= 100) {
    const v = clampMinScorePct(legacy);
    return { easy: v, medium: v, hard: v };
  }
  return { ...DEFAULT_MIN_SCORES };
}

const emptyForm = () => ({
  slug: '',
  name: '',
  description: '',
  rewards: {
    baseCoins: 10,
    /** empty string = auto XP from coins */
    baseXp: ''
  },
  gameConfig: {
    timeLimit: '',
    minScores: { ...DEFAULT_MIN_SCORES }
  },
  tags: []
});

const AdminGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  /** Which difficulty tier the min-score field is editing (Easy / Medium / Hard) */
  const [minScoreDifficulty, setMinScoreDifficulty] = useState('easy');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('/api/admin/games', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Could not load games');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGame = async (e) => {
    e.preventDefault();
    if (!editingGame) return;
    try {
      const gc = formData.gameConfig || {};
      const prevGc = editingGame?.gameConfig || {};
      const prevR = editingGame.rewards || {};

      const rewards = {
        ...prevR,
        baseCoins: Number(formData.rewards?.baseCoins) || 0
      };
      const xpRaw = formData.rewards?.baseXp;
      const xpStr = xpRaw === '' || xpRaw == null ? '' : String(xpRaw).trim();
      if (xpStr === '') {
        delete rewards.baseXp;
      } else {
        const bx = Number(xpStr);
        if (Number.isFinite(bx) && bx >= 0) {
          rewards.baseXp = bx;
        } else {
          delete rewards.baseXp;
        }
      }

      const ms = gc.minScores || DEFAULT_MIN_SCORES;
      const minScoresPayload = {
        easy: clampMinScorePct(ms.easy),
        medium: clampMinScorePct(ms.medium),
        hard: clampMinScorePct(ms.hard)
      };

      const nextGameConfig = {
        ...prevGc,
        timeLimit:
          gc.timeLimit === '' || gc.timeLimit === null || gc.timeLimit === undefined
            ? undefined
            : Number(gc.timeLimit),
        minScores: minScoresPayload
      };
      delete nextGameConfig.minScore;

      const payload = {
        name: formData.name,
        description: formData.description,
        difficulty: editingGame.difficulty,
        // System / cosmetic fields: not editable in this form — preserve from DB
        category: editingGame.category,
        type: editingGame.type,
        icon: editingGame.icon,
        color: editingGame.color,
        thumbnail: editingGame.thumbnail || undefined,
        tags: formData.tags,
        rewards,
        gameConfig: nextGameConfig
      };

      await axios.put(`/api/admin/games/${editingGame._id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Game settings saved');
      setShowEditModal(false);
      setEditingGame(null);
      setFormData(emptyForm());
      fetchGames();
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error(error.response?.data?.error || 'Update failed');
    }
  };

  const toggleGameStatus = async (gameId) => {
    try {
      await axios.put(
        `/api/admin/games/${gameId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      fetchGames();
      toast.success('Status updated');
    } catch (error) {
      console.error('Error toggling game status:', error);
      toast.error('Could not toggle status');
    }
  };

  const openEditModal = (game) => {
    setEditingGame(game);
    const r = game.rewards || {};
    const gc = game.gameConfig || {};
    setFormData({
      slug: game.slug,
      name: game.name,
      description: game.description,
      rewards: {
        baseCoins: r.baseCoins ?? 10,
        baseXp: typeof r.baseXp === 'number' && !Number.isNaN(r.baseXp) ? r.baseXp : ''
      },
      gameConfig: {
        timeLimit: gc.timeLimit != null ? gc.timeLimit : '',
        minScores: initialMinScoresFromGame(gc)
      },
      tags: game.tags || []
    });
    setMinScoreDifficulty('easy');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-warm-border border-t-warm-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-text tracking-tight">Games</h1>
        <p className="text-warm-textSecondary mt-1 max-w-2xl">
          Configure rewards and visibility. Players choose Easy, Medium, or Hard when they play.
        </p>
      </div>

      <div className="grid gap-6">
        {games.map((game) => (
          <motion.div
            key={game._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warm-card rounded-2xl border border-warm-border/80 p-5 sm:p-7 shadow-sm"
          >
            <div className="flex gap-4 sm:gap-5">
              <span
                className="text-2xl sm:text-3xl shrink-0 leading-none flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-warm-container/50 ring-1 ring-warm-border/20"
                aria-hidden
              >
                {game.icon}
              </span>
              <div className="min-w-0 flex-1 flex flex-col gap-4 sm:gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-warm-text truncate">{game.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ring-1 ${
                        game.isActive
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                          : 'bg-warm-container text-warm-textSecondary ring-warm-border/50'
                      }`}
                    >
                      {game.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => toggleGameStatus(game._id)}
                      className={`p-2.5 rounded-xl transition-colors ${
                        game.isActive
                          ? 'text-warm-textSecondary hover:bg-warm-container/80 hover:text-warm-text'
                          : 'text-warm-primary hover:bg-warm-container/80'
                      }`}
                      title={game.isActive ? 'Hide game' : 'Show game'}
                      aria-label={game.isActive ? 'Hide game from players' : 'Show game to players'}
                    >
                      {game.isActive ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => openEditModal(game)}
                      className="p-2.5 text-warm-primary hover:bg-warm-container/80 rounded-xl transition-colors"
                      title="Edit settings"
                      aria-label="Edit game settings"
                    >
                      <FiEdit className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <p className="text-sm text-warm-textSecondary/90 leading-relaxed line-clamp-2 italic">
                  {game.description}
                </p>

                <DifficultyPills />

                <GameStatGrid game={game} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-warm-card rounded-2xl shadow-xl border border-warm-border/80 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-warm-border/60">
              <h2 className="text-xl font-bold text-warm-text tracking-tight">Edit game settings</h2>
            </div>

            <form onSubmit={handleEditGame} className="p-6 space-y-6">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide">Basic info</h3>
                <div>
                  <label className="block text-sm font-medium text-warm-text mb-1">Display name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-warm-border/80 rounded-xl bg-warm-container/20 text-warm-text focus:ring-2 focus:ring-warm-primary/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-text mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-warm-border/80 rounded-xl bg-warm-container/20 text-warm-text focus:ring-2 focus:ring-warm-primary/40"
                    required
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-xl bg-warm-container/25 p-4 ring-1 ring-warm-border/20">
                <h3 className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide">Rewards</h3>
                <AdminNumberInput
                  id="baseCoins"
                  label="Base coins"
                  hint="Easy-tier coin base. Medium uses 2× and Hard 3× that value (e.g. 10 → 10 / 20 / 30 coins). Leave games without override to use app defaults 10 / 20 / 30. Final payout still scales with score, perfect bonus, and time."
                  min={0}
                  value={formData.rewards.baseCoins}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      rewards: { ...formData.rewards, baseCoins: v === '' ? '' : Number(v) }
                    })
                  }
                />
                <AdminNumberInput
                  id="baseXp"
                  label="Base XP (optional)"
                  hint="Easy-tier XP only. Medium & Hard multiply using the app ladder vs Easy (same ratios as 20→30→40 when Easy is 20). Example: 10 → Easy 10 XP, Medium 15, Hard 20. Leave empty to derive XP from scaled coins."
                  min={0}
                  value={formData.rewards.baseXp}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      rewards: { ...formData.rewards, baseXp: v }
                    })
                  }
                />
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide">Game settings</h3>
                <AdminNumberInput
                  id="timeLimit"
                  label="Time limit (sec)"
                  hint="Medium & Hard only: this is the reference time in seconds. If the player finishes faster than this cap, they get extra coins — 1 bonus coin for each full 30 seconds under the cap (no bonus if they are slower). Easy ignores this. Example: cap 300s and finish in 200s → about 3 extra coins."
                  min={0}
                  placeholder="e.g. 300"
                  value={formData.gameConfig.timeLimit}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      gameConfig: { ...formData.gameConfig, timeLimit: v }
                    })
                  }
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide">
                  Minimum score to earn
                </h3>
                <p className="text-xs text-warm-textSecondary leading-relaxed">
                  Choose a <strong className="text-warm-text/90">difficulty</strong> (play level), then set the minimum
                  score % required to earn coins and XP for that level. Repeat for each tier if needed.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label
                      htmlFor="minScoreDifficulty"
                      className="block text-sm font-medium text-warm-text mb-1"
                    >
                      Difficulty
                    </label>
                    <select
                      id="minScoreDifficulty"
                      value={minScoreDifficulty}
                      onChange={(e) => setMinScoreDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-border/80 rounded-xl bg-warm-container/20 text-warm-text focus:ring-2 focus:ring-warm-primary/40"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <AdminNumberInput
                    id="minScoreTier"
                    label="Min score (%)"
                    hint={`Editing ${minScoreDifficulty}. Built-in defaults: Easy 35%, Medium 50%, Hard 75%. (Stored 0 uses those defaults.)`}
                    min={0}
                    max={100}
                    value={formData.gameConfig.minScores[minScoreDifficulty]}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        gameConfig: {
                          ...formData.gameConfig,
                          minScores: {
                            ...formData.gameConfig.minScores,
                            [minScoreDifficulty]:
                              v === '' ? 0 : Math.min(100, Math.max(0, Number(v) || 0))
                          }
                        }
                      })
                    }
                  />
                </div>
              </section>

              <section>
                <label className="block text-sm font-medium text-warm-text mb-1">Tags (optional)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-warm-border/80 rounded-xl bg-warm-container/20 text-warm-text focus:ring-2 focus:ring-warm-primary/40"
                  placeholder="logic, quick"
                />
              </section>

              <div className="flex justify-end gap-3 pt-2 border-t border-warm-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGame(null);
                    setFormData(emptyForm());
                    setMinScoreDifficulty('easy');
                  }}
                  className="px-4 py-2.5 text-warm-text bg-warm-container/80 rounded-xl hover:bg-warm-container ring-1 ring-warm-border/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-warm-primary text-white rounded-xl hover:opacity-95 font-medium"
                >
                  Save changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminGames;
