import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  Flame,
  Loader2,
  LogOut,
  RotateCcw,
  Sparkles,
  Timer,
  X,
  Zap,
  Trophy,
  Award,
  BookOpen,
  WifiOff,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useGenerateQuiz } from '@workspace/api-client-react';
import type { Quiz, QuizQuestion } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { QuizToolbar } from '@/components/quiz-toolbar';
import { BadgesModal } from '@/components/badges-modal';
import { DiscordIcon } from '@/components/discord-settings-modal';
import { ChallengeCreateModal } from '@/components/challenge-create-modal';
import { useAuth } from '@/lib/auth-context';
import { quizHistoryService, type HistoryQuestion } from '@/lib/quiz-history-service';
import {
  generateKeyTakeaway,
  recordQuizCompletion,
  loadGamificationState,
  calculateLevel,
  type Badge,
} from '@/lib/gamification';
import {
  getTimeForDifficulty,
  readDifficulty,
  readDocument,
  readQuiz,
  writeDifficulty,
  writeQuiz,
  readAccessibilitySettings,
  generateOfflineQuiz,
  type QuizDifficulty,
  type AccessibilitySettings,
} from '@/lib/storage';

function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function scoreLabel(score: number, total: number): string {
  const ratio = total ? score / total : 0;
  if (ratio === 1) return 'Perfect recall 🏆';
  if (ratio >= 0.75) return 'Strong foundation 🔥';
  if (ratio >= 0.5) return 'Good start 👍';
  return 'Worth another pass 📚';
}

function paceAssessment(avgSeconds: number, difficulty: QuizDifficulty): string {
  if (difficulty === 'untimed') return 'Untimed Practice 🧘';
  if (avgSeconds <= 12) return 'Lightning Fast ⚡';
  if (avgSeconds <= 25) return 'Sharp & Focused 🎯';
  return 'Deep & Methodical 🧠';
}

function EmptyQuiz() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100dvh-68px)] max-w-xl items-center justify-center px-5 py-12 md:min-h-[100dvh]">
        <div className="w-full rounded-[24px] border border-border bg-card p-8 text-center paper-shadow sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent)/.5)] text-secondary">
            <Sparkles size={25} />
          </div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Your quiz is waiting</p>
          <h1 className="font-display mt-3 text-4xl italic tracking-[-.03em]">Start with a set of notes.</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Upload a PDF, Word document, or TXT file on your study desk and your tutor will build a quiz here.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            data-testid="link-upload-notes"
          >
            <ArrowLeft size={16} /> Upload notes
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Results({
  quiz,
  answers,
  totalTimeSpent,
  difficulty,
  maxStreak,
  onRestart,
  onGenerateNew,
  isGeneratingNew,
  questionCount,
  setQuestionCount,
  onSelectDifficulty,
}: {
  quiz: Quiz;
  answers: (number | null)[];
  totalTimeSpent: number;
  difficulty: QuizDifficulty;
  maxStreak: number;
  onRestart: () => void;
  onGenerateNew: (difficultyOverride?: QuizDifficulty) => void;
  isGeneratingNew: boolean;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  onSelectDifficulty: (diff: QuizDifficulty) => void;
}) {
  const { token, user } = useAuth();
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [sharedToDiscord, setSharedToDiscord] = useState(false);
  const [sharingDiscord, setSharingDiscord] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const historySavedRef = useRef(false);

  const answeredCount = answers.filter((a) => a !== null).length;
  const score = quiz.questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctAnswerIndex ? 1 : 0),
    0,
  );
  const percentage = quiz.questions.length ? Math.round((score / quiz.questions.length) * 100) : 0;

  // Auto-save to Google Cloud Firestore Quiz History
  useEffect(() => {
    if (historySavedRef.current || !quiz.questions.length) return;
    historySavedRef.current = true;

    const formattedQuestions: HistoryQuestion[] = quiz.questions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      selectedAnswerIndex: answers[idx] ?? null,
      isCorrect: answers[idx] === q.correctAnswerIndex,
      explanation: q.explanation,
    }));

    quizHistoryService
      .saveRecord({
        userId: user?.id || 'guest_user',
        userEmail: user?.username || 'anonymous',
        userName: user?.name || user?.username || 'Student',
        title: quiz.title,
        sourceFileName: quiz.sourceFileName,
        score,
        totalQuestions: quiz.questions.length,
        percentage,
        totalTimeSeconds: totalTimeSpent,
        difficulty,
        completedAt: new Date().toISOString(),
        questions: formattedQuestions,
      })
      .then(() => setHistorySaved(true))
      .catch((err) => {
        console.warn('Failed to auto-save quiz history:', err);
      });
  }, [quiz, answers, score, totalTimeSpent, difficulty, user]);

  const avgTimePerQuestion = answeredCount ? Math.round((totalTimeSpent / answeredCount) * 10) / 10 : 0;

  // Gamification completion registration
  const completionSummary = useMemo(() => {
    return recordQuizCompletion({
      score,
      total: quiz.questions.length,
      totalTimeSeconds: totalTimeSpent,
      maxStreak,
      isUntimed: difficulty === 'untimed',
    });
  }, [score, quiz.questions.length, totalTimeSpent, maxStreak, difficulty]);

  const { level, currentXp, nextLevelXp, progress } = calculateLevel(completionSummary.state.xp);
  const missedQuestions = quiz.questions.filter((_, idx) => answers[idx] !== quiz.questions[idx].correctAnswerIndex);

  const handleShareToDiscord = async () => {
    setSharingDiscord(true);
    try {
      const res = await fetch('/api/discord/share-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: 'Quiz Mastery',
          topic: quiz.title,
          score,
          total: quiz.questions.length,
          percentage,
          streak: completionSummary.state.dailyStreak,
          level,
          badgeTitle: completionSummary.newBadges[0]?.title,
          badgeIcon: completionSummary.newBadges[0]?.icon,
        }),
      });
      if (res.ok) {
        setSharedToDiscord(true);
        setTimeout(() => setSharedToDiscord(false), 4000);
      }
    } catch (err) {
      console.error('Failed to share to Discord', err);
    } finally {
      setSharingDiscord(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 md:px-8 md:pt-10">
        {/* Top Header */}
        <div className="fade-up mb-8 flex items-start justify-between gap-5">
          <div>
            <p className="font-mono-ui mb-3 text-[10px] uppercase tracking-[.2em] text-primary">Session complete / 03</p>
            <h1 className="text-4xl tracking-[-.04em] sm:text-5xl">You made it stick.</h1>
            <p className="mt-3 text-sm text-muted-foreground">{quiz.title}</p>
            {historySaved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-ui text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                <Check size={13} className="stroke-[3]" /> Saved to Google Cloud Vault
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 shadow-sm"
              data-testid="link-view-history"
            >
              <Clock size={13} /> Review Vault
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground sm:flex"
              data-testid="link-new-notes"
            >
              <ArrowLeft size={14} /> New notes
            </Link>
          </div>
        </div>

        {/* Gamification & XP Banner */}
        <div className="fade-up mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/15 to-primary/5 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>+{completionSummary.xpEarned} XP Earned!</span>
                  {completionSummary.newLevel > completionSummary.prevLevel && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono-ui text-amber-600 dark:text-amber-400">
                      LEVEL UP!
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mastery Level {level} · {completionSummary.state.dailyStreak} Day Active Streak
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareToDiscord}
                disabled={sharingDiscord}
                className="flex items-center gap-1.5 rounded-xl border border-[#5865F2]/40 bg-[#5865F2]/10 px-3.5 py-2 text-xs font-bold text-[#5865F2] hover:bg-[#5865F2]/20 shadow-xs transition-transform hover:-translate-y-0.5"
                title="Share this score to connected Discord server"
              >
                <DiscordIcon className="h-3.5 w-3.5" />
                <span>{sharedToDiscord ? 'Shared to Discord!' : 'Share to Discord'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBadgesModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-card px-3.5 py-2 text-xs font-bold text-primary shadow-xs transition-transform hover:-translate-y-0.5"
              >
                <Award size={14} /> Badges ({completionSummary.state.unlockedBadgeIds.length})
              </button>
            </div>
          </div>

          {/* New Badges Showcase Toast */}
          {completionSummary.newBadges.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-xs text-foreground flex items-center gap-3 animate-in fade-in duration-300">
              <span className="text-2xl">{completionSummary.newBadges[0].icon}</span>
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-300">
                  New Badge Unlocked: {completionSummary.newBadges[0].title}!
                </p>
                <p className="text-muted-foreground text-[11px]">{completionSummary.newBadges[0].description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
          <section className="fade-up fade-up-delay-1 flex flex-col rounded-[22px] bg-secondary p-7 text-secondary-foreground paper-shadow sm:p-9">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-secondary-foreground/55">Your score</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="font-display text-8xl leading-none text-[hsl(var(--accent))]">{score}</span>
              <span className="mb-2 text-sm text-secondary-foreground/55">/ {quiz.questions.length}</span>
            </div>
            <p className="mt-4 text-lg font-bold">{scoreLabel(score, quiz.questions.length)}</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary-foreground/15">
              <div
                className="h-full rounded-full bg-[hsl(var(--accent))] transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-right font-mono-ui text-[10px] uppercase tracking-wider text-secondary-foreground/55">
              {percentage}% correct {answeredCount < quiz.questions.length && `(${answeredCount}/${quiz.questions.length} answered)`}
            </p>

            {/* Performance Stats Cards */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 rounded-2xl bg-secondary-foreground/10 p-3.5 text-center">
              <div>
                <p className="font-mono-ui text-[9px] uppercase tracking-wider text-secondary-foreground/60">Total Time</p>
                <p className="mt-1 text-sm font-bold">{formatDuration(totalTimeSpent)}</p>
              </div>
              <div>
                <p className="font-mono-ui text-[9px] uppercase tracking-wider text-secondary-foreground/60">Pace</p>
                <p className="mt-1 text-sm font-bold">{paceAssessment(avgTimePerQuestion, difficulty)}</p>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <div className="rounded-xl bg-secondary-foreground/10 p-3">
                <label className="text-[11px] font-semibold text-secondary-foreground/80 block mb-1.5">
                  Next quiz length:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 7, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                        questionCount === count
                          ? 'bg-[hsl(var(--accent))] text-accent-foreground font-black shadow-sm'
                          : 'bg-secondary-foreground/15 text-secondary-foreground/80 hover:bg-secondary-foreground/25'
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-secondary-foreground/10 p-3">
                <label className="text-[11px] font-semibold text-secondary-foreground/80 block mb-1.5">
                  Timer level:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  {[
                    { id: 'blitz' as const, label: '⚡ 15s' },
                    { id: 'challenge' as const, label: '🔥 30s' },
                    { id: 'relaxed' as const, label: '💡 60s' },
                    { id: 'untimed' as const, label: '🧘 Off' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onSelectDifficulty(lvl.id)}
                      className={`rounded-lg py-1.5 font-bold transition-all ${
                        difficulty === lvl.id
                          ? 'bg-[hsl(var(--accent))] text-accent-foreground font-black shadow-sm'
                          : 'bg-secondary-foreground/15 text-secondary-foreground/80 hover:bg-secondary-foreground/25'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onGenerateNew()}
                disabled={isGeneratingNew}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                data-testid="button-new-questions"
              >
                <Sparkles size={16} /> {isGeneratingNew ? 'Building new questions…' : `Get New Questions (${questionCount} Qs)`}
              </button>

              <button
                type="button"
                onClick={() => setShowChallengeModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <Flame size={14} className="fill-amber-500" /> Challenge Friends with this Quiz
              </button>

              <button
                onClick={onRestart}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary-foreground/20 px-4 py-2.5 text-xs font-bold text-secondary-foreground/80 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                data-testid="button-restart-quiz"
              >
                <RotateCcw size={14} /> Retake this exact quiz
              </button>
            </div>
          </section>

          <section className="fade-up fade-up-delay-2 flex flex-col rounded-[22px] border border-border bg-card p-6 paper-shadow sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Answer key</p>
                <h2 className="mt-1 text-lg font-bold">A quick review</h2>
              </div>
              <span className="rounded-full bg-muted px-3 py-1.5 font-mono-ui text-[10px] text-muted-foreground">
                {score} right
              </span>
            </div>

            {/* Tailored Study Guidance */}
            {missedQuestions.length > 0 && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles size={13} /> Tailored Focus Tip:
                </p>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  Review the {missedQuestions.length} missed question{missedQuestions.length > 1 ? 's' : ''} below. Retaking this exact quiz right now will lock the correct answers into long-term recall.
                </p>
              </div>
            )}

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {quiz.questions.map((question, index) => {
                const ans = answers[index];
                const correct = ans === question.correctAnswerIndex;
                const timedOut = ans === -1;
                const unanswered = ans === null;
                const takeaway = generateKeyTakeaway(
                  question.question,
                  question.options[question.correctAnswerIndex],
                  question.explanation,
                );

                return (
                  <div
                    className={`rounded-xl border p-4 ${
                      correct
                        ? 'border-[hsl(165_38%_42%/.26)] bg-[hsl(165_38%_42%/.06)]'
                        : 'border-primary/20 bg-primary/5'
                    }`}
                    key={question.id}
                    data-testid={`review-question-${question.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          correct ? 'bg-[hsl(165_38%_42%)] text-card' : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {correct ? <Check size={12} /> : <X size={12} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5">
                          {index + 1}. {question.question}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {correct
                            ? `Correct: ${question.options[question.correctAnswerIndex]}`
                            : timedOut
                            ? `Timed out. Answer: ${question.options[question.correctAnswerIndex]}`
                            : unanswered
                            ? `Skipped. Answer: ${question.options[question.correctAnswerIndex]}`
                            : `Answer: ${question.options[question.correctAnswerIndex]}`}
                        </p>
                        {/* 1-Line Exam Key Takeaway */}
                        <div className="mt-2 rounded-lg bg-card/80 border border-border/60 px-2.5 py-1.5 text-[11px] text-foreground">
                          <span className="font-bold text-primary">💡 Exam Takeaway:</span> {takeaway}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <Link
          href="/"
          className="mt-7 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground sm:hidden"
          data-testid="link-mobile-new-notes"
        >
          <ArrowLeft size={14} /> Start with new notes
        </Link>
      </div>

      {/* Badges & Mastery Modal */}
      <BadgesModal open={showBadgesModal} onOpenChange={setShowBadgesModal} />

      {/* Peer Challenge Creator Modal */}
      <ChallengeCreateModal
        open={showChallengeModal}
        onOpenChange={setShowChallengeModal}
        defaultTopic={quiz.title}
      />
    </AppShell>
  );
}


function QuestionCard({
  question,
  questionNumber,
  total,
  selected,
  timeLeft,
  totalTimeAllocated,
  difficulty,
  streak,
  adaptiveLevel,
  onSelect,
  onNext,
  onExitClick,
}: {
  question: QuizQuestion;
  questionNumber: number;
  total: number;
  selected: number | null;
  timeLeft: number | null;
  totalTimeAllocated: number | null;
  difficulty: QuizDifficulty;
  streak: number;
  adaptiveLevel: 'sharp' | 'standard' | 'scaffold';
  onSelect: (index: number) => void;
  onNext: () => void;
  onExitClick: () => void;
}) {
  const [settings, setSettings] = useState<AccessibilitySettings>(readAccessibilitySettings());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('docquiz-accessibility-updated', handleUpdate);
    return () => window.removeEventListener('docquiz-accessibility-updated', handleUpdate);
  }, []);

  const hasAnswered = selected !== null;
  const isTimedOut = selected === -1;
  const isCorrect = selected === question.correctAnswerIndex;

  const timerRatio =
    timeLeft !== null && totalTimeAllocated && totalTimeAllocated > 0
      ? Math.max(0, Math.min(1, timeLeft / totalTimeAllocated))
      : 1;

  const isTimeCritical = timeLeft !== null && timeLeft <= 5 && !hasAnswered;
  const takeaway = generateKeyTakeaway(
    question.question,
    question.options[question.correctAnswerIndex],
    question.explanation,
  );

  return (
    <div className={`fade-up mx-auto w-full max-w-5xl ${settings.dyslexiaFont ? 'font-sans tracking-wide' : ''}`}>
      {/* Quiz Accessibility & Adaptive Toolbar */}
      <QuizToolbar
        question={question}
        questionNumber={questionNumber}
        streak={streak}
        adaptiveLevel={adaptiveLevel}
      />

      {/* Top Meta Bar with Question Progress, Timer and Exit Action */}
      <div className="mb-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.19em] text-muted-foreground">
            Question {String(questionNumber).padStart(2, '0')} <span className="mx-1 text-border">/</span>{' '}
            {String(total).padStart(2, '0')}
          </p>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:w-36">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(questionNumber / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Live Question Timer Badge */}
        {difficulty !== 'untimed' && timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              hasAnswered
                ? 'bg-muted text-muted-foreground'
                : isTimeCritical
                ? 'bg-destructive/15 text-destructive animate-pulse ring-2 ring-destructive/40'
                : timeLeft <= 10
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                : 'bg-primary/10 text-primary ring-1 ring-primary/20'
            }`}
            title={`Time allocated: ${totalTimeAllocated}s`}
          >
            <Timer size={14} className={isTimeCritical ? 'animate-spin' : ''} />
            <span className="font-mono">{hasAnswered ? 'Paused' : `${timeLeft}s`}</span>
          </div>
        )}

        {/* Exit Button right next to progress */}
        <button
          type="button"
          onClick={onExitClick}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          title="Exit current quiz"
          data-testid="button-exit-quiz"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>

      {/* Timer Bar right above Question */}
      {difficulty !== 'untimed' && timeLeft !== null && !hasAnswered && (
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isTimeCritical ? 'bg-destructive' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${timerRatio * 100}%` }}
          />
        </div>
      )}

      <h1
        className={`max-w-4xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.12] tracking-[-.035em] ${
          settings.dyslexiaFont ? 'leading-relaxed' : ''
        }`}
        data-testid={`text-question-${question.id}`}
      >
        {question.question}
      </h1>

      <div className="mt-8 grid gap-3" role="radiogroup" aria-label="Answer choices">
        {question.options.map((option, index) => {
          const chosen = selected === index;
          const right = hasAnswered && index === question.correctAnswerIndex;
          const wrong = hasAnswered && chosen && !right;

          return (
            <button
              key={option}
              onClick={() => onSelect(index)}
              disabled={hasAnswered}
              className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all sm:px-5 ${
                right
                  ? 'border-[hsl(165_38%_42%/.55)] bg-[hsl(165_38%_42%/.09)]'
                  : wrong
                  ? 'border-primary/55 bg-primary/7'
                  : chosen
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm'
              } disabled:cursor-default ${settings.dyslexiaFont ? 'text-base' : ''}`}
              data-testid={`button-answer-${question.id}-${index}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono-ui text-xs font-medium ${
                  right
                    ? 'bg-[hsl(165_38%_42%)] text-card'
                    : wrong
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-[hsl(var(--accent))] group-hover:text-accent-foreground'
                }`}
              >
                {right ? <Check size={16} /> : wrong ? <X size={16} /> : letter(index)}
              </span>
              <span className="text-sm font-semibold leading-5">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Personalized AI Feedback & Key Takeaway Box */}
      {hasAnswered && (
        <div
          className={`mt-5 rounded-2xl border p-5 animate-in fade-in duration-200 ${
            isCorrect
              ? 'border-[hsl(165_38%_42%/.25)] bg-[hsl(165_38%_42%/.07)]'
              : isTimedOut
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-primary/20 bg-primary/5'
          }`}
          data-testid="panel-feedback"
        >
          <div className="flex gap-3">
            <span
              className={`mt-0.5 ${
                isCorrect ? 'text-[hsl(165_38%_42%)]' : isTimedOut ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
              }`}
            >
              {isCorrect ? <Check size={18} /> : isTimedOut ? <Clock size={18} /> : <CircleAlert size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {isCorrect
                  ? 'That is right!'
                  : isTimedOut
                  ? `Time's up! The correct answer is ${letter(question.correctAnswerIndex)}.`
                  : `Not quite. The correct answer is ${letter(question.correctAnswerIndex)}.`}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{question.explanation}</p>

              {/* Instant 1-Line Exam Key Takeaway */}
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-card/80 border border-border/80 p-2.5 text-xs text-foreground">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <span className="font-bold text-primary">💡 Exam Takeaway:</span> {takeaway}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-7 flex justify-end">
        <button
          onClick={onNext}
          disabled={!hasAnswered}
          className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
          data-testid="button-next-question"
        >
          {questionNumber === total ? 'See results' : 'Next question'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [, setLocation] = useLocation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [complete, setComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('challenge');
  const [showExitModal, setShowExitModal] = useState(false);

  // Dynamic streak & adaptive difficulty state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [adaptiveLevel, setAdaptiveLevel] = useState<'sharp' | 'standard' | 'scaffold'>('standard');

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number | null>(30);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const generateQuiz = useGenerateQuiz();

  // Load saved quiz & difficulty on mount
  useEffect(() => {
    const savedQuiz = readQuiz();
    const savedDiff = readDifficulty();
    setDifficulty(savedDiff);
    setQuiz(savedQuiz);
    if (savedQuiz) {
      setAnswers(Array(savedQuiz.questions.length).fill(null));
      setQuestionCount(savedQuiz.questions.length);
      const allocated = getTimeForDifficulty(savedDiff);
      setTimeLeft(allocated);
    }
  }, []);

  const currentQuestion = useMemo(() => quiz?.questions[currentIndex], [quiz, currentIndex]);
  const selected = answers[currentIndex] ?? null;
  const hasAnswered = selected !== null;

  // Adaptive difficulty time calculation
  const totalTimeAllocated = useMemo(() => {
    const base = getTimeForDifficulty(difficulty);
    if (base === null) return null;
    // Adaptive modifier: if in sharp mode, pace is tightened slightly; if in scaffold, relaxed
    if (adaptiveLevel === 'sharp') return Math.max(10, Math.round(base * 0.8));
    if (adaptiveLevel === 'scaffold') return Math.round(base * 1.25);
    return base;
  }, [difficulty, adaptiveLevel]);

  // When question index or difficulty changes, reset question timer
  useEffect(() => {
    if (difficulty === 'untimed') {
      setTimeLeft(null);
    } else {
      setTimeLeft(totalTimeAllocated);
    }
  }, [currentIndex, difficulty, totalTimeAllocated]);

  // Active question timer countdown interval
  useEffect(() => {
    if (difficulty === 'untimed' || complete || hasAnswered || showExitModal || timeLeft === null) {
      return;
    }

    const timer = setInterval(() => {
      setTotalTimeSpent((prev) => prev + 1);
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Time expired! Automatically record timeout as -1
          setAnswers((current) =>
            current.map((ans, idx) => (idx === currentIndex ? (ans !== null ? ans : -1) : ans)),
          );
          // Update streak on timeout
          setCurrentStreak(0);
          setAdaptiveLevel('scaffold');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [difficulty, complete, hasAnswered, showExitModal, timeLeft, currentIndex]);

  const handleSelectDifficulty = (newDiff: QuizDifficulty) => {
    setDifficulty(newDiff);
    writeDifficulty(newDiff);
    if (newDiff === 'untimed') {
      setTimeLeft(null);
    } else {
      setTimeLeft(getTimeForDifficulty(newDiff));
    }
  };

  const handleGenerateNew = (diffOverride?: QuizDifficulty) => {
    const doc = readDocument();
    if (!doc || doc.text.trim().length < 80) return;
    const targetDiff = diffOverride ?? difficulty;

    // Check if offline or API is unreachable
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineQuiz = generateOfflineQuiz(doc.text, doc.fileName, questionCount);
      writeQuiz(offlineQuiz);
      setQuiz(offlineQuiz);
      setCurrentIndex(0);
      setAnswers(Array(offlineQuiz.questions.length).fill(null));
      setComplete(false);
      setTotalTimeSpent(0);
      setShowExitModal(false);
      setCurrentStreak(0);
      setMaxStreak(0);
      setAdaptiveLevel('standard');
      if (targetDiff !== 'untimed') {
        setTimeLeft(getTimeForDifficulty(targetDiff));
      }
      return;
    }

    generateQuiz.mutate(
      {
        data: { text: doc.text, fileName: doc.fileName, questionCount },
      },
      {
        onSuccess: (newQuiz) => {
          writeQuiz(newQuiz);
          setQuiz(newQuiz);
          setCurrentIndex(0);
          setAnswers(Array(newQuiz.questions.length).fill(null));
          setComplete(false);
          setTotalTimeSpent(0);
          setShowExitModal(false);
          setCurrentStreak(0);
          setMaxStreak(0);
          setAdaptiveLevel('standard');
          if (targetDiff !== 'untimed') {
            setTimeLeft(getTimeForDifficulty(targetDiff));
          }
        },
        onError: () => {
          // Fallback to client-side offline generator on error
          const offlineQuiz = generateOfflineQuiz(doc.text, doc.fileName, questionCount);
          writeQuiz(offlineQuiz);
          setQuiz(offlineQuiz);
          setCurrentIndex(0);
          setAnswers(Array(offlineQuiz.questions.length).fill(null));
          setComplete(false);
          setTotalTimeSpent(0);
          setShowExitModal(false);
        },
      },
    );
  };

  if (!quiz || !currentQuestion) return <EmptyQuiz />;

  const selectAnswer = (index: number) => {
    if (selected !== null) return;
    const isRight = index === currentQuestion.correctAnswerIndex;

    setAnswers((current) =>
      current.map((answer, answerIndex) => (answerIndex === currentIndex ? index : answer)),
    );

    // Adaptive difficulty & streak tracking
    if (isRight) {
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));
      if (nextStreak >= 2) {
        setAdaptiveLevel('sharp');
      }
    } else {
      setCurrentStreak(0);
      setAdaptiveLevel('scaffold');
    }
  };

  const next = () => {
    if (currentIndex === quiz.questions.length - 1) {
      setComplete(true);
    } else {
      setCurrentIndex((current) => current + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setAnswers(Array(quiz.questions.length).fill(null));
    setComplete(false);
    setTotalTimeSpent(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setAdaptiveLevel('standard');
    setTimeLeft(getTimeForDifficulty(difficulty));
  };

  if (complete) {
    return (
      <Results
        quiz={quiz}
        answers={answers}
        totalTimeSpent={totalTimeSpent}
        difficulty={difficulty}
        maxStreak={maxStreak}
        onRestart={restart}
        onGenerateNew={handleGenerateNew}
        isGeneratingNew={generateQuiz.isPending}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        onSelectDifficulty={handleSelectDifficulty}
      />
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-8 md:px-10 md:pt-10">
        {/* Top Header with title and controls */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="font-mono-ui mb-1.5 text-[10px] uppercase tracking-[.2em] text-primary flex items-center gap-2">
              <span>Recall session / 02</span>
              {quiz.generatedWith === 'offline-engine' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                  <WifiOff size={10} /> Offline Mode
                </span>
              )}
            </p>
            <p className="truncate text-sm font-bold" data-testid="text-quiz-title">
              {quiz.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" data-testid="text-quiz-source">
              {quiz.sourceFileName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty Mode Selector */}
            <div className="flex items-center rounded-xl border border-border bg-card p-1 text-xs">
              {[
                { id: 'blitz' as const, label: '⚡ Blitz' },
                { id: 'challenge' as const, label: '🔥 30s' },
                { id: 'relaxed' as const, label: '💡 60s' },
                { id: 'untimed' as const, label: '🧘 Untimed' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleSelectDifficulty(lvl.id)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                    difficulty === lvl.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleGenerateNew()}
              disabled={generateQuiz.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
              data-testid="button-header-new-quiz"
            >
              {generateQuiz.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span className="hidden sm:inline">New Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              data-testid="link-quiz-exit"
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          total={quiz.questions.length}
          selected={selected}
          timeLeft={timeLeft}
          totalTimeAllocated={totalTimeAllocated}
          difficulty={difficulty}
          streak={currentStreak}
          adaptiveLevel={adaptiveLevel}
          onSelect={selectAnswer}
          onNext={next}
          onExitClick={() => setShowExitModal(true)}
        />
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl paper-shadow sm:p-7">
            <button
              type="button"
              onClick={() => setShowExitModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <LogOut size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold">Exit Quiz Session?</h3>
                <p className="text-xs text-muted-foreground">
                  You are on Question {currentIndex + 1} of {quiz.questions.length}.
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              You can finish your quiz now to see your results and review answers, or return to your study desk.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  setComplete(true);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <Check size={15} /> Finish & View Current Score
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  setLocation('/');
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut size={14} /> Exit to Study Desk
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Resume Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}