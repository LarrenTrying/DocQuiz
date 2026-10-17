import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  Copy,
  ExternalLink,
  Flame,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

export const DISCORD_INVITE_URL = 'https://discord.gg/DQqxbrrPB';

export function DiscordIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export interface DiscordSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscordSettingsModal({ open, onOpenChange }: DiscordSettingsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(DISCORD_INVITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Banner with Discord Blurple Theme */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5865F2] via-[#4752C4] to-[#3c45a5] p-6 pb-8 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none">
            <DiscordIcon className="w-28 h-28" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg">
              <DiscordIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono-ui uppercase tracking-wider font-bold text-white">
                  Official Community
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white mt-0.5">
                DocQuiz Discord Server
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="mt-3 text-xs text-white/85 leading-relaxed">
            Connect with students, study groups, and medical learners. Discuss quizzes, challenge peers, and share study materials.
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Key Community Features */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Flame size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Peer Quizzes</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Challenge members to 1v1 blitz quizzes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2]">
                <MessageSquare size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Study Lounges</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Ask doubts & discuss explanations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Trophy size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Leaderboards</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Track weekly XP & study streaks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Zap size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Early Drops</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Test new AI features first
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenChange(false)}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] py-3.5 px-6 font-bold text-white shadow-lg shadow-[#5865F2]/25 transition-all hover:scale-[1.01] active:scale-95 text-sm"
          >
            <DiscordIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>Join Discord Server</span>
            <ExternalLink size={15} className="opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* 1-Click Copy Invite Link Box */}
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <label className="text-[10px] font-mono-ui uppercase tracking-wider text-muted-foreground block mb-1.5 font-bold">
              Direct Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={DISCORD_INVITE_URL}
                className="w-full bg-background rounded-xl border border-border px-3 py-2 text-xs font-mono text-muted-foreground select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-accent/15 transition-colors shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
