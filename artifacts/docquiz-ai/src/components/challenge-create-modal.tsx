import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Check,
  Copy,
  Flame,
  Loader2,
  Share2,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import { DiscordIcon } from './discord-settings-modal';
import { useAuth } from '@/lib/auth-context';
import { readDocument, readQuiz } from '@/lib/storage';
import { useLocation } from 'wouter';

export interface ChallengeCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTopic?: string;
}

export function ChallengeCreateModal({
  open,
  onOpenChange,
  defaultTopic,
}: ChallengeCreateModalProps) {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const doc = readDocument();
  const activeQuiz = readQuiz();

  const [topic, setTopic] = useState(
    defaultTopic || activeQuiz?.title || (doc ? doc.fileName.replace(/\.[^/.]+$/, '') : 'DSA & Algorithms'),
  );
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'blitz' | 'challenge' | 'relaxed'>('challenge');
  const [postToDiscord, setPostToDiscord] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdChallenge, setCreatedChallenge] = useState<{
    id: string;
    url: string;
    discordPosted: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      // Pick questions from active quiz or generate default challenge pool
      let questions = activeQuiz?.questions || [];
      if (questions.length === 0) {
        questions = [
          {
            id: 'cq-1',
            question: `In ${topic}, which principle is fundamental for optimizing execution and memory retrieval?`,
            options: [
              'Contiguous memory localization and active caching',
              'Unbounded recursive descent without memoization',
              'Random memory addressing on single-core systems',
              'Redundant state duplication across threads',
            ],
            correctAnswerIndex: 0,
            explanation: 'Memory locality reduces cache misses and accelerates active data retrieval.',
          },
          {
            id: 'cq-2',
            question: `When analyzing time complexity for ${topic}, what does O(1) denote?`,
            options: [
              'Constant time independent of input size',
              'Linear time scaling with elements',
              'Exponential search branch',
              'Logarithmic division',
            ],
            correctAnswerIndex: 0,
            explanation: 'Constant time complexity O(1) indicates direct, immediate access regardless of collection size.',
          },
          {
            id: 'cq-3',
            question: `What is the core benefit of active recall testing in ${topic}?`,
            options: [
              'Forces neural retrieval and strengthens memory consolidation',
              'Passive reading takes less cognitive effort',
              'Eliminates the need for conceptual understanding',
              'Only useful for syntax memorization',
            ],
            correctAnswerIndex: 0,
            explanation: 'Active recall forces the brain to retrieve information, strengthening synaptic pathways.',
          },
          {
            id: 'cq-4',
            question: `Which data structure provides the fastest LIFO (Last In, First Out) ordering in ${topic}?`,
            options: ['Stack', 'Queue', 'Hash Map', 'Binary Search Tree'],
            correctAnswerIndex: 0,
            explanation: 'A Stack strictly enforces Last In, First Out order with constant time push and pop operations.',
          },
          {
            id: 'cq-5',
            question: `What is the primary indicator of mastery when practicing ${topic}?`,
            options: [
              'High accuracy combined with quick retrieval pace',
              'Spending hours re-reading notes without testing',
              'Memorizing answer options by letter position',
              'Avoiding difficult problem categories',
            ],
            correctAnswerIndex: 0,
            explanation: 'True conceptual mastery combines high retrieval accuracy with confident, fast pacing.',
          },
        ];
      }

      const timeLimitSeconds =
        difficulty === 'blitz'
          ? questionCount * 15
          : difficulty === 'challenge'
          ? questionCount * 30
          : questionCount * 60;

      const res = await fetch('/api/discord/challenge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount,
          timeLimitSeconds,
          questions: questions.slice(0, questionCount),
          sourceFileName: doc?.fileName || 'Active Recall Deck',
          postToDiscord,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const origin = window.location.origin;
        setCreatedChallenge({
          id: data.challengeId,
          url: `${origin}/challenge/${data.challengeId}`,
          discordPosted: data.discordPostStatus?.posted ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to create challenge', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdChallenge) return;
    navigator.clipboard.writeText(createdChallenge.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchChallenge = () => {
    if (!createdChallenge) return;
    onOpenChange(false);
    setLocation(`/challenge/${createdChallenge.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 shadow-2xl sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-sm">
              <Flame size={24} className="fill-amber-500" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>Create Peer Challenge</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono-ui font-bold text-amber-600 dark:text-amber-400">
                  Multiplayer
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Challenge classmates with identical questions & compete on a live ranked leaderboard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!createdChallenge ? (
          <div className="mt-4 space-y-4">
            {/* Topic Input */}
            <div>
              <label className="text-xs font-semibold text-foreground">Challenge Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. DSA Arrays, Machine Learning, Organic Chemistry"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Questions count */}
            <div>
              <label className="text-xs font-semibold text-foreground">Number of Questions</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      questionCount === count
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Timer limit */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Timer size={13} className="text-primary" /> Time Pressure
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'blitz' as const, label: '⚡ Blitz', desc: '15s / question' },
                  { id: 'challenge' as const, label: '🔥 Standard', desc: '30s / question' },
                  { id: 'relaxed' as const, label: '💡 Relaxed', desc: '60s / question' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDifficulty(item.id)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                      difficulty === item.id
                        ? 'border-amber-500 bg-amber-500/10 text-foreground font-bold shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discord Broadcast Toggle */}
            <label className="flex items-center gap-3 rounded-2xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={postToDiscord}
                onChange={(e) => setPostToDiscord(e.target.checked)}
                className="h-4 w-4 rounded border-border text-[#5865F2]"
              />
              <div className="text-xs">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                  <span>Broadcast to Discord Server</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Post formatted embed with [JOIN CHALLENGE] button to your study channel.
                </p>
              </div>
            </label>

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !topic.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating Challenge Link…</>
              ) : (
                <><Flame size={16} className="fill-current" /> Challenge Friends Now <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                <Check size={24} strokeWidth={2.5} />
              </span>
              <h3 className="mt-3 text-base font-bold text-foreground">Challenge Ready to Share!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Anyone with this link can attempt the challenge and compete on your live leaderboard.
              </p>
            </div>

            {/* Share link input */}
            <div>
              <label className="text-xs font-semibold text-foreground">Unique Challenge Link</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                <input
                  type="text"
                  readOnly
                  value={createdChallenge.url}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {createdChallenge.discordPosted && (
              <div className="flex items-center gap-2 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 p-2.5 text-xs text-foreground">
                <DiscordIcon className="h-4 w-4 text-[#5865F2] shrink-0" />
                <span>Posted to Discord #daily-quiz! Classmates can join directly.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleLaunchChallenge}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <Trophy size={14} /> Open Challenge Arena
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedChallenge(null);
                  onOpenChange(false);
                }}
                className="rounded-xl border border-border px-4 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
