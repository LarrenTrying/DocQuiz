import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface HistoryQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  selectedAnswerIndex: number | null;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizHistoryRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  sourceFileName?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  totalTimeSeconds?: number;
  difficulty?: string;
  completedAt: string;
  questions: HistoryQuestion[];
}

const LOCAL_HISTORY_KEY = 'docquiz-ai.quiz_history.v1';

function getLocalHistory(userId?: string): QuizHistoryRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as QuizHistoryRecord[];
    if (userId) {
      return list.filter((r) => r.userId === userId);
    }
    return list;
  } catch {
    return [];
  }
}

function saveLocalHistory(records: QuizHistoryRecord[]): void {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save quiz history to localStorage:', err);
  }
}

export const quizHistoryService = {
  /**
   * Saves completed quiz session to Google Cloud Firestore (and localStorage cache)
   */
  async saveRecord(record: Omit<QuizHistoryRecord, 'id'>): Promise<string> {
    let savedId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 1. Save to Google Cloud Firestore if connected
    if (db) {
      try {
        const colRef = collection(db, 'quiz_history');
        const docRef = await addDoc(colRef, {
          ...record,
          createdAt: serverTimestamp(),
        });
        savedId = docRef.id;
      } catch (err) {
        console.warn('Could not save to Firestore directly, falling back to local storage cache:', err);
      }
    }

    // 2. Cache locally for instant UI updates & offline continuity
    const fullRecord: QuizHistoryRecord = {
      ...record,
      id: savedId,
    };

    const current = getLocalHistory();
    // Prepend newest first
    current.unshift(fullRecord);
    saveLocalHistory(current);

    return savedId;
  },

  /**
   * Fetches past quizzes for a given user from Firestore (or fallback cache)
   */
  async getUserHistory(userId: string): Promise<QuizHistoryRecord[]> {
    if (!userId) return [];

    // Try Google Cloud Firestore
    if (db) {
      try {
        const colRef = collection(db, 'quiz_history');
        // Simple query by userId (doesn't require composite index)
        const q = query(colRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const list: QuizHistoryRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            list.push({
              id: d.id,
              userId: data.userId,
              userEmail: data.userEmail,
              userName: data.userName,
              title: data.title || 'Untitled Quiz',
              sourceFileName: data.sourceFileName,
              score: data.score ?? 0,
              totalQuestions: data.totalQuestions ?? 0,
              percentage: data.percentage ?? 0,
              totalTimeSeconds: data.totalTimeSeconds,
              difficulty: data.difficulty,
              completedAt: data.completedAt || new Date().toISOString(),
              questions: data.questions || [],
            });
          });

          // Sort in-memory by completedAt desc
          list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

          // Sync into local cache
          saveLocalHistory(list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore getHistory warning, falling back to local cache:', err);
      }
    }

    // Fallback to local storage
    return getLocalHistory(userId);
  },

  /**
   * Deletes a quiz record
   */
  async deleteRecord(recordId: string, userId: string): Promise<void> {
    if (db && !recordId.startsWith('local_')) {
      try {
        await deleteDoc(doc(db, 'quiz_history', recordId));
      } catch (err) {
        console.warn('Failed to delete from Firestore:', err);
      }
    }

    // Remove from local cache
    const current = getLocalHistory();
    const updated = current.filter((r) => r.id !== recordId);
    saveLocalHistory(updated);
  },
};
