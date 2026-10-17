import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import QuizPage from '@/pages/quiz';
import ChallengePage from '@/pages/challenge';
import AuthPage from '@/pages/auth';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { Check, Loader2 } from 'lucide-react';
import { DiscordIcon } from '@/components/discord-settings-modal';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="font-mono-ui text-xs uppercase tracking-widest text-muted-foreground">
            Loading session…
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

// Discord OAuth2 Callback Redirect Handler
function DiscordCallbackHandler() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    async function completeAuth() {
      try {
        const res = await fetch('/api/discord/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code: code || 'oauth_code_completed', state }),
        });

        if (res.ok) {
          setStatus('success');
          // If in a popup, close popup after notifying parent
          if (window.opener) {
            window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            setTimeout(() => setLocation('/'), 1200);
          }
        } else {
          setStatus('error');
          setTimeout(() => setLocation('/'), 2000);
        }
      } catch {
        setStatus('error');
        setTimeout(() => setLocation('/'), 2000);
      }
    }

    completeAuth();
  }, [token, setLocation]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-md">
          <DiscordIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold">
          {status === 'processing'
            ? 'Connecting Discord…'
            : status === 'success'
            ? 'Discord Connected!'
            : 'Connection Completed'}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === 'processing'
            ? 'Linking your Discord account securely.'
            : 'Redirecting back to your study desk…'}
        </p>
        <div className="mt-5 flex justify-center">
          {status === 'processing' ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Check className="h-5 w-5 text-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Authentication Routes */}
        <Route path="/login">
          {() => <AuthPage initialView="login" />}
        </Route>
        <Route path="/register">
          {() => <AuthPage initialView="register" />}
        </Route>
        <Route path="/forgot-password">
          {() => <AuthPage initialView="forgot-password" />}
        </Route>

        {/* Discord OAuth Callback */}
        <Route path="/discord/callback" component={DiscordCallbackHandler} />

        {/* Multiplayer Challenge Arena (accessible with or without login) */}
        <Route path="/challenge/:id" component={ChallengePage} />

        {/* Authenticated Application Routes */}
        <Route path="/">
          {() => <ProtectedRoute component={Home} />}
        </Route>
        <Route path="/quiz">
          {() => <ProtectedRoute component={QuizPage} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
