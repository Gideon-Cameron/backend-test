// utils/xpUtils.js

/**
 * Calculates XP earned from a lesson and checks if the user levels up.
 * @param {Object} user - User object (including xp, level, xpNeededForNextLevel).
 * @param {Number} baseXP - Base XP for completing a lesson.
 * @param {Number} scorePercentage - Percentage score of the lesson.
 * @param {Boolean} isPerfectScore - Whether the lesson was completed perfectly.
 * @returns {Object} Updated user object with new XP, level, and xpNeededForNextLevel.
 */
const updateUserXP = (user, baseXP, scorePercentage, isPerfectScore) => {
  const percentageBonusXP = Math.floor((scorePercentage / 10)); // e.g., 72% = 7 XP
  const perfectScoreBonusXP = isPerfectScore && !user.progress.some(p => p.firstPerfectScore) ? 20 : 0;

  let xpEarned = baseXP + percentageBonusXP + perfectScoreBonusXP;
  user.xp += xpEarned;

  // Check for leveling up
  while (user.xp >= user.xpNeededForNextLevel) {
    user.xp -= user.xpNeededForNextLevel;
    user.level += 1;
    user.xpNeededForNextLevel += 50; // Increase level requirement by 50 each level
  }

  return {
    xpEarned,
    updatedUser: {
      xp: user.xp,
      level: user.level,
      xpNeededForNextLevel: user.xpNeededForNextLevel
    }
  };
};

module.exports = { updateUserXP };
