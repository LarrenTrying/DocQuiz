import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Radio,
  RefreshCw,
  Save,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'server'>('profile');
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [status, setStatus] = useState<{
    isConnected: boolean;
    discordUser: {
      id: string;
      discordUserId: string;
      discordUsername: string;
      discordAvatar: string | null;
      studyRemindersEnabled: boolean;
      weakTopicInsightsEnabled: boolean;
    } | null;
  }>({ isConnected: false, discordUser: null });

  // Notification Preferences
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [insightsEnabled, setInsightsEnabled] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Server Admin State
  const [serverChannel, setServerChannel] = useState('daily-quiz');
  const [serverDailyChallenge, setServerDailyChallenge] = useState(true);
  const [serverLeaderboards, setServerLeaderboards] = useState(true);
  const [serverAchievements, setServerAchievements] = useState(true);
  const [serverSaveLoading, setServerSaveLoading] = useState(false);
  const [serverSuccessMsg, setServerSuccessMsg] = useState('');

  const [connectionError, setConnectionError] = useState('');

  // Fetch status on open & on window event
  useEffect(() => {
    if (!open) return;
    fetchStatus();

    const handleUpdate = () => fetchStatus();
    window.addEventListener('docquiz-discord-updated', handleUpdate);
    return () => window.removeEventListener('docquiz-discord-updated', handleUpdate);
  }, [open, token]);

  const fetchStatus = async () => {
    setLoading(true);
    setConnectionError('');
    try {
      const res = await fetch('/api/discord/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.discordUser) {
          setRemindersEnabled(data.discordUser.studyRemindersEnabled ?? true);
          setInsightsEnabled(data.discordUser.weakTopicInsightsEnabled ?? true);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch Discord status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (directRedirect: boolean = false) => {
    setLoading(true);
    setConnectionError('');
    try {
      const res = await fetch('/api/discord/auth-url', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Failed to get authorization URL from server.');
      }
      const { authUrl } = await res.json();
      if (!authUrl) throw new Error('No authorization URL received.');

      if (directRedirect) {
        window.location.href = authUrl;
        return;
      }

      // Open Discord OAuth authorization popup / window
      const width = 540;
      const height = 760;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'DiscordAuth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`,
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: direct redirect
        window.location.href = authUrl;
        return;
      }

      const handleAuthMsg = async (event: MessageEvent) => {
        if (event.data?.type === 'DISCORD_AUTH_SUCCESS') {
          window.removeEventListener('message', handleAuthMsg);
          await fetchStatus();
          setLoading(false);
        }
      };
      window.addEventListener('message', handleAuthMsg);

      const pollTimer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleAuthMsg);
          await fetchStatus();
          setLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      console.error('Discord authorization error', err);
      setConnectionError(err.message || 'Could not start Discord authorization.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discord/disconnect', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setStatus({ isConnected: false, discordUser: null });
      }
    } catch (err) {
      console.error('Failed to disconnect Discord', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/discord/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studyRemindersEnabled: remindersEnabled,
          weakTopicInsightsEnabled: insightsEnabled,
        }),
      });
      if (res.ok) {
        setSaveSuccessMsg('Notification preferences saved!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error saving preferences', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveServerConfig = async () => {
    setServerSaveLoading(true);
    setServerSuccessMsg('');
    try {
      const res = await fetch('/api/discord/servers/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          guildId: 'guild_study_hall_99',
          guildName: 'College Study Group 🎓',
          channelId: '123456789012345678',
          channelName: serverChannel,
          dailyChallengeEnabled: serverDailyChallenge,
          achievementEnabled: serverAchievements,
          reminderEnabled: serverLeaderboards,
        }),
      });
      if (res.ok) {
        setServerSuccessMsg('Server settings saved successfully!');
        setTimeout(() => setServerSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error saving server settings', err);
    } finally {
      setServerSaveLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl border-border bg-card p-6 shadow-2xl sm:p-7">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-md">
                <DiscordIcon className="h-6 w-6" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Discord Integration</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono-ui font-bold text-primary">
                    Social Learning Layer
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Connect your Discord account to challenge classmates, share achievements, and get AI insights.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="mt-4 flex rounded-xl border border-border bg-muted/40 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap size={14} className="text-[#5865F2]" /> User Connection & Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'server' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Server size={14} className="text-emerald-500" /> Server Admin Setup
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="mt-4 space-y-5">
            {/* Connection Status Box */}
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Connection Status
              </p>

              {status.isConnected && status.discordUser ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#5865F2] font-bold">
                      {status.discordUser.discordAvatar ? (
                        <img
                          src={status.discordUser.discordAvatar}
                          alt="Avatar"
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <DiscordIcon className="h-5 w-5" />
                      )}
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Connected</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">@{status.discordUser.discordUsername}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Discord Not Connected</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Authorize with official Discord OAuth2 (minimal scopes: identify).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConnect(false)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#4752C4] disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
                      <span>Connect Discord</span>
                    </button>
                  </div>
                </div>
              )}

              {connectionError && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between gap-2">
                  <span>{connectionError}</span>
                  <button
                    type="button"
                    onClick={() => handleConnect(true)}
                    className="font-bold underline underline-offset-2 hover:opacity-80"
                  >
                    Authorize in tab
                  </button>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-ui">
                    Personalized Discord Notifications
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Only sent if you explicitly enable them.</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <span>📚 Personalized Study Reminders</span>
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Receive friendly Discord DMs when you planned to practice but haven't finished daily review.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={insightsEnabled}
                    onChange={(e) => setInsightsEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <span>🎯 Weak Topic Insights</span>
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Get AI-curated tips and targeted 5-question practice sets on topics you scored lowest on.
                    </p>
                  </div>
                </label>
              </div>

              {saveSuccessMsg && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check size={13} /> {saveSuccessMsg}
                </p>
              )}

              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPrefs || !status.isConnected}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground transition-all hover:bg-secondary/90 disabled:opacity-40"
              >
                {savingPrefs ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Alert Preferences</span>
              </button>
            </div>

            {/* Privacy & Security Guarantee */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>We never ask for or store passwords. Minimal Discord scopes are requested.</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-ui">
                    Discord Server Configuration
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Configure bot channels for your study community.</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Admin Control
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Target Broadcast Channel</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono">
                  <span className="text-muted-foreground">#</span>
                  <input
                    type="text"
                    value={serverChannel}
                    onChange={(e) => setServerChannel(e.target.value)}
                    placeholder="daily-quiz"
                    className="flex-1 bg-transparent outline-none text-foreground font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverDailyChallenge}
                    onChange={(e) => setServerDailyChallenge(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span className="text-xs font-bold text-foreground">🧠 Daily Challenge Broadcasts</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverLeaderboards}
                    onChange={(e) => setServerLeaderboards(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span className="text-xs font-bold text-foreground">🏆 Real-Time Challenge Leaderboards</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverAchievements}
                    onChange={(e) => setServerAchievements(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span className="text-xs font-bold text-foreground">🎉 Optional Member Achievement Shares</span>
                </label>
              </div>

              {serverSuccessMsg && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check size={13} /> {serverSuccessMsg}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveServerConfig}
                disabled={serverSaveLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {serverSaveLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Server Settings</span>
              </button>
            </div>

            {/* Official Bot Install Link */}
            <div className="rounded-2xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                    <span>Install DocQuiz Bot on Discord</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Enables <code className="text-[10px] bg-background px-1 rounded">/quiz</code> and{' '}
                    <code className="text-[10px] bg-background px-1 rounded">/ask</code> slash commands.
                  </p>
                </div>

                <a
                  href="https://discord.com/api/oauth2/authorize?client_id=1552335820239798342&permissions=2147483648&scope=bot%20applications.commands"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-[#5865F2] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <span>Add Bot</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
