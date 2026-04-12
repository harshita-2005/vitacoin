const Game = require('../models/Game');
const defaultGames = require('../data/defaultGames');

/**
 * If the games collection is empty (typical on first Render deploy), insert defaults.
 * Set AUTO_SEED_GAMES_IF_EMPTY=false to disable.
 */
async function ensureDefaultGamesIfEmpty() {
  const disabled =
    process.env.AUTO_SEED_GAMES_IF_EMPTY === '0' ||
    process.env.AUTO_SEED_GAMES_IF_EMPTY === 'false';
  if (disabled) return;

  const count = await Game.countDocuments();
  if (count > 0) return;

  await Game.insertMany(defaultGames);
  console.log(`Game bootstrap: inserted ${defaultGames.length} default games (was empty).`);
}

module.exports = { ensureDefaultGamesIfEmpty };
