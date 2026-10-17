import { Router, type Request, type Response, type IRouter } from "express";
import crypto from "node:crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  securityQuestion: string;
  createdAt: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
  passwordSalt: string;
  securityAnswerHash: string;
  securityAnswerSalt: string;
  updatedAt: string;
}

export const VALID_SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What was your childhood nickname?",
  "What was the name of your first pet?",
  "What is your favorite book?",
  "What city were you born in?",
] as const;

// In-memory persistent user and token stores
const usersByUsername = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();
const activeTokens = new Map<string, string>(); // token -> userId

// Cryptographic PBKDF2 hashing helper
function hashSecret(value: string, salt: string): string {
  return crypto.pbkdf2Sync(value, salt, 10000, 64, "sha512").toString("hex");
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

function generateToken(): string {
  return `dqa_${crypto.randomBytes(32).toString("hex")}`;
}

function sanitizeUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`,
    securityQuestion: user.securityQuestion,
    createdAt: user.createdAt,
  };
}

// Initialize with a ready-to-test Demo User
(function seedDemoUser() {
  const pwdSalt = crypto.randomBytes(16).toString("hex");
  const ansSalt = crypto.randomBytes(16).toString("hex");

  const demoUser: StoredUser = {
    id: "usr_demo_1001",
    username: "alex_morgan",
    name: "Alex Morgan",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    securityQuestion: "What is your favorite book?",
    securityAnswerSalt: ansSalt,
    securityAnswerHash: hashSecret(normalizeAnswer("The Hobbit"), ansSalt),
    passwordSalt: pwdSalt,
    passwordHash: hashSecret("DocQuiz2026!", pwdSalt),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  usersByUsername.set(demoUser.username.toLowerCase(), demoUser);
  usersById.set(demoUser.id, demoUser);
})();

// 1. POST /api/auth/register
router.post("/auth/register", (req: Request, res: Response) => {
  try {
    const { username, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

    // Validate Username
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Username is required and must be at least 3 characters long." });
    }

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, underscores, dashes, and periods." });
    }

    const normalizedUsername = cleanUsername.toLowerCase();
    if (usersByUsername.has(normalizedUsername)) {
      return res.status(409).json({ error: "An account with this username already exists. Please choose a different username." });
    }

    // Validate Password
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match. Please re-enter your password." });
    }

    // Validate Security Question & Answer
    if (!securityQuestion || typeof securityQuestion !== "string" || securityQuestion.trim().length < 5) {
      return res.status(400).json({ error: "Please select a valid security question." });
    }

    if (!securityAnswer || typeof securityAnswer !== "string" || securityAnswer.trim().length < 2) {
      return res.status(400).json({ error: "Please provide a security answer (minimum 2 characters)." });
    }

    // Hash Password & Security Answer
    const passwordSalt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashSecret(password, passwordSalt);

    const securityAnswerSalt = crypto.randomBytes(16).toString("hex");
    const securityAnswerHash = hashSecret(normalizeAnswer(securityAnswer), securityAnswerSalt);

    const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: userId,
      username: cleanUsername,
      name: cleanUsername,
      securityQuestion: securityQuestion.trim(),
      securityAnswerHash,
      securityAnswerSalt,
      passwordHash,
      passwordSalt,
      createdAt: now,
      updatedAt: now,
    };

    usersByUsername.set(normalizedUsername, newUser);
    usersById.set(userId, newUser);

    const token = generateToken();
    activeTokens.set(token, userId);

    logger.info({ userId, username: cleanUsername }, "User registered successfully");

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    logger.error({ error }, "Error during user registration");
    return res.status(500).json({ error: "Unable to complete registration. Please try again." });
  }
});

// 2. POST /api/auth/login
router.post("/auth/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Both username and password are required." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const user = usersByUsername.get(normalizedUsername);

    if (!user || !user.passwordHash || !user.passwordSalt) {
      return res.status(401).json({ error: "Incorrect username or password. Please check your credentials." });
    }

    const hash = hashSecret(String(password), user.passwordSalt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: "Incorrect username or password. Please check your credentials." });
    }

    const token = generateToken();
    activeTokens.set(token, user.id);

    logger.info({ userId: user.id, username: user.username }, "User logged in successfully");

    return res.status(200).json({
      message: "Signed in successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error({ error }, "Error during login");
    return res.status(500).json({ error: "Unable to sign in. Please try again." });
  }
});

// 3. POST /api/auth/get-security-question (Also aliased to /api/auth/forgot-password)
router.post(["/auth/get-security-question", "/auth/forgot-password"], (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ error: "Please enter your username." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = usersByUsername.get(normalizedUsername);

    if (!user) {
      return res.status(404).json({ error: "No account found with this username. Please check your spelling or create a new account." });
    }

    return res.status(200).json({
      username: user.username,
      securityQuestion: user.securityQuestion,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching security question");
    return res.status(500).json({ error: "Unable to retrieve security question. Please try again." });
  }
});

// 4. POST /api/auth/reset-password
router.post("/auth/reset-password", (req: Request, res: Response) => {
  try {
    const { username, securityAnswer, newPassword, confirmNewPassword } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required." });
    }

    if (!securityAnswer || typeof securityAnswer !== "string") {
      return res.status(400).json({ error: "Please enter your security answer." });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "Passwords do not match. Please verify your new password." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = usersByUsername.get(normalizedUsername);

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    // Verify security answer
    const answerHash = hashSecret(normalizeAnswer(securityAnswer), user.securityAnswerSalt);
    if (answerHash !== user.securityAnswerHash) {
      return res.status(400).json({ error: "Incorrect security answer. Please check and try again." });
    }

    // Update password
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = hashSecret(newPassword, newSalt);

    user.passwordSalt = newSalt;
    user.passwordHash = newHash;
    user.updatedAt = new Date().toISOString();

    // Create new login session
    const token = generateToken();
    activeTokens.set(token, user.id);

    logger.info({ userId: user.id, username: user.username }, "Password reset successfully via security question");

    return res.status(200).json({
      message: "Password reset successful! You are now signed in.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error({ error }, "Error resetting password");
    return res.status(500).json({ error: "Unable to reset password. Please try again." });
  }
});

// 5. GET /api/auth/me
router.get("/auth/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.substring(7);
  const userId = activeTokens.get(token);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
  }

  const user = usersById.get(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  return res.status(200).json({ user: sanitizeUser(user) });
});

// 6. POST /api/auth/logout
router.post("/auth/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  return res.status(200).json({ message: "Signed out successfully" });
});

export function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  return activeTokens.get(token) || null;
}

export function getUserById(userId: string): AuthUser | null {
  const user = usersById.get(userId);
  if (!user) return null;
  return sanitizeUser(user);
}

export default router;


