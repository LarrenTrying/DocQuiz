import { useState, useEffect, useMemo, useRef } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CircleAlert,
  Clock,
  Copy,
  Flame,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Share2,
  Sparkles,
  Timer,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { DiscordIcon } from '@/components/discord-settings-modal';
import { useAuth } from '@/lib/auth-context';
import { generateKeyTakeaway } from '@/lib/gamification';

interface ChallengeData {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  timeLimitSeconds: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }>;
  sourceFileName?: string;
  createdAt: string;
}

interface ParticipantData {
  id: string;
  challengeId: string;
  username: string;
  discordUsername?: string;
  avatarUrl?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionTimeSeconds: number;
  completedAt: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ChallengePage() {
  const [, params] = useRoute('/challenge/:id');
  const [, setLocation] = useLocation();
  const challengeId = params?.id;
  const { user, token } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Challenge execution state: 'lobby' | 'playing' | 'results'
  const [stage, setStage] = useState<'lobby' | 'playing' | 'results'>('lobby');
  const [participantName, setParticipantName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [discordShared, setDiscordShared] = useState(false);

  useEffect(() => {
    if (user?.name || user?.username) {
      setParticipantName(user.name || user.username);
    }
  }, [user]);

  useEffect(() => {
    if (!challengeId) return;
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discord/challenge/${challengeId}`);
      if (res.ok) {
        const data = await res.json();
        setChallenge(data.challenge);
        setLeaderboard(data.leaderboard || []);
        setTimeLeft(data.challenge.timeLimitSeconds || 120);
        setAnswers(Array(data.challenge.questions.length).fill(null));
      } else {
        setError('Challenge not found or has expired.');
      }
    } catch (err) {
      setError('Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown while playing
  useEffect(() => {
    if (stage !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTotalTimeSpent((prev) => prev + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  const handleStartChallenge = () => {
    setStage('playing');
    setCurrentIndex(0);
    setAnswers(Array(challenge?.questions.length || 5).fill(null));
    setTimeLeft(challenge?.timeLimitSeconds || 120);
    setTotalTimeSpent(0);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return;
    setAnswers((prev) =>
      prev.map((ans, idx) => (idx === currentIndex ? optionIndex : ans)),
    );
  };

  const handleNextQuestion = () => {
    if (!challenge) return;
    if (currentIndex === challenge.questions.length - 1) {
      handleSubmitResults();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitResults();
  };

  const handleSubmitResults = async () => {
    if (!challenge) return;
    setSubmitting(true);
    const score = challenge.questions.reduce(
      (total, q, idx) => total + (answers[idx] === q.correctAnswerIndex ? 1 : 0),
      0,
    );

    try {
      const res = await fetch(`/api/discord/challenge/${challenge.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: participantName || user?.username || 'Challenger',
          score,
          completionTimeSeconds: totalTimeSpent,
          postResultsToDiscord: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserRank(data.rank);
        setLeaderboard(data.leaderboard);
        setStage('results');
      }
    } catch (err) {
      console.error('Error submitting challenge score', err);
      setStage('results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareToDiscord = () => {
    if (!challenge) return;
    const score = challenge.questions.reduce(
      (total, q, idx) => total + (answers[idx] === q.correctAnswerIndex ? 1 : 0),
      0,
    );
    const textToShare = `🏆 I scored ${score}/${challenge.questions.length} on "${challenge.topic}" in DocQuiz! Can you beat my score? Join the Discord server: https://discord.gg/DQqxbrrPB`;
    navigator.clipboard.writeText(textToShare);
    setDiscordShared(true);
    setTimeout(() => setDiscordShared(false), 4000);
    window.open('https://discord.gg/DQqxbrrPB', '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[calc(100dvh-68px)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-mono-ui uppercase tracking-wider text-muted-foreground">
              Loading Challenge Arena…
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !challenge) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[calc(100dvh-68px)] max-w-md items-center justify-center px-5 py-12">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <CircleAlert size={36} className="mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-bold">Challenge Unavailable</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{error || 'This challenge does not exist.'}</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
            >
              <ArrowLeft size={14} /> Return to Study Desk
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const currentQ = challenge.questions[currentIndex];
  const currentSelected = answers[currentIndex];
  const hasAnsweredCurrent = currentSelected !== null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-5 pb-14 pt-8 md:px-10 md:pt-12">
        {/* Top Challenge Header */}
        <div className="fade-up mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono-ui font-bold text-amber-600 dark:text-amber-400">
                <Flame size={12} className="fill-amber-500" /> MULTIPLAYER CHALLENGE
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono-ui text-primary">
                {challenge.difficulty.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{challenge.topic}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Hosted by <strong className="text-foreground">{challenge.creatorUsername}</strong> · {challenge.questionCount} Questions · {Math.round(challenge.timeLimitSeconds / 60)}m Total Time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground shadow-xs"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={13} /> Study Desk
            </Link>
          </div>
        </div>

        {/* STAGE 1: LOBBY */}
        {stage === 'lobby' && (
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            {/* Rules & Start Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl paper-shadow sm:p-8 flex flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Trophy size={26} />
              </span>
              <h2 className="text-2xl font-bold text-foreground">Are you ready to compete?</h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                You will face {challenge.questionCount} active recall questions under a {Math.round(challenge.timeLimitSeconds / 60)}-minute timer. Your score and speed will determine your rank on the leaderboard.
              </p>

              <div className="mt-6 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Your Display Name / Discord Handle</label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={handleStartChallenge}
                  disabled={!participantName.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Sparkles size={16} /> Enter Challenge Arena <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Live Leaderboard Standings Preview */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">Live Standings</p>
                  <h3 className="text-lg font-bold text-foreground">Challenge Leaderboard</h3>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {leaderboard.length} Challengers
                </span>
              </div>

              {leaderboard.length > 0 ? (
                <div className="space-y-2.5">
                  {leaderboard.map((p, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = medals[idx] || `#${idx + 1}`;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between rounded-2xl border p-3 ${
                          idx === 0
                            ? 'border-amber-500/30 bg-amber-500/10'
                            : 'border-border bg-background/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold w-6 text-center">{medal}</span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{p.username}</p>
                            {p.discordUsername && (
                              <p className="text-[10px] text-muted-foreground">@{p.discordUsername}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground">
                            {p.score}/{p.totalQuestions} ({p.percentage}%)
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            ⏱️ {formatDuration(p.completionTimeSeconds)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
                  <Trophy size={28} className="opacity-30 mb-2" />
                  <p className="text-xs font-semibold">No submissions yet</p>
                  <p className="text-[11px]">Be the first to claim #1 on the leaderboard!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 2: ACTIVE QUIZ RUNNER */}
        {stage === 'playing' && currentQ && (
          <div className="mx-auto max-w-2xl">
            {/* Meta Bar */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono-ui text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Question {currentIndex + 1} / {challenge.questions.length}
                </span>
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / challenge.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Countdown timer */}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  timeLeft <= 20
                    ? 'bg-destructive/15 text-destructive animate-pulse'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <Timer size={14} />
                <span className="font-mono">{formatDuration(timeLeft)} left</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="mt-6 space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isChosen = currentSelected === optIdx;
                const isRight = hasAnsweredCurrent && optIdx === currentQ.correctAnswerIndex;
                const isWrong = hasAnsweredCurrent && isChosen && !isRight;

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(optIdx)}
                    disabled={hasAnsweredCurrent}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                      isRight
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : isWrong
                        ? 'border-destructive/50 bg-destructive/10'
                        : isChosen
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono-ui text-xs font-bold ${
                        isRight
                          ? 'bg-emerald-500 text-white'
                          : isWrong
                          ? 'bg-destructive text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Explanation Takeaway */}
            {hasAnsweredCurrent && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Exam Key Takeaway:</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {generateKeyTakeaway(
                    currentQ.question,
                    currentQ.options[currentQ.correctAnswerIndex],
                    currentQ.explanation,
                  )}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={!hasAnsweredCurrent || submitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                ) : currentIndex === challenge.questions.length - 1 ? (
                  <>Submit Challenge <Trophy size={14} /></>
                ) : (
                  <>Next Question <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: RESULTS & FULL RANKED LEADERBOARD */}
        {stage === 'results' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Rank Spotlight Card */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/5 p-7 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg text-3xl font-black">
                    {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : `#${userRank || '—'}`}
                  </div>
                  <div>
                    <span className="font-mono-ui text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                      Challenge Result
                    </span>
                    <h2 className="text-2xl font-bold text-foreground">
                      {userRank === 1
                        ? '🎉 1st Place! Champion of the Challenge!'
                        : userRank && userRank <= 3
                        ? `🔥 Podium Finish! Rank #${userRank}`
                        : `🎯 Rank #${userRank || 'Complete'}`}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completed in {formatDuration(totalTimeSpent)} with{' '}
                      {challenge.questions.reduce((tot, q, i) => tot + (answers[i] === q.correctAnswerIndex ? 1 : 0), 0)}/
                      {challenge.questions.length} correct.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleShareToDiscord}
                    className="flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <DiscordIcon className="h-4 w-4" />
                    <span>{discordShared ? 'Copied & Opening Discord…' : 'Share on Discord Server'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartChallenge}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <RefreshCw size={13} /> Retake
                  </button>
                </div>
              </div>
            </div>

            {/* Live Leaderboard Table */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">Standings</p>
                  <h3 className="text-xl font-bold text-foreground">Final Leaderboard</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-mono-ui text-xs font-bold text-primary">
                  {leaderboard.length} Submissions
                </span>
              </div>

              <div className="space-y-3">
                {leaderboard.map((p, idx) => {
                  const isCurrent = p.username === participantName;
                  const medals = ['🥇', '🥈', '🥉'];
                  const medal = medals[idx] || `#${idx + 1}`;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                        isCurrent
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                          : idx === 0
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-border bg-background/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xl font-bold w-8 text-center">{medal}</span>
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span>{p.username}</span>
                            {isCurrent && (
                              <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.2 text-[9px] font-mono-ui">
                                YOU
                              </span>
                            )}
                          </p>
                          {p.discordUsername && (
                            <p className="text-xs text-muted-foreground">@{p.discordUsername}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {p.score}/{p.totalQuestions} ({p.percentage}%)
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          ⏱️ {formatDuration(p.completionTimeSeconds)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
