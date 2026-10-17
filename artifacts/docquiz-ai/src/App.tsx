import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import QuizPage from '@/pages/quiz';
import HistoryPage from '@/pages/history';
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

// Discord Server Redirect Handler
function DiscordCallbackHandler() {
  useEffect(() => {
    window.location.href = 'https://discord.gg/DQqxbrrPB';
  }, []);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-md">
          <DiscordIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold">Opening Discord Server…</h2>
        <p className="mt-1 text-xs text-muted-foreground">Redirecting to https://discord.gg/DQqxbrrPB</p>
        <div className="mt-5 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#5865F2]" />
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

        {/* Discord Server Redirects */}
        <Route path="/discord" component={DiscordCallbackHandler} />
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
        <Route path="/history">
          {() => <ProtectedRoute component={HistoryPage} />}
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
