import React from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Sparkles,
  CheckCircle2,
  Lock,
  Star,
  Award,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BADGES, calculateLevel, loadGamificationState } from '@/lib/gamification';

export function BadgesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = loadGamificationState();
  const { level, currentXp, nextLevelXp, progress } = calculateLevel(state.xp);
  const unlockedSet = new Set(state.unlockedBadgeIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-sm">
              <Trophy size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Study Mastery & Badges
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Your active recall streaks, mastery XP, and achievements.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Level & Streak Hero Banner */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[10px] uppercase tracking-wider text-primary font-bold">
                Mastery Level {level}
              </span>
              <Star size={15} className="text-primary fill-primary/30" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{state.xp} <span className="text-xs font-normal text-muted-foreground">total XP</span></p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-mono-ui text-muted-foreground text-right">
              {currentXp} / {nextLevelXp} XP to Lvl {level + 1}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-ui text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                Daily Streak
              </span>
              <Flame size={16} className="text-amber-500 fill-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{state.dailyStreak} <span className="text-xs font-normal text-muted-foreground">days active</span></p>
            <div className="mt-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={`h-2 flex-1 rounded-full ${
                    day <= state.dailyStreak ? 'bg-amber-500' : 'bg-amber-500/20'
                  }`}
                  title={`Day ${day}`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] font-mono-ui text-muted-foreground text-right">
              {state.totalQuizzesTaken} quizzes completed
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Achievements ({unlockedSet.size} / {BADGES.length})
            </h3>
            <span className="text-[11px] font-semibold text-primary">
              {Math.round((unlockedSet.size / BADGES.length) * 100)}% Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES.map((badge) => {
              const isUnlocked = unlockedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                    isUnlocked
                      ? 'border-border bg-card shadow-sm hover:border-primary/50'
                      : 'border-border/40 bg-muted/20 opacity-60'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm transition-transform group-hover:scale-105 ${
                      isUnlocked
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted border border-border/50 text-muted-foreground grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold text-foreground">
                        {badge.title}
                      </p>
                      {isUnlocked ? (
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Lock size={12} className="text-muted-foreground/60 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
