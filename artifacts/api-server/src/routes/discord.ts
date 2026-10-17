import { Router, type Request, type Response, type IRouter } from "express";
import crypto from "node:crypto";
import {
  getDiscordConfig,
  DISCORD_CONFIG,
  discordConnections,
  discordServers,
  quizChallenges,
  challengeParticipants,
  generateOAuthState,
  verifyOAuthState,
  getDiscordOAuthUrl,
  exchangeDiscordCode,
  fetchDiscordUser,
  buildChallengeEmbed,
  buildLeaderboardEmbed,
  buildAchievementEmbed,
  buildDailyChallengeEmbed,
  sendDiscordNotification,
  type StoredDiscordConnection,
  type StoredDiscordServer,
  type StoredQuizChallenge,
  type StoredChallengeParticipant,
  type ChallengeQuestion,
} from "../lib/discord";
import { getUserIdFromRequest, getUserById } from "./auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Helper to get client origin
function getOrigin(req: Request): string {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "http";
  return process.env.PUBLIC_APP_URL || `${protocol}://${host}`;
}

// 1. GET /api/discord/auth-url
router.get("/discord/auth-url", (req: Request, res: Response): void => {
  try {
    const userId = getUserIdFromRequest(req) || "guest_user";
    const state = generateOAuthState(userId);
    const cfg = getDiscordConfig();
    const redirectUri = (req.query.redirect_uri as string) || cfg.REDIRECT_URI;
    const authUrl = getDiscordOAuthUrl(state, redirectUri);

    res.json({
      authUrl,
      state,
      clientId: cfg.CLIENT_ID,
      scopes: cfg.SCOPES,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error creating Discord auth URL");
    res.status(500).json({ error: "Failed to initialize Discord authorization" });
    return;
  }
});

// 2. POST /api/discord/callback
router.post("/discord/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, redirectUri } = req.body;
    let userId = getUserIdFromRequest(req);

    if (!userId && state) {
      const stateUserId = verifyOAuthState(state);
      if (stateUserId && stateUserId !== "guest_user") {
        userId = stateUserId;
      }
    }

    if (!userId) {
      userId = "usr_demo_1001"; // Fallback to active demo account
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    const tokenData = await exchangeDiscordCode(code, redirectUri);
    if (!tokenData) {
      res.status(400).json({ error: "Failed to exchange Discord authorization code" });
      return;
    }

    const discordUser = await fetchDiscordUser(tokenData.accessToken);
    if (!discordUser) {
      res.status(400).json({ error: "Failed to fetch Discord user profile" });
      return;
    }

    const now = new Date().toISOString();
    const connection: StoredDiscordConnection = {
      id: `dcon_${crypto.randomBytes(8).toString("hex")}`,
      userId,
      discordUserId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: discordUser.avatar,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      studyRemindersEnabled: true,
      weakTopicInsightsEnabled: true,
      connectedAt: now,
      updatedAt: now,
    };

    discordConnections.set(userId, connection);
    logger.info({ userId, discordUser: discordUser.username }, "Discord account connected successfully");

    res.json({
      message: "Discord connected successfully",
      connection: {
        id: connection.id,
        discordUserId: connection.discordUserId,
        discordUsername: connection.discordUsername,
        discordAvatar: connection.discordAvatar,
        studyRemindersEnabled: connection.studyRemindersEnabled,
        weakTopicInsightsEnabled: connection.weakTopicInsightsEnabled,
        connectedAt: connection.connectedAt,
      },
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error processing Discord OAuth callback");
    res.status(500).json({ error: "Failed to complete Discord authorization" });
    return;
  }
});

// 3. GET /api/discord/status
router.get("/discord/status", (req: Request, res: Response): void => {
  try {
    const userId = getUserIdFromRequest(req) || "usr_demo_1001";
    const connection = discordConnections.get(userId);

    if (!connection) {
      res.json({
        isConnected: false,
        discordUser: null,
      });
      return;
    }

    res.json({
      isConnected: true,
      discordUser: {
        id: connection.id,
        discordUserId: connection.discordUserId,
        discordUsername: connection.discordUsername,
        discordAvatar: connection.discordAvatar,
        studyRemindersEnabled: connection.studyRemindersEnabled,
        weakTopicInsightsEnabled: connection.weakTopicInsightsEnabled,
        connectedAt: connection.connectedAt,
      },
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error retrieving Discord status");
    res.status(500).json({ error: "Failed to retrieve Discord status" });
    return;
  }
});

// 4. POST /api/discord/disconnect
router.post("/discord/disconnect", (req: Request, res: Response): void => {
  try {
    const userId = getUserIdFromRequest(req) || "usr_demo_1001";
    discordConnections.delete(userId);
    logger.info({ userId }, "Discord connection disconnected");

    res.json({
      message: "Discord disconnected successfully",
      isConnected: false,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error disconnecting Discord");
    res.status(500).json({ error: "Failed to disconnect Discord" });
    return;
  }
});

// 5. GET /api/discord/preferences & PUT /api/discord/preferences
router.get("/discord/preferences", (req: Request, res: Response): void => {
  const userId = getUserIdFromRequest(req) || "usr_demo_1001";
  const connection = discordConnections.get(userId);

  res.json({
    studyRemindersEnabled: connection?.studyRemindersEnabled ?? true,
    weakTopicInsightsEnabled: connection?.weakTopicInsightsEnabled ?? true,
  });
  return;
});

router.put("/discord/preferences", (req: Request, res: Response): void => {
  const userId = getUserIdFromRequest(req) || "usr_demo_1001";
  const connection = discordConnections.get(userId);

  if (!connection) {
    res.status(404).json({ error: "Discord is not connected for this account" });
    return;
  }

  const { studyRemindersEnabled, weakTopicInsightsEnabled } = req.body;
  if (typeof studyRemindersEnabled === "boolean") {
    connection.studyRemindersEnabled = studyRemindersEnabled;
  }
  if (typeof weakTopicInsightsEnabled === "boolean") {
    connection.weakTopicInsightsEnabled = weakTopicInsightsEnabled;
  }
  connection.updatedAt = new Date().toISOString();

  res.json({
    message: "Preferences updated",
    studyRemindersEnabled: connection.studyRemindersEnabled,
    weakTopicInsightsEnabled: connection.weakTopicInsightsEnabled,
  });
  return;
});

// 6. GET /api/discord/servers & POST /api/discord/servers/config
router.get("/discord/servers", (_req: Request, res: Response): void => {
  const servers = Array.from(discordServers.values());
  res.json({ servers });
  return;
});

router.post("/discord/servers/config", (req: Request, res: Response): void => {
  try {
    const userId = getUserIdFromRequest(req) || "usr_demo_1001";
    const {
      guildId,
      guildName,
      channelId,
      channelName,
      dailyChallengeEnabled,
      achievementEnabled,
      reminderEnabled,
      preferredTopic,
      difficulty,
      webhookUrl,
    } = req.body;

    if (!guildId || !channelId) {
      res.status(400).json({ error: "Guild ID and Channel ID are required" });
      return;
    }

    const now = new Date().toISOString();
    const existing = discordServers.get(guildId);

    const server: StoredDiscordServer = {
      id: existing?.id || `srv_${crypto.randomBytes(6).toString("hex")}`,
      guildId,
      guildName: guildName || existing?.guildName || "Study Community Server",
      guildIcon: existing?.guildIcon || null,
      channelId,
      channelName: channelName || "daily-quiz",
      connectedByUserId: userId,
      dailyChallengeEnabled: dailyChallengeEnabled ?? true,
      achievementEnabled: achievementEnabled ?? true,
      reminderEnabled: reminderEnabled ?? true,
      preferredTopic: preferredTopic || "Active Recall & Computer Science",
      difficulty: difficulty || "challenge",
      webhookUrl: webhookUrl || existing?.webhookUrl,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    discordServers.set(guildId, server);
    logger.info({ guildId, channelId }, "Discord server settings saved");

    res.json({
      message: "Server configuration saved successfully",
      server,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error updating server configuration");
    res.status(500).json({ error: "Failed to save server configuration" });
    return;
  }
});

// 7. POST /api/discord/challenge/create
router.post("/discord/challenge/create", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req) || "usr_demo_1001";
    const user = getUserById(userId);
    const { topic, difficulty, timeLimitSeconds, questions, sourceFileName, postToDiscord, channelId } =
      req.body;

    if (!topic || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "Topic and at least 1 question are required" });
      return;
    }

    const challengeId = `ch_${crypto.randomBytes(6).toString("hex")}`;
    const creatorName = user?.name || user?.username || "Study Host";
    const parsedQuestions: ChallengeQuestion[] = questions.map((q: any, idx: number) => ({
      id: q.id || `ch-q-${idx + 1}-${Date.now().toString(36)}`,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex ?? 0,
      explanation: q.explanation || "From source study notes.",
    }));

    const challenge: StoredQuizChallenge = {
      id: challengeId,
      creatorUserId: userId,
      creatorUsername: creatorName,
      topic: topic.trim(),
      difficulty: difficulty || "challenge",
      questionCount: parsedQuestions.length,
      timeLimitSeconds: timeLimitSeconds || parsedQuestions.length * 30,
      questions: parsedQuestions,
      sourceFileName: sourceFileName || "Notes",
      createdAt: new Date().toISOString(),
    };

    quizChallenges.set(challengeId, challenge);
    challengeParticipants.set(challengeId, []);

    const origin = getOrigin(req);
    const challengeUrl = `${origin}/challenge/${challengeId}`;
    const embedPayload = buildChallengeEmbed(challenge, origin);

    let discordPostStatus = { posted: false, simulated: true };
    if (postToDiscord) {
      const targetChannel = channelId || Array.from(discordServers.values())[0]?.channelId;
      const targetWebhook = Array.from(discordServers.values())[0]?.webhookUrl;
      const dispatchResult = await sendDiscordNotification(embedPayload, targetWebhook, targetChannel);
      discordPostStatus = { posted: dispatchResult.success, simulated: Boolean(dispatchResult.simulated) };
    }

    logger.info({ challengeId, topic }, "Quiz Challenge created");

    res.status(201).json({
      challengeId,
      challengeUrl,
      challenge,
      discordPostStatus,
      embedPreview: embedPayload,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error creating quiz challenge");
    res.status(500).json({ error: "Failed to create quiz challenge" });
    return;
  }
});

// 8. GET /api/discord/challenge/:id
router.get("/discord/challenge/:id", (req: Request, res: Response): void => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId || "");
    const challenge = quizChallenges.get(id);

    if (!challenge) {
      res.status(404).json({ error: "Challenge not found or has expired" });
      return;
    }

    const participants = challengeParticipants.get(id) || [];
    const sortedLeaderboard = [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });

    res.json({
      challenge,
      leaderboard: sortedLeaderboard,
      totalParticipants: participants.length,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error fetching challenge");
    res.status(500).json({ error: "Failed to retrieve challenge" });
    return;
  }
});

// 9. POST /api/discord/challenge/:id/submit
router.post("/discord/challenge/:id/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId || "");
    const challenge = quizChallenges.get(id);

    if (!challenge) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const userId = getUserIdFromRequest(req);
    const user = userId ? getUserById(userId) : null;
    const userDiscordConn = userId ? discordConnections.get(userId) : null;

    const { username, score, completionTimeSeconds, postResultsToDiscord } = req.body;

    const finalUsername =
      username ||
      userDiscordConn?.discordUsername ||
      user?.name ||
      user?.username ||
      `Challenger_${Math.floor(100 + Math.random() * 900)}`;

    const total = challenge.questions.length;
    const finalScore = typeof score === "number" ? Math.min(total, Math.max(0, score)) : 0;
    const percentage = total ? Math.round((finalScore / total) * 100) : 0;
    const duration = typeof completionTimeSeconds === "number" ? completionTimeSeconds : 30;

    const participant: StoredChallengeParticipant = {
      id: `part_${crypto.randomBytes(6).toString("hex")}`,
      challengeId: id,
      userId: userId || undefined,
      username: finalUsername,
      discordUserId: userDiscordConn?.discordUserId,
      discordUsername: userDiscordConn?.discordUsername,
      avatarUrl: user?.avatarUrl,
      score: finalScore,
      totalQuestions: total,
      percentage,
      completionTimeSeconds: duration,
      completedAt: new Date().toISOString(),
    };

    const currentList = challengeParticipants.get(id) || [];
    currentList.push(participant);
    challengeParticipants.set(id, currentList);

    const sortedLeaderboard = [...currentList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });

    const userRank = sortedLeaderboard.findIndex((p) => p.id === participant.id) + 1;

    // Optionally post leaderboard update to Discord
    const origin = getOrigin(req);
    const leaderboardPayload = buildLeaderboardEmbed(challenge, sortedLeaderboard, origin);

    if (postResultsToDiscord) {
      const targetServer = Array.from(discordServers.values())[0];
      await sendDiscordNotification(leaderboardPayload, targetServer?.webhookUrl, targetServer?.channelId);
    }

    logger.info({ challengeId: id, username: finalUsername, score: finalScore, rank: userRank }, "Challenge attempt submitted");

    res.json({
      message: "Score submitted successfully",
      participant,
      rank: userRank,
      totalParticipants: sortedLeaderboard.length,
      leaderboard: sortedLeaderboard,
      embedPreview: leaderboardPayload,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error submitting challenge score");
    res.status(500).json({ error: "Failed to submit challenge score" });
    return;
  }
});

// 10. POST /api/discord/share-achievement
router.post("/api/discord/share-achievement", async (req: Request, res: Response): Promise<void> => {
  return handleShareAchievement(req, res);
});
router.post("/discord/share-achievement", async (req: Request, res: Response): Promise<void> => {
  return handleShareAchievement(req, res);
});

async function handleShareAchievement(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromRequest(req) || "usr_demo_1001";
    const user = getUserById(userId);
    const userDiscord = discordConnections.get(userId);

    const { title, topic, score, total, percentage, streak, level, badgeTitle, badgeIcon } = req.body;

    const origin = getOrigin(req);
    const achievementPayload = buildAchievementEmbed(
      user?.name || user?.username || "Learner",
      userDiscord?.discordUsername,
      {
        title: title || "Quiz Master",
        topic: topic || "Active Recall Session",
        score: score ?? 5,
        total: total ?? 5,
        percentage: percentage ?? 100,
        streak: streak ?? 1,
        level: level ?? 1,
        badgeTitle,
        badgeIcon,
      },
      origin,
    );

    const server = Array.from(discordServers.values())[0];
    const result = await sendDiscordNotification(achievementPayload, server?.webhookUrl, server?.channelId);

    logger.info({ userId, topic, percentage }, "Achievement shared to Discord");

    res.json({
      message: "Achievement shared to Discord!",
      simulated: result.simulated,
      embedPreview: achievementPayload,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error sharing achievement to Discord");
    res.status(500).json({ error: "Failed to share achievement" });
    return;
  }
}

// 11. POST /api/discord/daily-challenge/trigger
router.post("/discord/daily-challenge/trigger", async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;
    const selectedTopic = topic || "Active Recall & Algorithm Design";
    const origin = getOrigin(req);
    const dailyChallengeUrl = `${origin}/challenge/ch_dsa_arrays_2026`;

    const embedPayload = buildDailyChallengeEmbed(selectedTopic, 5, dailyChallengeUrl);
    const server = Array.from(discordServers.values())[0];
    const dispatch = await sendDiscordNotification(embedPayload, server?.webhookUrl, server?.channelId);

    res.json({
      message: "Daily challenge broadcast triggered",
      simulated: dispatch.simulated,
      embedPreview: embedPayload,
    });
    return;
  } catch (error) {
    logger.error({ error }, "Error triggering daily challenge");
    res.status(500).json({ error: "Failed to broadcast daily challenge" });
    return;
  }
});

// 12. POST /api/discord/interactions (Official Discord Slash Commands Handler)
router.post("/discord/interactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body;

    // Discord Ping (type 1)
    if (type === 1) {
      res.json({ type: 1 });
      return;
    }

    // Slash command (type 2)
    if (type === 2) {
      const commandName = data?.name;
      const options = data?.options || [];
      const origin = getOrigin(req);

      // Handle /quiz topic:DSA difficulty:medium questions:5
      if (commandName === "quiz") {
        const topic = options.find((o: any) => o.name === "topic")?.value || "Active Recall & Computer Science";
        const difficulty = options.find((o: any) => o.name === "difficulty")?.value || "medium";
        const questions = options.find((o: any) => o.name === "questions")?.value || 5;

        res.json({
          type: 4, // ChannelMessageWithSource
          data: {
            embeds: [
              {
                title: "🧠 DOCQUIZ QUIZ",
                description: `**${topic}**\n${questions} Questions\nDifficulty: **${difficulty.toUpperCase()}**`,
                color: 0x5865f2,
                footer: { text: "Click below to start your active recall quiz in DocQuiz AI" },
              },
            ],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "⚡ Start Quiz",
                    url: `${origin}/quiz`,
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Handle /ask question:"..."
      if (commandName === "ask") {
        const questionText = options.find((o: any) => o.name === "question")?.value || "Explain active recall";

        res.json({
          type: 4,
          data: {
            embeds: [
              {
                title: `💡 DocQuiz AI Study Assistant`,
                description: `**Q: ${questionText}**\n\n*Explanation*:\n• **Core Concept**: Active recall forces retrieval of information from memory rather than passive re-reading.\n• **Why it works**: Strengthens neural retrieval pathways and enhances long-term retention.\n• **Study Tip**: Test yourself on 5 quick questions on Qzi AI!`,
                color: 0x57f287,
                footer: { text: "DocQuiz AI · Tutor inside Discord" },
              },
            ],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "Open Qzi AI Study Desk",
                    url: origin,
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Fallback command
      res.json({
        type: 4,
        data: {
          content: `DocQuiz AI Bot is active! Try \`/quiz\` or \`/ask\`. Visit [DocQuiz AI](${origin}) to study!`,
        },
      });
      return;
    }

    res.json({ type: 1 });
    return;
  } catch (error) {
    logger.error({ error }, "Error handling Discord interaction");
    res.status(500).json({ error: "Failed to handle Discord interaction" });
    return;
  }
});

export default router;
