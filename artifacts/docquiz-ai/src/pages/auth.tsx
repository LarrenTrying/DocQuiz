import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  KeyRound,
  UserPlus,
  LogIn,
  FileText,
  BrainCircuit,
  Check,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { AnimatedAvatar, AvatarCustomizerModal } from '@/components/animated-avatar';

export const SECURITY_QUESTIONS = [
  'What was the name of your first school?',
  'What was your childhood nickname?',
  'What was the name of your first pet?',
  'What is your favorite book?',
  'What city were you born in?',
] as const;

function calculatePasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pass) return { score: 0, label: '', color: 'bg-muted' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10 || (/[A-Z]/.test(pass) && /[0-9]/.test(pass))) score += 1;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score === 1) return { score: 1, label: 'Basic', color: 'bg-destructive' };
  if (score === 2) return { score: 2, label: 'Good', color: 'bg-amber-500' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
}

export default function AuthPage({ initialView = 'login' }: { initialView?: string }) {
  const [, setLocation] = useLocation();
  const {
    login,
    register,
    getSecurityQuestion,
    resetPassword,
    isAuthenticated,
    signInWithGoogle,
    isFirebaseConfigured,
  } = useAuth();

  // rightPanelActive is TRUE for Sign Up, FALSE for Sign In
  const [rightPanelActive, setRightPanelActive] = useState(initialView === 'register');
  const [isForgot, setIsForgot] = useState(initialView === 'forgot-password');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isAuthAvatarModalOpen, setIsAuthAvatarModalOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!isFirebaseConfigured) {
      triggerErrorShake(
        'Firebase is not yet configured in .env! Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.'
      );
      return;
    }

    try {
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      setIsSuccess(true);
      setSuccessMessage(`Welcome, ${user.name || user.username}! Redirecting…`);
      setTimeout(() => setLocation('/'), 450);
    } catch (err: any) {
      triggerErrorShake(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regSecurityQuestion, setRegSecurityQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState('');
  const [activeSecurityQuestion, setActiveSecurityQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Trigger error shake animation
  const triggerErrorShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Sync route param with view
  useEffect(() => {
    if (initialView === 'register') {
      setRightPanelActive(true);
      setIsForgot(false);
    } else if (initialView === 'forgot-password') {
      setIsForgot(true);
      setForgotStep(1);
    } else {
      setRightPanelActive(false);
      setIsForgot(false);
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [initialView]);

  const toggleAuthMode = (toSignUp: boolean) => {
    setRightPanelActive(toSignUp);
    setIsForgot(false);
    setErrorMessage('');
    setSuccessMessage('');
    setIsSuccess(false);
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginUsername.trim() || !loginPassword) {
      triggerErrorShake('Please enter both your username and password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginUsername.trim(), loginPassword);
      setIsSuccess(true);
      setSuccessMessage('Welcome back! Opening your study desk…');
      setTimeout(() => setLocation('/'), 450);
    } catch (err: any) {
      triggerErrorShake(err.message || 'Incorrect username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const username = regUsername.trim();
    if (!username || username.length < 3) {
      triggerErrorShake('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      triggerErrorShake('Username can only contain letters, numbers, underscores, dashes, and periods.');
      return;
    }

    if (!regSecurityAnswer.trim() || regSecurityAnswer.trim().length < 2) {
      triggerErrorShake('Please provide a security answer (at least 2 characters).');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      triggerErrorShake('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      triggerErrorShake('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setLoading(true);
      await register({
        username,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        securityQuestion: regSecurityQuestion,
        securityAnswer: regSecurityAnswer.trim(),
      });
      setIsSuccess(true);
      setSuccessMessage('Account created! Taking you to your study desk…');
      setTimeout(() => setLocation('/'), 450);
    } catch (err: any) {
      triggerErrorShake(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password: Step 1 -> Lookup Username
  const handleLookupUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!forgotUsername.trim()) {
      triggerErrorShake('Please enter your username.');
      return;
    }

    try {
      setLoading(true);
      const res = await getSecurityQuestion(forgotUsername.trim());
      setActiveSecurityQuestion(res.securityQuestion);
      setForgotStep(2);
    } catch (err: any) {
      triggerErrorShake(err.message || 'No account found with this username. Please check your spelling.');
    } finally {
      setLoading(false);
    }
  };

  // 3b. Forgot Password: Step 2 -> Verify Answer & Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!forgotAnswer.trim()) {
      triggerErrorShake('Please answer your security question.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      triggerErrorShake('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      triggerErrorShake('Passwords do not match. Please verify your new password.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        username: forgotUsername.trim(),
        securityAnswer: forgotAnswer.trim(),
        newPassword: forgotNewPassword,
        confirmNewPassword: forgotConfirmPassword,
      });
      setIsSuccess(true);
      setSuccessMessage('Password reset successfully! Redirecting to study desk…');
      setTimeout(() => setLocation('/'), 450);
    } catch (err: any) {
      triggerErrorShake(err.message || 'Incorrect security answer. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const passStrength = calculatePasswordStrength(regPassword);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden selection:bg-accent selection:text-foreground">
      
      {/* Background Ink Grid Texture */}
      <div className="ink-grid absolute inset-0 pointer-events-none opacity-40" />

      {/* Ambient Gradient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />

      {/* Top Header / Brand Mark */}
      <header className="relative z-20 w-full pt-6 pb-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <BookOpen size={22} className="stroke-[2.5]" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Qzi <span className="text-primary font-black">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-card/70 backdrop-blur-md px-4 py-1.5 text-xs text-muted-foreground shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono-ui text-xs font-medium">Active Recall Protocol</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN ANIMATED SLIDING AUTHENTICATION CONTAINER (Florin Pop / Double Slider)
          ========================================================================= */}
      <main className="relative z-10 mx-auto w-full max-w-5xl lg:max-w-6xl flex-1 px-4 py-6 sm:px-8 flex items-center justify-center">
        
        {/* The Outer Main Frame with Paper Shadow & Clean Border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [0, -6, 6, -4, 4, -2, 2, 0] : 0,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full min-h-[640px] rounded-3xl border border-border/90 bg-card shadow-2xl paper-shadow overflow-hidden"
        >
          
          {/* =========================================================================
              1. SIGN IN FORM CONTAINER (Left Half on initial state, slides Right & hides on Sign Up)
              ========================================================================= */}
          <div
            className={`w-full md:w-1/2 h-full p-6 sm:p-10 flex flex-col justify-between transition-all duration-700 ease-in-out md:absolute md:top-0 md:left-0 z-20 ${
              rightPanelActive
                ? 'opacity-0 pointer-events-none md:translate-x-full md:z-10'
                : 'opacity-100 pointer-events-auto md:translate-x-0 md:z-20'
            }`}
          >
            {isForgot ? (
              /* FORGOT PASSWORD SUB-FLOW */
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary mb-2">
                    <KeyRound size={13} />
                    <span>VAULT RECOVERY</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {forgotStep === 1 ? 'Recover Password' : 'Reset Password'}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {forgotStep === 1
                      ? 'Enter your username to answer your registered security question.'
                      : `Answer your question to set a new password for @${forgotUsername}.`}
                  </p>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleLookupUsername} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="forgot-user-input">
                        Your Username
                      </label>
                      <div className="relative flex items-center group">
                        <User size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                        <input
                          id="forgot-user-input"
                          type="text"
                          required
                          placeholder="e.g. alex_morgan"
                          value={forgotUsername}
                          onChange={(e) => setForgotUsername(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Continue</span>}
                      <ArrowRight size={14} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                        Security Question
                      </span>
                      <p className="mt-0.5 font-semibold text-foreground">{activeSecurityQuestion}</p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="forgot-ans-input">
                        Security Answer
                      </label>
                      <div className="relative flex items-center group">
                        <ShieldCheck size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                        <input
                          id="forgot-ans-input"
                          type="text"
                          required
                          placeholder="Your secret answer"
                          value={forgotAnswer}
                          onChange={(e) => setForgotAnswer(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="forgot-pass-input">
                        New Password
                      </label>
                      <div className="relative flex items-center group">
                        <Lock size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                        <input
                          id="forgot-pass-input"
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          placeholder="Min 6 characters"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-9 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3 text-muted-foreground hover:text-foreground"
                        >
                          {showForgotNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="forgot-conf-input">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center group">
                        <Lock size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                        <input
                          id="forgot-conf-input"
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          placeholder="Confirm new password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || isSuccess}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Update & Sign In</span>}
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgot(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to Sign in
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD SIGN IN FORM */
              <div className="flex-1 flex flex-col justify-center space-y-5">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    Sign in
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use your account credentials to access your documents.
                  </p>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Google Sign In Button */}
                <button
                  type="button"
                  disabled={loading || googleLoading || isSuccess}
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/90 py-2.5 px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-accent/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 size={15} className="animate-spin text-primary" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    or with username
                  </span>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="login-user">
                      Username
                    </label>
                    <div className="relative flex items-center group">
                      <User size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                      <input
                        id="login-user"
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="e.g. alex_morgan"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground" htmlFor="login-pass">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setForgotStep(1);
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <div className="relative flex items-center group">
                      <Lock size={15} className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                      <input
                        id="login-pass"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || isSuccess}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                  >
                    {isSuccess ? (
                      <span className="flex items-center gap-1.5 font-bold">
                        <Check size={15} className="stroke-[3]" />
                        Signed in
                      </span>
                    ) : loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        SIGN IN
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>
                </form>

                {/* Mobile Tab Switcher */}
                <div className="md:hidden pt-3 text-center text-xs text-muted-foreground border-t border-border/60">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => toggleAuthMode(true)}
                    className="font-bold text-primary hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              2. SIGN UP FORM CONTAINER (Positioned on Left, SLIDES TO RIGHT HALF on active state!)
              ========================================================================= */}
          <div
            className={`w-full md:w-1/2 h-full p-6 sm:p-10 flex flex-col justify-between transition-all duration-700 ease-in-out md:absolute md:top-0 md:left-0 ${
              rightPanelActive
                ? 'opacity-100 pointer-events-auto md:translate-x-full md:z-50'
                : 'opacity-0 pointer-events-none md:translate-x-0 md:z-10'
            }`}
          >
            <div className="flex-1 flex flex-col justify-center space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    Create Account
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start turning your study notes into active recall quizzes.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <AnimatedAvatar
                    username={regUsername || 'new_user'}
                    size="sm"
                    showBadge
                    onClick={() => setIsAuthAvatarModalOpen(true)}
                  />
                  <span className="text-[9px] font-mono-ui text-muted-foreground mt-0.5 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsAuthAvatarModalOpen(true)}>
                    Change
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{successMessage}</span>
                </div>
              )}

                {/* Google Sign Up Button */}
                <button
                  type="button"
                  disabled={loading || googleLoading || isSuccess}
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/90 py-2 px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-accent/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 size={14} className="animate-spin text-primary" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Connecting…' : 'Sign up with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center my-0.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-card px-2 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    or with details
                  </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-2.5">
                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-foreground" htmlFor="reg-username-field">
                    Username
                  </label>
                  <div className="relative flex items-center group">
                    <User size={14} className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      id="reg-username-field"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="e.g. alex_morgan"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-foreground" htmlFor="reg-sec-q-field">
                    Security Question <span className="text-[10px] text-muted-foreground font-normal">(for recovery)</span>
                  </label>
                  <div className="relative flex items-center group">
                    <HelpCircle size={14} className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <select
                      id="reg-sec-q-field"
                      value={regSecurityQuestion}
                      onChange={(e) => setRegSecurityQuestion(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-background/80 py-1.5 pl-9 pr-7 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-foreground" htmlFor="reg-sec-a-field">
                    Security Answer
                  </label>
                  <div className="relative flex items-center group">
                    <ShieldCheck size={14} className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      id="reg-sec-a-field"
                      type="text"
                      required
                      placeholder="Your secret answer"
                      value={regSecurityAnswer}
                      onChange={(e) => setRegSecurityAnswer(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-foreground" htmlFor="reg-password-field">
                    Password
                  </label>
                  <div className="relative flex items-center group">
                    <Lock size={14} className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      id="reg-password-field"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {regPassword && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden flex gap-1">
                        <div
                          className={`h-full transition-all ${
                            passStrength.score >= 1 ? passStrength.color : 'bg-transparent'
                          }`}
                          style={{ width: '33.3%' }}
                        />
                        <div
                          className={`h-full transition-all ${
                            passStrength.score >= 2 ? passStrength.color : 'bg-transparent'
                          }`}
                          style={{ width: '33.3%' }}
                        />
                        <div
                          className={`h-full transition-all ${
                            passStrength.score >= 3 ? passStrength.color : 'bg-transparent'
                          }`}
                          style={{ width: '33.3%' }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {passStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-foreground" htmlFor="reg-conf-pass-field">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center group">
                    <Lock size={14} className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      id="reg-conf-pass-field"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || isSuccess}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-1"
                >
                  {isSuccess ? (
                    <span className="flex items-center gap-1.5 font-bold">
                      <Check size={15} className="stroke-[3]" />
                      Account Created
                    </span>
                  ) : loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      CREATE ACCOUNT
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Mobile Tab Switcher */}
              <div className="md:hidden pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(false)}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. THE OVERLAY CONTAINER (Slides Left on Sign Up, Right on Sign In)
              ========================================================================= */}
          <div
            className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-40 ${
              rightPanelActive ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {/* The Inner Double-Width Gradient Panel */}
            <div
              className={`relative -left-full h-full w-[200%] bg-gradient-to-br from-primary via-[hsl(15_82%_53%)] to-[hsl(38_92%_50%)] text-white transition-transform duration-700 ease-in-out shadow-2xl ${
                rightPanelActive ? 'translate-x-1/2' : 'translate-x-0'
              }`}
            >
              {/* Decorative Floating Geometry & Nodes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-black/15 blur-2xl" />
                <div className="absolute top-1/3 left-1/4 h-56 w-56 rounded-full bg-white/5 blur-xl" />

                {/* Floating Doc & Knowledge Icons */}
                <div className="absolute top-16 left-12 rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/20 shadow-lg transform -rotate-6">
                  <FileText size={26} className="text-white/85" />
                </div>
                <div className="absolute bottom-16 right-12 rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/20 shadow-lg transform rotate-12">
                  <BrainCircuit size={26} className="text-white/85" />
                </div>
              </div>

              {/* OVERLAY LEFT PANEL (Shows when Sign Up is active, on the Left 50% of the screen) */}
              <div
                className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center transition-transform duration-700 ease-in-out ${
                  rightPanelActive ? 'translate-x-0' : '-translate-x-1/5'
                }`}
              >
                <div className="relative z-10 max-w-sm space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white shadow-inner border border-white/20">
                    <BookOpen size={28} className="stroke-[2.5]" />
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Welcome Back!
                  </h2>

                  <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                    To keep connected with your study notes and personalized quizzes, please sign in with your personal info.
                  </p>

                  <div className="pt-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleAuthMode(false)}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-9 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-all shadow-lg hover:shadow-white/20 cursor-pointer"
                    >
                      <LogIn size={15} />
                      <span>SIGN IN</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* OVERLAY RIGHT PANEL (Shows when Sign In is active, on the Right 50% of the screen) */}
              <div
                className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center transition-transform duration-700 ease-in-out ${
                  rightPanelActive ? 'translate-x-1/5' : 'translate-x-0'
                }`}
              >
                <div className="relative z-10 max-w-sm space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white shadow-inner border border-white/20">
                    <BrainCircuit size={28} className="stroke-[2.5]" />
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Hello, Friend!
                  </h2>

                  <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                    Enter your personal details and start your journey with Qzi AI to master any document.
                  </p>

                  <div className="pt-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleAuthMode(true)}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-9 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-all shadow-lg hover:shadow-white/20 cursor-pointer"
                    >
                      <UserPlus size={15} />
                      <span>SIGN UP</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Avatar Customizer Dialog Modal for Registration Screen */}
      <AvatarCustomizerModal
        open={isAuthAvatarModalOpen}
        onOpenChange={setIsAuthAvatarModalOpen}
        username={regUsername || 'new_user'}
      />

      {/* Clean Minimal Trust Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono-ui text-xs">
            Qzi AI © 2026 · AI-Powered Document Intelligence & Active Recall
          </span>
        </div>
      </footer>
    </div>
  );
}
