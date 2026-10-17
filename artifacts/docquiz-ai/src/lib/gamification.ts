export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'accuracy' | 'speed' | 'consistency' | 'mastery';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Badge[] = [
  {
    id: 'first_strike',
    title: 'First Strike',
    description: 'Complete your first active recall study quiz.',
    icon: '🎯',
    category: 'consistency',
    rarity: 'common',
  },
  {
    id: 'flawless_recall',
    title: 'Flawless Recall',
    description: 'Score 100% on any quiz with 5 or more questions.',
    icon: '🏆',
    category: 'accuracy',
    rarity: 'epic',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Maintain a lightning-fast average pace under 12 seconds per question.',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
  },
  {
    id: 'streak_master',
    title: 'Streak Flame',
    description: 'Answer 5 questions in a row correctly in a single session.',
    icon: '🔥',
    category: 'consistency',
    rarity: 'rare',
  },
  {
    id: 'deep_scholar',
    title: 'Deep Scholar',
    description: 'Reach Level 3 and accumulate over 500 XP.',
    icon: '🧠',
    category: 'mastery',
    rarity: 'epic',
  },
  {
    id: 'zen_mind',
    title: 'Zen Master',
    description: 'Complete a thoughtful, untimed deep study recall session.',
    icon: '🧘',
    category: 'mastery',
    rarity: 'common',
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a study session after 8:00 PM.',
    icon: '🦉',
    category: 'consistency',
    rarity: 'rare',
  },
];

export interface GamificationState {
  xp: number;
  level: number;
  dailyStreak: number;
  lastActiveDate: string | null;
  unlockedBadgeIds: string[];
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
}

const GAMIFICATION_KEY = 'docquiz-ai.gamification';

export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; progress: number } {
  // Level curve: Level 1 (0-150), Level 2 (150-350), Level 3 (350-650), etc.
  let level = 1;
  let threshold = 150;
  let prevThreshold = 0;
  let remaining = xp;

  while (remaining >= threshold) {
    remaining -= threshold;
    prevThreshold = threshold;
    threshold = Math.round(threshold * 1.35);
    level += 1;
  }

  const progress = Math.min(100, Math.round((remaining / threshold) * 100));
  return {
    level,
    currentXp: remaining,
    nextLevelXp: threshold,
    progress,
  };
}

export function loadGamificationState(): GamificationState {
  if (typeof window === 'undefined') {
    return {
      xp: 0,
      level: 1,
      dailyStreak: 1,
      lastActiveDate: null,
      unlockedBadgeIds: [],
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
    };
  }

  const stored = window.localStorage.getItem(GAMIFICATION_KEY);
  if (!stored) {
    const initialState: GamificationState = {
      xp: 50,
      level: 1,
      dailyStreak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      unlockedBadgeIds: [],
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
    };
    saveGamificationState(initialState);
    return initialState;
  }

  try {
    return JSON.parse(stored) as GamificationState;
  } catch {
    return {
      xp: 0,
      level: 1,
      dailyStreak: 1,
      lastActiveDate: null,
      unlockedBadgeIds: [],
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
    };
  }
}

export function saveGamificationState(state: GamificationState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('docquiz-gamification-updated', { detail: state }));
}

export function recordQuizCompletion({
  score,
  total,
  totalTimeSeconds,
  maxStreak,
  isUntimed,
}: {
  score: number;
  total: number;
  totalTimeSeconds: number;
  maxStreak: number;
  isUntimed: boolean;
}): {
  xpEarned: number;
  newBadges: Badge[];
  prevLevel: number;
  newLevel: number;
  state: GamificationState;
} {
  const state = loadGamificationState();
  const prevLevel = calculateLevel(state.xp).level;

  // XP Breakdown
  const baseScoreXp = score * 30;
  const completionXp = 25;
  const streakBonus = maxStreak >= 3 ? maxStreak * 10 : 0;
  const avgPace = total > 0 ? totalTimeSeconds / total : 0;
  const speedBonus = !isUntimed && avgPace > 0 && avgPace < 15 ? 20 : 0;

  const xpEarned = baseScoreXp + completionXp + streakBonus + speedBonus;
  state.xp += xpEarned;
  state.totalQuizzesTaken += 1;
  state.totalQuestionsAnswered += total;
  state.totalCorrectAnswers += score;

  // Daily Streak calculation
  const today = new Date().toISOString().split('T')[0];
  if (!state.lastActiveDate) {
    state.dailyStreak = 1;
  } else if (state.lastActiveDate !== today) {
    const lastDate = new Date(state.lastActiveDate);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      state.dailyStreak += 1;
    } else if (diffDays > 1) {
      state.dailyStreak = 1;
    }
  }
  state.lastActiveDate = today;

  // Check new badge unlocks
  const newBadges: Badge[] = [];
  const currentBadgeSet = new Set(state.unlockedBadgeIds);

  const checkAndUnlock = (badgeId: string, condition: boolean) => {
    if (condition && !currentBadgeSet.has(badgeId)) {
      currentBadgeSet.add(badgeId);
      const b = BADGES.find((item) => item.id === badgeId);
      if (b) newBadges.push(b);
    }
  };

  checkAndUnlock('first_strike', state.totalQuizzesTaken >= 1);
  checkAndUnlock('flawless_recall', total >= 5 && score === total);
  checkAndUnlock('speed_demon', !isUntimed && total >= 3 && avgPace < 12);
  checkAndUnlock('streak_master', maxStreak >= 5);
  checkAndUnlock('deep_scholar', state.xp >= 500);
  checkAndUnlock('zen_mind', isUntimed);

  const hour = new Date().getHours();
  checkAndUnlock('night_owl', hour >= 20 || hour < 4);

  state.unlockedBadgeIds = Array.from(currentBadgeSet);
  const newLevel = calculateLevel(state.xp).level;
  state.level = newLevel;

  saveGamificationState(state);

  return {
    xpEarned,
    newBadges,
    prevLevel,
    newLevel,
    state,
  };
}

// Generate an exam-friendly short takeaway (one-line hook)
export function generateKeyTakeaway(questionText: string, correctAnswer: string, explanation: string): string {
  // If the explanation already has a succinct quote, distill it
  const cleanExp = explanation.replace(/^From the source material:\s*"?/i, '').replace(/"?$/, '').trim();
  
  if (cleanExp.length <= 110) {
    return cleanExp;
  }

  // Extract primary key point
  const firstSentence = cleanExp.split('. ')[0];
  if (firstSentence && firstSentence.length <= 120) {
    return `${firstSentence}.`;
  }

  return `Key Concept: ${correctAnswer} connects directly to "${questionText.slice(0, 45)}…"`;
}

// Generate smart hint without spoiling the answer
export function generateSmartHint(questionText: string, options: string[], correctIndex: number): string {
  const correct = options[correctIndex];
  // Provide a conceptual lead-in or eliminated distractor clue
  const firstWord = correct.split(' ')[0];
  if (firstWord.length > 3) {
    return `Hint: Look for the option emphasizing "${firstWord}…" or the primary governing cause.`;
  }
  return `Hint: Recall the foundational definition from your study material that directly addresses "${questionText.slice(0, 40)}…".`;
}
