export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  securityQuestion: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: AuthUser;
  error?: string;
}

const API_BASE = '/api/auth';
const LOCAL_USERS_KEY = 'docquiz-ai.local_users.v2';

interface LocalUserRecord extends AuthUser {
  password?: string;
  securityAnswer?: string;
}

function getLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      // Seed default demo user
      const defaultUsers: LocalUserRecord[] = [
        {
          id: 'usr_demo_1001',
          username: 'alex_morgan',
          name: 'Alex Morgan',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          securityQuestion: 'What is your favorite book?',
          securityAnswer: 'The Hobbit',
          createdAt: new Date().toISOString(),
          password: 'DocQuiz2026!',
        },
      ];
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUserRecord[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export const authService = {
  async register(params: {
    username: string;
    password: string;
    confirmPassword?: string;
    securityQuestion: string;
    securityAnswer: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const { username, password, confirmPassword, securityQuestion, securityAnswer } = params;

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          confirmPassword,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        }),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 409 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('already exists') ||
          err.message.includes('characters') ||
          err.message.includes('match') ||
          err.message.includes('security'))
      ) {
        throw err;
      }
    }

    // Client-side fallback store
    const users = getLocalUsers();
    const cleanUsername = username.trim();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('An account with this username already exists. Please choose a different username.');
    }

    const newUser: LocalUserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: cleanUsername,
      name: cleanUsername,
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      createdAt: new Date().toISOString(),
      password,
    };

    users.push(newUser);
    saveLocalUsers(users);

    return {
      token: `dqa_${Date.now()}`,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        securityQuestion: newUser.securityQuestion,
        createdAt: newUser.createdAt,
      },
    };
  },

  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 401 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Incorrect username or password.');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Incorrect') || err.message.includes('required'))) {
        throw err;
      }
    }

    // Client fallback
    const users = getLocalUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername && u.password === password);

    if (!user) {
      throw new Error('Incorrect username or password. Please check your credentials.');
    }

    return {
      token: `dqa_${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        securityQuestion: user.securityQuestion,
        createdAt: user.createdAt,
      },
    };
  },

  async getSecurityQuestion(username: string): Promise<{ username: string; securityQuestion: string }> {
    try {
      const res = await fetch(`${API_BASE}/get-security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 404 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No account found with this username.');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('No account') || err.message.includes('username'))) {
        throw err;
      }
    }

    // Client fallback
    const users = getLocalUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      throw new Error('No account found with this username. Please check your spelling.');
    }

    return {
      username: user.username,
      securityQuestion: user.securityQuestion,
    };
  },

  async resetPassword(params: {
    username: string;
    securityAnswer: string;
    newPassword: string;
    confirmNewPassword?: string;
  }): Promise<{ message: string; token: string; user: AuthUser }> {
    const { username, securityAnswer, newPassword, confirmNewPassword } = params;

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          securityAnswer: securityAnswer.trim(),
          newPassword,
          confirmNewPassword,
        }),
      });

      if (res.ok) {
        return await res.json();
      }

      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to reset password.');
    } catch (err: any) {
      if (err.message && (err.message.includes('Incorrect') || err.message.includes('match') || err.message.includes('characters'))) {
        throw err;
      }
    }

    // Client fallback
    const users = getLocalUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      throw new Error('Account not found.');
    }

    if (
      user.securityAnswer &&
      user.securityAnswer.trim().toLowerCase() !== securityAnswer.trim().toLowerCase()
    ) {
      throw new Error('Incorrect security answer. Please check and try again.');
    }

    user.password = newPassword;
    saveLocalUsers(users);

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      securityQuestion: user.securityQuestion,
      createdAt: user.createdAt,
    };

    return {
      message: 'Password reset successful!',
      token: `dqa_${Date.now()}`,
      user: authUser,
    };
  },

  async getMe(token: string): Promise<{ user: AuthUser }> {
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const users = getLocalUsers();
    const user = users[0];
    if (user) {
      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          securityQuestion: user.securityQuestion,
          createdAt: user.createdAt,
        },
      };
    }
    throw new Error('User not found');
  },

  async logout(token?: string | null): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore network errors on logout
    }
  },
};
