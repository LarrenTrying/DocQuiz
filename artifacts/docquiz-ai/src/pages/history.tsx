import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/lib/auth-context';
import {
  quizHistoryService,
  type QuizHistoryRecord,
  type HistoryQuestion,
} from '@/lib/quiz-history-service';
import { writeQuiz } from '@/lib/storage';

function letter(idx: number): string {
  return String.fromCharCode(65 + idx);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [records, setRecords] = useState<QuizHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'perfect' | 'passed' | 'review'>('all');
  const [selectedRecord, setSelectedRecord] = useState<QuizHistoryRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await quizHistoryService.getUserHistory(user?.id || 'guest_user');
        setRecords(data);
      } catch (err) {
        console.error('Failed to load quiz history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz record from history?')) return;
    setDeletingId(recordId);
    try {
      await quizHistoryService.deleteRecord(recordId, user?.id || 'guest_user');
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetakeQuiz = (record: QuizHistoryRecord) => {
    // Reconstruct Quiz object and load into runner
    const reconstructed = {
      title: record.title,
      sourceFileName: record.sourceFileName || 'Saved Notes',
      questions: record.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || '',
      })),
      generatedWith: 'history-vault',
      isDemo: false,
    };
    writeQuiz(reconstructed as any);
    setLocation('/quiz');
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.sourceFileName && r.sourceFileName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (scoreFilter === 'perfect') return r.percentage === 100;
      if (scoreFilter === 'passed') return r.percentage >= 70;
      if (scoreFilter === 'review') return r.percentage < 70;
      return true;
    });
  }, [records, searchQuery, scoreFilter]);

  // Overall Stats
  const totalQuizzes = records.length;
  const avgPercentage = totalQuizzes
    ? Math.round(records.reduce((acc, r) => acc + r.percentage, 0) / totalQuizzes)
    : 0;
  const totalQuestions = records.reduce((acc, r) => acc + r.totalQuestions, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        {/* Page Header */}
        <div className="fade-up mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono-ui text-xs uppercase tracking-wider mb-1">
              <Clock size={14} />
              <span>Google Cloud Firestore Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Quiz History & Review
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your past active-recall sessions, inspect every question and answer, and review your notes.
            </p>
          </div>

          <Link
            href="/"
            className="self-start sm:self-center inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles size={14} /> Create New Quiz
          </Link>
        </div>

        {/* Stats Row */}
        <div className="fade-up grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 paper-shadow">
            <span className="text-[10px] uppercase font-mono-ui font-semibold text-muted-foreground">
              Total Quizzes Taken
            </span>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">{totalQuizzes}</p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Stored in your Cloud Vault</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 paper-shadow">
            <span className="text-[10px] uppercase font-mono-ui font-semibold text-muted-foreground">
              Average Accuracy
            </span>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-primary">{avgPercentage}%</p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Across all completed sets</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 paper-shadow">
            <span className="text-[10px] uppercase font-mono-ui font-semibold text-muted-foreground">
              Questions Answered
            </span>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">{totalQuestions}</p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Active recall repetitions</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="fade-up mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by quiz title or file name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Quizzes' },
                { id: 'perfect', label: '100% Mastery' },
                { id: 'passed', label: '≥ 70% Score' },
                { id: 'review', label: 'Needs Review' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setScoreFilter(filter.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  scoreFilter === filter.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz Cards List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono-ui uppercase tracking-wider text-muted-foreground">
              Fetching past quizzes from Cloud Firestore…
            </span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h3 className="text-lg font-bold text-foreground">No past quizzes found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {records.length === 0
                ? 'Take your first quiz from any study notes, and your full questions and answers will automatically save here!'
                : 'No quizzes match your current search or filter criteria.'}
            </p>
            {records.length === 0 && (
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105"
              >
                Upload notes & start quiz <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((record) => {
              const isPerfect = record.percentage === 100;
              const isGood = record.percentage >= 70;

              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 paper-shadow transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono-ui text-muted-foreground flex items-center gap-1.5">
                        <Clock size={12} /> {formatDate(record.completedAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        {record.difficulty && (
                          <span className="rounded-full bg-accent/40 border border-border px-2 py-0.5 font-mono-ui text-[9px] uppercase font-bold text-muted-foreground">
                            {record.difficulty}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, record.id)}
                          disabled={deletingId === record.id}
                          className="rounded-lg p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {record.title}
                    </h3>

                    {record.sourceFileName && (
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                        <FileText size={12} className="shrink-0" />
                        <span>{record.sourceFileName}</span>
                      </p>
                    )}
                  </div>

                  {/* Score & Review Button Footer */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isPerfect
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : isGood
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-destructive/15 text-destructive border border-destructive/30'
                        }`}
                      >
                        {isPerfect ? '🏆 ' : ''}
                        {record.score} / {record.totalQuestions} ({record.percentage}%)
                      </span>
                    </div>

                    <span className="text-xs font-bold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Review Q&As <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            DETAILED Q&A REVIEW MODAL
            ========================================================================= */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-border p-5 sm:p-6 bg-muted/20">
                <div>
                  <div className="flex items-center gap-2 font-mono-ui text-xs uppercase text-primary font-bold mb-1">
                    <span>Quiz Q&A Review</span>
                    <span>•</span>
                    <span>{formatDate(selectedRecord.completedAt)}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {selectedRecord.title}
                  </h2>
                  {selectedRecord.sourceFileName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Source notes: {selectedRecord.sourceFileName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Performance Score Summary Bar */}
              <div className="flex items-center justify-between px-6 py-3 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground">Score Recap:</span>
                  <span className="font-extrabold text-sm text-primary">
                    {selectedRecord.score} / {selectedRecord.totalQuestions} ({selectedRecord.percentage}%)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRetakeQuiz(selectedRecord)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105 cursor-pointer"
                >
                  <RotateCcw size={13} /> Retake this quiz
                </button>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {selectedRecord.questions.map((q, idx) => {
                  const wasAnswered = q.selectedAnswerIndex !== null;
                  const isCorrect = q.isCorrect;

                  return (
                    <div
                      key={q.id || idx}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        isCorrect
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : wasAnswered
                          ? 'border-destructive/30 bg-destructive/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground/10 text-xs font-bold font-mono-ui text-foreground">
                            {idx + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : wasAnswered
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 size={12} /> Correct
                              </>
                            ) : wasAnswered ? (
                              <>
                                <XCircle size={12} /> Incorrect
                              </>
                            ) : (
                              'Skipped'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm sm:text-base font-semibold text-foreground mb-4">
                        {q.question}
                      </p>

                      {/* Options Breakdown */}
                      <div className="space-y-2 mb-3">
                        {q.options.map((opt, optIdx) => {
                          const isOptionCorrect = optIdx === q.correctAnswerIndex;
                          const wasOptionSelected = optIdx === q.selectedAnswerIndex;

                          let optionStyle =
                            'border-border/60 bg-background text-foreground';
                          if (isOptionCorrect) {
                            optionStyle =
                              'border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/40';
                          } else if (wasOptionSelected && !isCorrect) {
                            optionStyle =
                              'border-destructive/50 bg-destructive/10 text-destructive font-semibold line-through ring-1 ring-destructive/40';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm transition-all ${optionStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-foreground/10 font-mono-ui text-[11px] font-bold">
                                  {letter(optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {wasOptionSelected && (
                                  <span className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono-ui text-[10px] font-bold text-foreground">
                                    Your choice
                                  </span>
                                )}
                                {isOptionCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={14} /> Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Citation */}
                      {q.explanation && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                          <span className="block font-bold text-primary uppercase text-[10px] tracking-wider mb-0.5 flex items-center gap-1">
                            <Sparkles size={11} /> Explanation & Source Grounding
                          </span>
                          <p className="text-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border p-4 bg-muted/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
