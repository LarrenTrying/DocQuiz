import crypto from "node:crypto";
import { logger } from "./logger";

export function getDiscordConfig() {
  let clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
  const botToken = (process.env.DISCORD_BOT_TOKEN || "").trim();
  const redirectUri = (process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/discord/callback").trim();

  // If clientId is missing or placeholder but botToken is provided, extract clientId from the token's base64 first segment
  if ((!clientId || clientId === "123456789012345678") && botToken) {
    try {
      const firstPart = botToken.split(".")[0];
      const decoded = Buffer.from(firstPart, "base64").toString("utf8");
      if (/^\d{17,20}$/.test(decoded)) {
        clientId = decoded;
      }
    } catch {}
  }

  if (!clientId) {
    clientId = "1552335820239798342";
  }

  return {
    CLIENT_ID: clientId,
    CLIENT_SECRET: clientSecret,
    BOT_TOKEN: botToken,
    REDIRECT_URI: redirectUri,
    API_ENDPOINT: "https://discord.com/api/v10",
    SCOPES: ["identify", "guilds"],
  };
}

export const DISCORD_CONFIG = getDiscordConfig();


export interface StoredDiscordConnection {
  id: string;
  userId: string;
  discordUserId: string;
  discordUsername: string;
  discordAvatar: string | null;
  accessToken?: string;
  refreshToken?: string;
  studyRemindersEnabled: boolean;
  weakTopicInsightsEnabled: boolean;
  connectedAt: string;
  updatedAt: string;
}

export interface StoredDiscordServer {
  id: string;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  channelId: string;
  channelName: string;
  connectedByUserId: string;
  dailyChallengeEnabled: boolean;
  achievementEnabled: boolean;
  reminderEnabled: boolean;
  preferredTopic: string;
  difficulty: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface StoredQuizChallenge {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  timeLimitSeconds: number;
  questions: ChallengeQuestion[];
  sourceFileName?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface StoredChallengeParticipant {
  id: string;
  challengeId: string;
  userId?: string;
  username: string;
  discordUserId?: string;
  discordUsername?: string;
  avatarUrl?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionTimeSeconds: number;
  completedAt: string;
}

// In-Memory Persistent Store (with seed demo records)
export const discordConnections = new Map<string, StoredDiscordConnection>(); // userId -> connection
export const discordServers = new Map<string, StoredDiscordServer>(); // guildId -> server
export const quizChallenges = new Map<string, StoredQuizChallenge>(); // challengeId -> challenge
export const challengeParticipants = new Map<string, StoredChallengeParticipant[]>(); // challengeId -> participants
export const oauthStates = new Map<string, { userId: string; createdAt: number }>(); // state -> info

// Seed default demo servers and a sample challenge
(function seedDiscordDefaults() {
  const sampleChallengeId = "ch_dsa_arrays_2026";
  const sampleQuestions: ChallengeQuestion[] = [
    {
      id: "ch-q1",
      question: "What is the average time complexity of accessing an element by index in a contiguous array?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctAnswerIndex: 0,
      explanation: "Arrays allow random access via pointer arithmetic in constant time O(1).",
    },
    {
      id: "ch-q2",
      question: "Which algorithmic technique is most effective for finding a subarray with maximum sum in O(n) time?",
      options: ["Kadane's Algorithm", "Dijkstra's Algorithm", "Binary Search", "Floyd-Warshall"],
      correctAnswerIndex: 0,
      explanation: "Kadane's algorithm scans the array while keeping track of the maximum sum ending at the current position.",
    },
    {
      id: "ch-q3",
      question: "When reversing an array in-place, how many swaps are performed on an array of length N?",
      options: ["floor(N / 2)", "N", "N - 1", "2 * N"],
      correctAnswerIndex: 0,
      explanation: "Two pointers move inward from both ends, swapping elements until they meet in the middle (floor(N/2) swaps).",
    },
    {
      id: "ch-q4",
      question: "What is the primary spatial advantage of static arrays over linked lists?",
      options: [
        "Better cache locality and zero pointer overhead",
        "Dynamic resizing without reallocation",
        "O(1) arbitrary insertion at the beginning",
        "Non-contiguous memory allocation",
      ],
      correctAnswerIndex: 0,
      explanation: "Contiguous memory layout provides CPU cache prefetching benefits and does not require node pointers.",
    },
    {
      id: "ch-q5",
      question: "In the Two-Pointer technique on a sorted array, what determines how you advance pointers?",
      options: [
        "Comparing the sum/difference to target value",
        "The parity (odd/even) of the index",
        "Random coin toss",
        "Swapping without comparison",
      ],
      correctAnswerIndex: 0,
      explanation: "If the current sum is less than target, advance the left pointer; if greater, decrement the right pointer.",
    },
  ];

  quizChallenges.set(sampleChallengeId, {
    id: sampleChallengeId,
    creatorUserId: "usr_demo_1001",
    creatorUsername: "Alex Morgan",
    topic: "DSA — Arrays & Two Pointers",
    difficulty: "challenge",
    questionCount: 5,
    timeLimitSeconds: 150,
    questions: sampleQuestions,
    sourceFileName: "DSA-Mastery-Notes.pdf",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  });

  challengeParticipants.set(sampleChallengeId, [
    {
      id: "part_1",
      challengeId: sampleChallengeId,
      userId: "usr_alex",
      username: "Alex Morgan",
      discordUsername: "alex_morgan#1001",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      score: 5,
      totalQuestions: 5,
      percentage: 100,
      completionTimeSeconds: 48,
      completedAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "part_2",
      challengeId: sampleChallengeId,
      username: "Devin_CS",
      discordUsername: "devin_coder",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=devin",
      score: 4,
      totalQuestions: 5,
      percentage: 80,
      completionTimeSeconds: 64,
      completedAt: new Date(Date.now() - 2500000).toISOString(),
    },
    {
      id: "part_3",
      challengeId: sampleChallengeId,
      username: "Maya Lin",
      discordUsername: "maya_lin",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=maya",
      score: 4,
      totalQuestions: 5,
      percentage: 80,
      completionTimeSeconds: 79,
      completedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "part_4",
      challengeId: sampleChallengeId,
      username: "Jordan Tech",
      discordUsername: "jordan_ai",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=jordan",
      score: 3,
      totalQuestions: 5,
      percentage: 60,
      completionTimeSeconds: 92,
      completedAt: new Date(Date.now() - 900000).toISOString(),
    },
  ]);

  // Seed a sample Discord study server
  const sampleGuildId = "guild_study_hall_99";
  discordServers.set(sampleGuildId, {
    id: "srv_99",
    guildId: sampleGuildId,
    guildName: "College Study Hall 🎓",
    guildIcon: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80",
    channelId: "123456789012345678",
    channelName: "daily-quiz",
    connectedByUserId: "usr_demo_1001",
    dailyChallengeEnabled: true,
    achievementEnabled: true,
    reminderEnabled: true,
    preferredTopic: "Computer Science & Active Recall",
    difficulty: "challenge",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
})();

// OAuth State Generation & Verification
export function generateOAuthState(userId: string): string {
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, { userId, createdAt: Date.now() });

  // Clean old states older than 15 mins
  const expiry = Date.now() - 15 * 60 * 1000;
  for (const [k, v] of oauthStates.entries()) {
    if (v.createdAt < expiry) oauthStates.delete(k);
  }

  return state;
}

export function verifyOAuthState(state: string): string | null {
  const entry = oauthStates.get(state);
  if (!entry) return null;
  oauthStates.delete(state);
  if (Date.now() - entry.createdAt > 15 * 60 * 1000) return null;
  return entry.userId;
}

// Generate Discord OAuth2 Authorization URL
export function getDiscordOAuthUrl(state: string, redirectUri?: string): string {
  const cfg = getDiscordConfig();
  const targetRedirect = redirectUri || cfg.REDIRECT_URI;
  const params = new URLSearchParams({
    client_id: cfg.CLIENT_ID,
    redirect_uri: targetRedirect,
    response_type: "code",
    scope: cfg.SCOPES.join(" "),
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Exchange Code for Access Token
export async function exchangeDiscordCode(code: string, redirectUri?: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  const cfg = getDiscordConfig();

  if (
    code.startsWith("mock_") ||
    code.startsWith("test_") ||
    code === "oauth_code_completed" ||
    !cfg.CLIENT_SECRET
  ) {
    logger.info({ code }, "Simulating Discord OAuth token for mock/test authorization code");
    return {
      accessToken: `mock_discord_access_${crypto.randomBytes(16).toString("hex")}`,
      refreshToken: `mock_discord_refresh_${crypto.randomBytes(16).toString("hex")}`,
      expiresIn: 604800,
    };
  }

  try {
    const targetRedirect = redirectUri || cfg.REDIRECT_URI;
    const body = new URLSearchParams({
      client_id: cfg.CLIENT_ID,
      client_secret: cfg.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: targetRedirect,
    });

    const res = await fetch(`${cfg.API_ENDPOINT}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error({ errorText, status: res.status, code }, "Failed to exchange Discord authorization code");
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    logger.error({ error }, "Error exchanging Discord OAuth code");
    return null;
  }
}

// Fetch Discord User Details
export async function fetchDiscordUser(accessToken: string): Promise<{
  id: string;
  username: string;
  avatar: string | null;
  discriminator?: string;
} | null> {
  if (accessToken.startsWith("mock_discord_access_")) {
    return {
      id: `discord_${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}`,
      username: "StudyLearner",
      avatar: null,
    };
  }

  const cfg = getDiscordConfig();
  try {
    const res = await fetch(`${cfg.API_ENDPOINT}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Failed to fetch Discord user");
      return null;
    }

    const user = (await res.json()) as {
      id: string;
      username: string;
      global_name?: string;
      avatar: string | null;
      discriminator?: string;
    };

    return {
      id: user.id,
      username: user.global_name || user.username,
      avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
      discriminator: user.discriminator,
    };
  } catch (error) {
    logger.error({ error }, "Error fetching Discord user profile");
    return null;
  }
}

// Embed Helpers
export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
  url?: string;
}

export const DISCORD_COLORS = {
  BLURPLE: 0x5865f2,
  GREEN: 0x57f287,
  YELLOW: 0xfee75c,
  FUCHSIA: 0xeb459e,
  RED: 0xed4245,
  DARK: 0x2b2d31,
  GOLD: 0xf1c40f,
};

// 1. Challenge Embed
export function buildChallengeEmbed(
  challenge: StoredQuizChallenge,
  originUrl: string,
): { embeds: DiscordEmbed[]; components: any[] } {
  const challengeUrl = `${originUrl}/challenge/${challenge.id}`;
  const timeMinutes = Math.round(challenge.timeLimitSeconds / 60) || 1;

  const embed: DiscordEmbed = {
    title: `🔥 NEW DOCQUIZ CHALLENGE`,
    description: `**${challenge.creatorUsername}** has created a **${challenge.topic}** challenge!\n\nCan you claim #1 on the leaderboard? Test your active recall right now!`,
    color: DISCORD_COLORS.BLURPLE,
    fields: [
      { name: "📋 Questions", value: `${challenge.questionCount} Questions`, inline: true },
      { name: "⏱️ Time Limit", value: `${timeMinutes} Minutes`, inline: true },
      { name: "🎯 Difficulty", value: challenge.difficulty.toUpperCase(), inline: true },
    ],
    footer: {
      text: "Qzi AI · Social Active Recall & Peer Challenges",
    },
    timestamp: new Date().toISOString(),
    url: challengeUrl,
  };

  const components = [
    {
      type: 1, // Action Row
      components: [
        {
          type: 2, // Button
          style: 5, // Link
          label: "⚡ JOIN CHALLENGE",
          url: challengeUrl,
        },
      ],
    },
  ];

  return { embeds: [embed], components };
}

// 2. Leaderboard Embed
export function buildLeaderboardEmbed(
  challenge: StoredQuizChallenge,
  participants: StoredChallengeParticipant[],
  originUrl: string,
): { embeds: DiscordEmbed[]; components: any[] } {
  const challengeUrl = `${originUrl}/challenge/${challenge.id}`;
  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.completionTimeSeconds - b.completionTimeSeconds;
  });

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const leaderboardLines = sorted.slice(0, 5).map((p, idx) => {
    const medal = medals[idx] || `${idx + 1}.`;
    const mins = Math.floor(p.completionTimeSeconds / 60);
    const secs = String(p.completionTimeSeconds % 60).padStart(2, "0");
    const displayTag = p.discordUsername ? `@${p.discordUsername}` : p.username;
    return `${medal} **${displayTag}** — ${p.score}/${p.totalQuestions} (${p.percentage}%) — ${mins}:${secs}`;
  });

  const description =
    leaderboardLines.length > 0
      ? `**${challenge.topic}** Leaderboard Standings:\n\n${leaderboardLines.join("\n")}`
      : `No participants have completed the **${challenge.topic}** challenge yet. Be the first to claim #1!`;

  const embed: DiscordEmbed = {
    title: `🏆 DOCQUIZ CHALLENGE RESULTS`,
    description,
    color: DISCORD_COLORS.GOLD,
    fields: [
      { name: "Total Challengers", value: `${sorted.length} students`, inline: true },
      { name: "Topic", value: challenge.topic, inline: true },
    ],
    footer: { text: "Qzi AI · Real-Time Challenge Leaderboard" },
    timestamp: new Date().toISOString(),
    url: challengeUrl,
  };

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "🚀 Take Challenge",
          url: challengeUrl,
        },
      ],
    },
  ];

  return { embeds: [embed], components };
}

// 3. Achievement Embed
export function buildAchievementEmbed(
  username: string,
  discordTag: string | undefined,
  achievement: {
    title: string;
    topic: string;
    score: number;
    total: number;
    percentage: number;
    streak: number;
    level: number;
    badgeTitle?: string;
    badgeIcon?: string;
  },
  originUrl: string,
): { embeds: DiscordEmbed[]; components: any[] } {
  const displayUser = discordTag ? `@${discordTag}` : `@${username}`;

  const embed: DiscordEmbed = {
    title: `🎉 ACHIEVEMENT UNLOCKED!`,
    description: `**${displayUser}** scored **${achievement.percentage}%** in **${achievement.topic}**!`,
    color: DISCORD_COLORS.GREEN,
    fields: [
      { name: "🔥 Daily Streak", value: `${achievement.streak} Days`, inline: true },
      { name: "🧠 Mastery Level", value: `Level ${achievement.level}`, inline: true },
      {
        name: "🏆 Score",
        value: `${achievement.score}/${achievement.total} (${achievement.percentage}%)`,
        inline: true,
      },
    ],
    footer: { text: "DocQuiz AI · Active Recall Mastery" },
    timestamp: new Date().toISOString(),
  };

  if (achievement.badgeTitle) {
    embed.fields?.push({
      name: "🎖️ New Badge Earned",
      value: `${achievement.badgeIcon || "🌟"} **${achievement.badgeTitle}**`,
      inline: false,
    });
  }

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "⚡ Practice Now on Qzi AI",
          url: originUrl,
        },
      ],
    },
  ];

  return { embeds: [embed], components };
}

// 4. Daily Challenge Embed
export function buildDailyChallengeEmbed(
  topic: string,
  questionCount: number,
  challengeUrl: string,
): { embeds: DiscordEmbed[]; components: any[] } {
  const embed: DiscordEmbed = {
    title: `🧠 DOCQUIZ DAILY CHALLENGE`,
    description: `Today's community active recall challenge is now live!\n\n**Topic**: ${topic}\n**Format**: ${questionCount} Multiple Choice Questions\n**Difficulty**: Medium / Standard`,
    color: DISCORD_COLORS.BLURPLE,
    fields: [
      { name: "⚡ Format", value: `${questionCount} Questions`, inline: true },
      { name: "🎯 Goal", value: "Daily Recall Streak", inline: true },
    ],
    footer: { text: "DocQuiz AI · Daily Knowledge Habit" },
    timestamp: new Date().toISOString(),
    url: challengeUrl,
  };

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "🔥 TAKE DAILY CHALLENGE",
          url: challengeUrl,
        },
      ],
    },
  ];

  return { embeds: [embed], components };
}

// 5. Send Webhook or Bot Message to Discord
export async function sendDiscordNotification(
  payload: { embeds: DiscordEmbed[]; components?: any[] },
  webhookUrl?: string,
  channelId?: string,
): Promise<{ success: boolean; simulated?: boolean; messageId?: string }> {
  // If webhook is provided
  if (webhookUrl && webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { success: true, simulated: false };
    } catch (err) {
      logger.error({ err }, "Failed to send Discord webhook message");
    }
  }

  // If bot token and channel ID are configured
  const cfg = getDiscordConfig();
  if (cfg.BOT_TOKEN && channelId) {
    try {
      const res = await fetch(`${cfg.API_ENDPOINT}/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${cfg.BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { id: string };
        return { success: true, simulated: false, messageId: data.id };
      }
    } catch (err) {
      logger.error({ err }, "Failed to send Discord bot message");
    }
  }

  // Graceful simulation mode for development/demo
  logger.info({ payload }, "Discord message simulated successfully (no live webhook/bot token configured)");
  return { success: true, simulated: true };
}
