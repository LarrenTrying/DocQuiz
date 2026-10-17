import { useState, useEffect } from 'react';

export type AvatarCategory = 'animal' | 'plant' | 'flower';

export interface AvatarSpec {
  id: string;
  name: string;
  category: AvatarCategory;
  tagline: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const AVATAR_SPECS: AvatarSpec[] = [
  // ANIMALS
  {
    id: 'fox',
    name: 'Curious Fox',
    category: 'animal',
    tagline: 'Sharp intellect & active recall',
    bgColor: 'from-orange-500/20 via-amber-500/15 to-red-500/20',
    borderColor: 'border-orange-500/40',
    emoji: '🦊',
  },
  {
    id: 'owl',
    name: 'Wise Owl',
    category: 'animal',
    tagline: 'Deep comprehension master',
    bgColor: 'from-indigo-500/20 via-primary/15 to-purple-500/20',
    borderColor: 'border-indigo-500/40',
    emoji: '🦉',
  },
  {
    id: 'panda',
    name: 'Zen Panda',
    category: 'animal',
    tagline: 'Calm, focused study rhythm',
    bgColor: 'from-emerald-500/20 via-teal-500/15 to-slate-500/20',
    borderColor: 'border-emerald-500/40',
    emoji: '🐼',
  },
  {
    id: 'cat',
    name: 'Scholar Cat',
    category: 'animal',
    tagline: 'Inquisitive document explorer',
    bgColor: 'from-amber-500/20 via-primary/15 to-yellow-500/20',
    borderColor: 'border-amber-500/40',
    emoji: '🐱',
  },
  {
    id: 'rabbit',
    name: 'Swift Rabbit',
    category: 'animal',
    tagline: '15s Blitz mode champion',
    bgColor: 'from-pink-500/20 via-rose-500/15 to-amber-500/20',
    borderColor: 'border-pink-500/40',
    emoji: '🐰',
  },
  {
    id: 'koala',
    name: 'Mindful Koala',
    category: 'animal',
    tagline: 'Relaxed interval retention',
    bgColor: 'from-teal-500/20 via-emerald-500/15 to-cyan-500/20',
    borderColor: 'border-teal-500/40',
    emoji: '🐨',
  },
  {
    id: 'lion',
    name: 'Courageous Lion',
    category: 'animal',
    tagline: 'Conquering challenging exams',
    bgColor: 'from-amber-500/25 via-yellow-500/20 to-orange-500/25',
    borderColor: 'border-amber-500/40',
    emoji: '🦁',
  },

  // PLANTS
  {
    id: 'monstera',
    name: 'Monstera Sprout',
    category: 'plant',
    tagline: 'Unfolding layered knowledge',
    bgColor: 'from-emerald-600/20 via-green-500/15 to-teal-500/20',
    borderColor: 'border-emerald-600/40',
    emoji: '🌿',
  },
  {
    id: 'bonsai',
    name: 'Ancient Bonsai',
    category: 'plant',
    tagline: 'Disciplined memory mastery',
    bgColor: 'from-green-600/20 via-emerald-500/15 to-amber-600/20',
    borderColor: 'border-green-600/40',
    emoji: '🪴',
  },
  {
    id: 'cactus',
    name: 'Blooming Saguaro',
    category: 'plant',
    tagline: 'Resilient under pressure',
    bgColor: 'from-teal-600/20 via-emerald-500/15 to-lime-500/20',
    borderColor: 'border-teal-600/40',
    emoji: '🌵',
  },
  {
    id: 'clover',
    name: 'Lucky Clover',
    category: 'plant',
    tagline: 'Flawless recall synergy',
    bgColor: 'from-lime-500/20 via-emerald-500/15 to-green-500/20',
    borderColor: 'border-lime-500/40',
    emoji: '🍀',
  },
  {
    id: 'bamboo',
    name: 'Lucky Bamboo',
    category: 'plant',
    tagline: 'Fast-growing study habits',
    bgColor: 'from-emerald-500/20 via-teal-500/15 to-green-600/20',
    borderColor: 'border-emerald-500/40',
    emoji: '🎋',
  },

  // FLOWERS
  {
    id: 'sakura',
    name: 'Cherry Blossom',
    category: 'flower',
    tagline: 'Graceful active recall',
    bgColor: 'from-pink-400/20 via-rose-400/15 to-purple-400/20',
    borderColor: 'border-pink-400/40',
    emoji: '🌸',
  },
  {
    id: 'sunflower',
    name: 'Radiant Sunflower',
    category: 'flower',
    tagline: 'Bright ideas & clear thinking',
    bgColor: 'from-yellow-400/25 via-amber-400/20 to-orange-400/25',
    borderColor: 'border-yellow-400/40',
    emoji: '🌻',
  },
  {
    id: 'lotus',
    name: 'Sacred Lotus',
    category: 'flower',
    tagline: 'Pure focus & clarity',
    bgColor: 'from-violet-400/20 via-fuchsia-400/15 to-indigo-400/20',
    borderColor: 'border-violet-400/40',
    emoji: '🪷',
  },
  {
    id: 'hibiscus',
    name: 'Coral Hibiscus',
    category: 'flower',
    tagline: 'Energetic study enthusiasm',
    bgColor: 'from-rose-500/20 via-primary/15 to-orange-500/20',
    borderColor: 'border-rose-500/40',
    emoji: '🌺',
  },
  {
    id: 'tulip',
    name: 'Spring Tulip',
    category: 'flower',
    tagline: 'Fresh ideas blossoming',
    bgColor: 'from-red-400/20 via-pink-400/15 to-amber-400/20',
    borderColor: 'border-red-400/40',
    emoji: '🌷',
  },
  {
    id: 'daisy',
    name: 'Sunny Daisy',
    category: 'flower',
    tagline: 'Cheerful knowledge recall',
    bgColor: 'from-yellow-300/25 via-amber-300/15 to-lime-300/20',
    borderColor: 'border-yellow-400/40',
    emoji: '🌼',
  },
];

// Hash function for deterministic assignment by username
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const CUSTOM_AVATAR_KEY = 'docquiz-ai.user_avatar.';
const AVATAR_EVENT = 'docquiz-ai:avatar-change';

export function getAvatarSpec(avatarId?: string): AvatarSpec {
  if (!avatarId) return AVATAR_SPECS[0];
  const found = AVATAR_SPECS.find((a) => a.id === avatarId);
  return found || AVATAR_SPECS[0];
}

export function getUserAvatar(username?: string): AvatarSpec {
  if (!username) return AVATAR_SPECS[0];

  // 1. Check custom saved avatar
  try {
    const savedId = localStorage.getItem(`${CUSTOM_AVATAR_KEY}${username.toLowerCase()}`);
    if (savedId) {
      const match = AVATAR_SPECS.find((a) => a.id === savedId);
      if (match) return match;
    }
  } catch {
    // Ignore storage errors
  }

  // 2. Deterministic assignment based on username
  const index = hashString(username.toLowerCase()) % AVATAR_SPECS.length;
  return AVATAR_SPECS[index];
}

export function setUserAvatar(username: string, avatarId: string): void {
  try {
    localStorage.setItem(`${CUSTOM_AVATAR_KEY}${username.toLowerCase()}`, avatarId);
    window.dispatchEvent(
      new CustomEvent(AVATAR_EVENT, {
        detail: { username: username.toLowerCase(), avatarId },
      })
    );
  } catch {
    // Ignore
  }
}

export function randomizeUserAvatar(username: string): AvatarSpec {
  const current = getUserAvatar(username);
  const others = AVATAR_SPECS.filter((a) => a.id !== current.id);
  const randomSpec = others[Math.floor(Math.random() * others.length)];
  setUserAvatar(username, randomSpec.id);
  return randomSpec;
}

// Reactive Hook to get & subscribe to user avatar changes in real-time
export function useUserAvatar(username?: string): [AvatarSpec, (avatarId: string) => void] {
  const [avatar, setAvatar] = useState<AvatarSpec>(() => getUserAvatar(username));

  useEffect(() => {
    setAvatar(getUserAvatar(username));

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ username: string; avatarId: string }>;
      if (!username || customEvent.detail.username === username.toLowerCase()) {
        const updated = getAvatarSpec(customEvent.detail.avatarId);
        setAvatar(updated);
      }
    };

    window.addEventListener(AVATAR_EVENT, handleEvent);
    return () => window.removeEventListener(AVATAR_EVENT, handleEvent);
  }, [username]);

  const updateAvatar = (avatarId: string) => {
    if (username) {
      setUserAvatar(username, avatarId);
    }
    setAvatar(getAvatarSpec(avatarId));
  };

  return [avatar, updateAvatar];
}
