import { useState, useEffect, type ReactNode } from 'react';
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles,
  RefreshCw,
  Palette,
  Trophy,
  Flame,
  Award,
  Users,
  Clock,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { AnimatedAvatar, AvatarCustomizerModal } from '@/components/animated-avatar';
import { useUserAvatar, randomizeUserAvatar } from '@/lib/avatar-generator';
import { LensScannerModal, GoogleLensIcon } from '@/components/lens-scanner';
import { BadgesModal } from '@/components/badges-modal';
import { DiscordSettingsModal, DiscordIcon } from '@/components/discord-settings-modal';
import { ChallengeCreateModal } from '@/components/challenge-create-modal';
import { loadGamificationState, calculateLevel, type GamificationState } from '@/lib/gamification';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Mark() {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]" aria-hidden="true">
      <BookOpen size={18} strokeWidth={2.2} />
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [currentAvatar] = useUserAvatar(user?.username);
  const [gamificationState, setGamificationState] = useState<GamificationState>(loadGamificationState());

  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const serverReady = health.isSuccess && health.data?.status === 'ok';

  useEffect(() => {
    const handleGamificationUpdate = (e: any) => {
      if (e.detail) setGamificationState(e.detail);
    };
    window.addEventListener('docquiz-gamification-updated', handleGamificationUpdate);
    return () => window.removeEventListener('docquiz-gamification-updated', handleGamificationUpdate);
  }, []);

  const { level } = calculateLevel(gamificationState.xp);

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleQuickRandomize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.username) {
      randomizeUserAvatar(user.username);
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Avatar Customizer Dialog Modal */}
      <AvatarCustomizerModal
        open={isAvatarModalOpen}
        onOpenChange={setIsAvatarModalOpen}
        username={user?.username}
      />

      {/* Badges & Mastery Modal */}
      <BadgesModal
        open={isBadgesModalOpen}
        onOpenChange={setIsBadgesModalOpen}
      />

      {/* Discord Integration Modal */}
      <DiscordSettingsModal
        open={isDiscordModalOpen}
        onOpenChange={setIsDiscordModalOpen}
      />

      {/* Challenge Creator Modal */}
      <ChallengeCreateModal
        open={isChallengeModalOpen}
        onOpenChange={setIsChallengeModalOpen}
      />

      <aside className="hidden min-h-[100dvh] w-[246px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3" data-testid="link-brand-home">
          <Mark />
          <span>
            <span className="block text-[15px] font-bold tracking-[-0.02em]">Qzi <span className="text-[hsl(var(--sidebar-primary))]">AI</span></span>
            <span className="font-mono-ui mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground)/.52)]">active recall desk</span>
          </span>
        </Link>

        {/* Gamification Level & Streak Quick Badge */}
        <button
          type="button"
          onClick={() => setIsBadgesModalOpen(true)}
          className="mb-5 flex items-center justify-between rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.3)] p-2.5 transition-all hover:bg-[hsl(var(--sidebar-accent))] text-left cursor-pointer group"
          title="View Badges & Study Mastery"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Flame size={14} className="fill-amber-400" />
            </span>
            <div>
              <p className="font-bold text-[11px] text-[hsl(var(--sidebar-foreground))] leading-tight">
                {gamificationState.dailyStreak} Day Streak
              </p>
              <p className="text-[9px] font-mono-ui text-[hsl(var(--sidebar-foreground)/.6)]">
                Lvl {level} · {gamificationState.xp} XP
              </p>
            </div>
          </div>
          <Award size={14} className="text-[hsl(var(--sidebar-foreground)/.5)] group-hover:text-amber-400 transition-colors" />
        </button>

        <div className="mb-2.5 px-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.4)]">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">
          <Link href="/" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${location === '/' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid="link-nav-library">
            <LayoutDashboard size={15} /> Library
          </Link>
          <Link href="/quiz" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${location === '/quiz' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid="link-nav-quiz">
            <Sparkles size={15} /> Current quiz
          </Link>
          <Link href="/history" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${location === '/history' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid="link-nav-history">
            <Clock size={15} /> Quiz History
          </Link>
          <button
            type="button"
            onClick={() => setIsLensOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.78)] transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            data-testid="button-sidebar-lens"
          >
            <GoogleLensIcon className="w-4 h-4" />
            <span>Lens Scanner</span>
            <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 font-mono-ui text-[9px] uppercase text-primary">AI</span>
          </button>
        </nav>

        {/* Social & Community Learning Section */}
        <div className="mt-4 mb-2 px-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.4)]">Social Learning</div>
        <nav className="space-y-1" aria-label="Social navigation">
          <button
            type="button"
            onClick={() => setIsChallengeModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.78)] transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            data-testid="button-sidebar-challenge"
          >
            <Flame size={15} className="text-amber-400" />
            <span>Peer Challenge</span>
            <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono-ui text-[9px] font-bold text-amber-400">VS</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDiscordModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.78)] transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            data-testid="button-sidebar-discord"
          >
            <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
            <span>Discord Study</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBadgesModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.78)] transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            data-testid="button-sidebar-badges"
          >
            <Trophy size={15} className="text-amber-400" />
            <span>Badges & XP</span>
          </button>
        </nav>

        {/* User Account Section */}
        <div className="mt-auto space-y-3 pt-3">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.45)] p-2.5 text-left transition-colors hover:bg-[hsl(var(--sidebar-accent))] cursor-pointer group"
                  data-testid="button-user-profile"
                >
                  <AnimatedAvatar username={user.username} size="sm" showBadge />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[hsl(var(--sidebar-foreground))] flex items-center justify-between">
                      <span>{user.name || user.username}</span>
                    </p>
                    <p className="truncate text-[10px] text-[hsl(var(--sidebar-foreground)/.6)]">
                      {currentAvatar.emoji} {currentAvatar.name}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-border bg-card p-1.5 shadow-2xl">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentAvatar.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground leading-tight">{user.name || user.username}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{currentAvatar.name} · @{user.username}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Discord & Social Options */}
                <DropdownMenuItem
                  onClick={() => setIsDiscordModalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                  <span>Discord Integration…</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setLocation('/history')}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <Clock size={14} className="text-primary" />
                  <span>Quiz History & Vault</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <Flame size={14} className="text-amber-500" />
                  <span>Create Peer Challenge…</span>
                </DropdownMenuItem>
                
                {/* Mascot Options */}
                <DropdownMenuItem
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <Palette size={14} className="text-primary" />
                  <span>Customize Study Mascot…</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={handleQuickRandomize}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <RefreshCw size={14} className="text-amber-500" />
                  <span>Randomize Mascot</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsBadgesModalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
                >
                  <Trophy size={14} className="text-amber-500" />
                  <span>View Badges & XP</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive focus:bg-destructive/10 focus:text-destructive"
                  data-testid="button-logout"
                >
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--sidebar-accent))] px-3 py-2.5 text-xs font-bold text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-[hsl(var(--sidebar-primary))] hover:text-[hsl(var(--sidebar-primary-foreground))]"
              data-testid="link-sidebar-login"
            >
              <LogIn size={14} /> Sign in
            </Link>
          )}

          {/* Tutor Server Status */}
          <div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.3)] p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className={`h-2 w-2 rounded-full ${health.isPending ? 'bg-[hsl(var(--accent))] pulse-soft' : serverReady ? 'bg-emerald-400' : 'bg-[hsl(var(--sidebar-foreground)/.35)]'}`} />
              {health.isPending ? 'Waking tutor' : serverReady ? 'Tutor online' : 'Tutor offline'}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.55)]">Active recall engine ready.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:pl-[246px]">
        <header className="flex h-[68px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-mobile-brand">
            <Mark />
            <span className="text-sm font-bold tracking-[-0.02em]">Qzi <span className="text-primary">AI</span></span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsChallengeModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
              title="Create Peer Challenge"
            >
              <Flame size={13} className="fill-amber-500 text-amber-500" />
              <span>VS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDiscordModalOpen(true)}
              className="flex items-center justify-center rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 p-2 text-[#5865F2]"
              title="Discord Settings"
            >
              <DiscordIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsLensOpen(true)}
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm active:scale-95"
              data-testid="button-mobile-lens"
              title="Google Lens Scanner"
            >
              <GoogleLensIcon className="w-3.5 h-3.5" animated={false} />
              <span>Lens</span>
            </button>

            <Link href="/quiz" className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground" data-testid="link-mobile-quiz">
              <Sparkles size={13} /> Quiz
            </Link>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="rounded-full">
                    <AnimatedAvatar username={user.username} size="xs" showBadge />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl">
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currentAvatar.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{user.name || user.username}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{currentAvatar.name}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setLocation('/history')}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <Clock size={14} className="text-primary" />
                    <span>Quiz History & Vault</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDiscordModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                    <span>Discord Settings…</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsChallengeModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <Flame size={14} className="text-amber-500" />
                    <span>Create Challenge…</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <Palette size={14} className="text-primary" />
                    <span>Change Mascot…</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleQuickRandomize}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <RefreshCw size={14} className="text-amber-500" />
                    <span>Randomize</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsBadgesModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <Trophy size={14} className="text-amber-500" />
                    <span>Badges & XP</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut size={14} /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>
        <main>{children}</main>
      </div>

      {/* Google Lens Scanner Modal */}
      <LensScannerModal
        open={isLensOpen}
        onOpenChange={setIsLensOpen}
      />
    </div>
  );
}

export function FileTypeIcon({ type }: { type: string }) {
  return <FileText size={18} className={type.toLowerCase().includes('pdf') ? 'text-primary' : 'text-[hsl(165_38%_42%)]'} />;
}
