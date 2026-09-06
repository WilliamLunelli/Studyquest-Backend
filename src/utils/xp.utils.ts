const XP_TIERS = [
  { limit: 120, xpPerMinute: 1 },
  { limit: 240, xpPerMinute: 0.7 },
  { limit: 360, xpPerMinute: 0.4 },
];

export function calculateSessionXp(
  minutesAlreadyStudiedToday: number,
  sessionMinutes: number,
  multiplier: number,
) {
  let remainingMinutes = sessionMinutes;
  let currentMinute = minutesAlreadyStudiedToday;
  let xp = 0;

  for (const tier of XP_TIERS) {
    if (remainingMinutes <= 0) {
      break;
    }

    if (currentMinute >= tier.limit) {
      continue;
    }

    const availableInTier = tier.limit - currentMinute;
    const minutesInTier = Math.min(remainingMinutes, availableInTier);

    xp += minutesInTier * tier.xpPerMinute;
    currentMinute += minutesInTier;
    remainingMinutes -= minutesInTier;
  }

  return Math.round(xp * multiplier);
}

export function calculateLevelFromXp(totalXp: number) {
  let level = 1;
  let remainingXp = totalXp;

  while (remainingXp >= xpNeededForNextLevel(level)) {
    remainingXp -= xpNeededForNextLevel(level);
    level++;
  }

  return level;
}

export function xpNeededForNextLevel(level: number) {
  return 100 + 50 * level;
}

export function getReviewIntervalBySelfRating(
  selfRating: "TRAVEI" | "OK" | "TRANQUILO",
) {
  if (selfRating === "TRAVEI") {
    return 1;
  }

  if (selfRating === "OK") {
    return 3;
  }

  return 7;
}
