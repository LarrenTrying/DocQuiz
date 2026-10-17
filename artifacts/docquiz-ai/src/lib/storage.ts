import type { ExtractedDocument, Quiz, QuizQuestion } from '@workspace/api-client-react';

const DOCUMENT_KEY = 'docquiz-ai.document';
const QUIZ_KEY = 'docquiz-ai.quiz';

export function readDocument(): ExtractedDocument | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(DOCUMENT_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as ExtractedDocument;
  } catch {
    return null;
  }
}

export function writeDocument(document: ExtractedDocument): void {
  window.localStorage.setItem(DOCUMENT_KEY, JSON.stringify(document));
}

export function readQuiz(): Quiz | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(QUIZ_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as Quiz;
  } catch {
    return null;
  }
}

export function writeQuiz(quiz: Quiz): void {
  window.localStorage.setItem(QUIZ_KEY, JSON.stringify(quiz));
}

export function clearQuiz(): void {
  window.localStorage.removeItem(QUIZ_KEY);
}

export type QuizDifficulty = 'blitz' | 'challenge' | 'relaxed' | 'untimed';

const DIFFICULTY_KEY = 'docquiz-ai.difficulty';

export function readDifficulty(): QuizDifficulty {
  if (typeof window === 'undefined') return 'challenge';
  const val = window.localStorage.getItem(DIFFICULTY_KEY);
  if (val === 'blitz' || val === 'challenge' || val === 'relaxed' || val === 'untimed') {
    return val;
  }
  return 'challenge';
}

export function writeDifficulty(difficulty: QuizDifficulty): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DIFFICULTY_KEY, difficulty);
  }
}

export function getTimeForDifficulty(difficulty: QuizDifficulty): number | null {
  switch (difficulty) {
    case 'blitz': return 15;
    case 'challenge': return 30;
    case 'relaxed': return 60;
    case 'untimed': return null;
    default: return 30;
  }
}

// Accessibility & Inclusivity Preferences
export interface AccessibilitySettings {
  ttsEnabled: boolean;
  dyslexiaFont: boolean;
  soundEnabled: boolean;
  adaptiveMode: boolean;
}

const ACCESSIBILITY_KEY = 'docquiz-ai.accessibility';

export function readAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === 'undefined') {
    return { ttsEnabled: false, dyslexiaFont: false, soundEnabled: true, adaptiveMode: true };
  }
  const val = window.localStorage.getItem(ACCESSIBILITY_KEY);
  if (!val) {
    return { ttsEnabled: false, dyslexiaFont: false, soundEnabled: true, adaptiveMode: true };
  }
  try {
    return JSON.parse(val) as AccessibilitySettings;
  } catch {
    return { ttsEnabled: false, dyslexiaFont: false, soundEnabled: true, adaptiveMode: true };
  }
}

export function writeAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('docquiz-accessibility-updated', { detail: settings }));
  }
}

// Client-Side Offline / Low-Bandwidth Quiz Generator
export function generateOfflineQuiz(documentText: string, fileName?: string, requestedCount = 5): Quiz {
  const clean = documentText.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
  const rawSentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 220);

  const usable = rawSentences.length ? rawSentences : [
    'Active recall is the practice of stimulating memory during the learning process.',
    'Retrieval practice enhances long-term retention of educational material.',
    'Spaced repetition helps cement facts by reviewing them at systematic intervals.',
    'Formative testing identifies weak recall pathways before final examinations.',
    'Elaborative interrogation asks why a fact or concept is logically true.',
  ];

  const questions: QuizQuestion[] = [];
  const count = Math.min(requestedCount, usable.length);

  for (let i = 0; i < count; i++) {
    const targetSentence = usable[i % usable.length];
    const words = targetSentence.split(' ').filter((w) => w.length > 3 && !/^[A-Z]/.test(w));
    const focusWord = words[Math.floor(words.length / 2)] || 'key concept';

    const cleanFocus = focusWord.replace(/[^a-zA-Z0-9]/g, '');
    const questionText = targetSentence.replace(
      new RegExp(`\\b${cleanFocus}\\b`, 'i'),
      '__________',
    );

    const distractors = [
      `Alternative interpretation of ${cleanFocus}`,
      `Secondary factor in study review`,
      `Opposing condition in test material`,
    ];

    const options = [cleanFocus, ...distractors];
    // Shuffle options
    const shuffled = options
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((d) => d.value);

    const correctIndex = shuffled.indexOf(cleanFocus);

    questions.push({
      id: `offline-q-${i + 1}-${Date.now()}`,
      question: `Fill in the blank: "${questionText}"`,
      options: shuffled,
      correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: `From your notes: "${targetSentence}"`,
    });
  }

  return {
    title: fileName ? `Offline Study: ${fileName}` : 'Offline Active Recall Set',
    sourceFileName: fileName || 'Saved Notes',
    questions,
    generatedWith: 'offline-engine',
    isDemo: false,
  };
}