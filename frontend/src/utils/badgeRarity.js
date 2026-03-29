/**
 * Backend stores enum: common | uncommon | rare | epic | legendary
 * UI shows metal tiers (easiest → hardest). Legendary is not used in filters; if present in data, show Mythic.
 */
export const RARITY_LABELS = {
  common: 'Bronze',
  uncommon: 'Silver',
  rare: 'Gold',
  epic: 'Platinum',
  legendary: 'Mythic'
};

export function getRarityLabel(rarity) {
  const k = String(rarity || 'common').toLowerCase();
  return RARITY_LABELS[k] ?? RARITY_LABELS.common;
}
