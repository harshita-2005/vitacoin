const DailyChallengeConfig = require('../models/DailyChallengeConfig');

const DEFAULTS = {
  baseCoins: 5,
  baseXp: 10,
  bonusCoinsMax: 10,
  bonusXpMax: 15
};

async function getConfig() {
  let doc = await DailyChallengeConfig.findOne();
  if (!doc) {
    doc = await DailyChallengeConfig.create(DEFAULTS);
  }
  return doc.toObject();
}

async function updateConfig(body) {
  const n = (v, fallback) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  };
  const patch = {};
  if (body.baseCoins !== undefined) patch.baseCoins = Math.max(0, Math.min(10000, n(body.baseCoins, DEFAULTS.baseCoins)));
  if (body.baseXp !== undefined) patch.baseXp = Math.max(0, Math.min(100000, n(body.baseXp, DEFAULTS.baseXp)));
  if (body.bonusCoinsMax !== undefined) {
    patch.bonusCoinsMax = Math.max(0, Math.min(10000, n(body.bonusCoinsMax, DEFAULTS.bonusCoinsMax)));
  }
  if (body.bonusXpMax !== undefined) {
    patch.bonusXpMax = Math.max(0, Math.min(100000, n(body.bonusXpMax, DEFAULTS.bonusXpMax)));
  }

  let doc = await DailyChallengeConfig.findOne();
  if (!doc) {
    doc = await DailyChallengeConfig.create({ ...DEFAULTS, ...patch });
  } else {
    Object.assign(doc, patch);
    await doc.save();
  }
  return doc.toObject();
}

module.exports = {
  getConfig,
  updateConfig,
  DEFAULTS
};
