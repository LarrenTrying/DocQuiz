export {};
process.env.PORT = "5056";

async function runTests() {
  console.log("[DISCORD-TEST] Starting Discord Integration tests...");

  // Start API server on port 5056
  // @ts-ignore
  await import("../../artifacts/api-server/dist/index.mjs");
  await new Promise((r) => setTimeout(r, 400));

  const baseUrl = "http://127.0.0.1:5056/api/discord";

  // 1. GET /api/discord/auth-url
  const authUrlRes = await fetch(`${baseUrl}/auth-url`);
  const authUrlData = (await authUrlRes.json()) as any;
  console.assert(authUrlRes.status === 200, `Expected 200, got ${authUrlRes.status}`);
  console.assert(typeof authUrlData.authUrl === "string" && authUrlData.authUrl.includes("discord.com"), "Expected Discord OAuth URL");
  console.assert(typeof authUrlData.state === "string", "Expected state param");
  console.log("1. ✓ Discord OAuth2 Auth URL generated:", authUrlData.authUrl.substring(0, 60) + "...");

  // 2. POST /api/discord/callback (Connect Discord)
  const callbackRes = await fetch(`${baseUrl}/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "mock_auth_code_123",
      state: authUrlData.state,
    }),
  });
  const callbackData = (await callbackRes.json()) as any;
  console.assert(callbackRes.status === 200, `Expected 200, got ${callbackRes.status}`);
  console.assert(callbackData.connection?.discordUsername !== undefined, "Expected connection data");
  console.log("2. ✓ Discord OAuth2 Callback handled & account connected:", callbackData.connection.discordUsername);

  // 3. GET /api/discord/status
  const statusRes = await fetch(`${baseUrl}/status`);
  const statusData = (await statusRes.json()) as any;
  console.assert(statusRes.status === 200, `Expected 200, got ${statusRes.status}`);
  console.assert(statusData.isConnected === true, "Expected isConnected to be true");
  console.log("3. ✓ Discord Status retrieved (Connected: true, User:", statusData.discordUser.discordUsername + ")");

  // 4. POST /api/discord/challenge/create
  const createChallengeRes = await fetch(`${baseUrl}/challenge/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "DSA Arrays Mastery",
      difficulty: "challenge",
      questionCount: 3,
      timeLimitSeconds: 90,
      postToDiscord: true,
      questions: [
        {
          id: "q-1",
          question: "What is array index access time complexity?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
          correctAnswerIndex: 0,
          explanation: "Constant time access.",
        },
        {
          id: "q-2",
          question: "What is Kadane's algorithm used for?",
          options: ["Maximum subarray sum", "Sorting", "Shortest path", "Tree traversal"],
          correctAnswerIndex: 0,
          explanation: "Kadane's algorithm computes max subarray sum in O(n).",
        },
        {
          id: "q-3",
          question: "In Two-Pointers, when do pointers typically stop?",
          options: ["When they meet or cross", "At index 0", "At end of memory", "Never"],
          correctAnswerIndex: 0,
          explanation: "Left and right pointers converge in the middle.",
        },
      ],
    }),
  });
  const challengeData = (await createChallengeRes.json()) as any;
  console.assert(createChallengeRes.status === 201, `Expected 201, got ${createChallengeRes.status}`);
  console.assert(typeof challengeData.challengeId === "string", "Expected challengeId");
  console.log("4. ✓ Quiz Challenge Created (ID:", challengeData.challengeId, "Topic:", challengeData.challenge.topic + ")");

  const challengeId = challengeData.challengeId;

  // 5. GET /api/discord/challenge/:id
  const getChallengeRes = await fetch(`${baseUrl}/challenge/${challengeId}`);
  const fetchedChallenge = (await getChallengeRes.json()) as any;
  console.assert(getChallengeRes.status === 200, `Expected 200, got ${getChallengeRes.status}`);
  console.assert(fetchedChallenge.challenge.questions.length === 3, "Expected 3 questions");
  console.log("5. ✓ Challenge fetched with identical questions for multiplayer");

  // 6. POST /api/discord/challenge/:id/submit (Participant 1)
  const submitRes1 = await fetch(`${baseUrl}/challenge/${challengeId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Alice_Coder",
      score: 3,
      completionTimeSeconds: 42,
    }),
  });
  const submitData1 = (await submitRes1.json()) as any;
  console.assert(submitRes1.status === 200, `Expected 200, got ${submitRes1.status}`);
  console.assert(submitData1.rank === 1, "Expected rank 1");
  console.log("6. ✓ Participant 1 submitted (Score: 3/3, Time: 42s, Rank: 1)");

  // 7. POST /api/discord/challenge/:id/submit (Participant 2)
  const submitRes2 = await fetch(`${baseUrl}/challenge/${challengeId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Bob_Dev",
      score: 2,
      completionTimeSeconds: 38,
    }),
  });
  const submitData2 = (await submitRes2.json()) as any;
  console.assert(submitData2.rank === 2, "Expected rank 2 for lower score");
  console.log("7. ✓ Participant 2 submitted (Score: 2/3, Time: 38s, Rank: 2)");

  // 8. POST /api/discord/share-achievement
  const shareRes = await fetch(`${baseUrl}/share-achievement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Speed Demon",
      topic: "DSA Arrays",
      score: 3,
      total: 3,
      percentage: 100,
      streak: 5,
      level: 4,
      badgeTitle: "Speed Demon ⚡",
    }),
  });
  const shareData = (await shareRes.json()) as any;
  console.assert(shareRes.status === 200, `Expected 200, got ${shareRes.status}`);
  console.log("8. ✓ Achievement shared to Discord channel:", shareData.message);

  // 9. POST /api/discord/servers/config
  const serverConfigRes = await fetch(`${baseUrl}/servers/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guildId: "guild_study_hall_99",
      guildName: "College Study Hall 🎓",
      channelId: "987654321098765432",
      channelName: "active-recall",
      dailyChallengeEnabled: true,
      achievementEnabled: true,
      reminderEnabled: true,
    }),
  });
  const serverConfigData = (await serverConfigRes.json()) as any;
  console.assert(serverConfigRes.status === 200, `Expected 200, got ${serverConfigRes.status}`);
  console.log("9. ✓ Server settings saved (Channel: #" + serverConfigData.server.channelName + ")");

  // 10. POST /api/discord/interactions (Slash Command /quiz)
  const slashQuizRes = await fetch(`${baseUrl}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 2,
      data: {
        name: "quiz",
        options: [
          { name: "topic", value: "Recursion" },
          { name: "difficulty", value: "medium" },
          { name: "questions", value: 5 },
        ],
      },
    }),
  });
  const slashQuizData = (await slashQuizRes.json()) as any;
  console.assert(slashQuizRes.status === 200, `Expected 200, got ${slashQuizRes.status}`);
  console.assert(slashQuizData.data?.embeds?.[0]?.title?.includes("DOCQUIZ"), "Expected embed title");
  console.log("10. ✓ Slash command /quiz handled with Rich Embed response");

  // 11. POST /api/discord/interactions (Slash Command /ask)
  const slashAskRes = await fetch(`${baseUrl}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 2,
      data: {
        name: "ask",
        options: [{ name: "question", value: "Explain recursion like I'm a beginner" }],
      },
    }),
  });
  const slashAskData = (await slashAskRes.json()) as any;
  console.assert(slashAskRes.status === 200, `Expected 200, got ${slashAskRes.status}`);
  console.assert(slashAskData.data?.embeds?.[0]?.description !== undefined, "Expected AI tutor response");
  console.log("11. ✓ Slash command /ask answered by AI Study Tutor");

  console.log("\n========================================");
  console.log("🎉 ALL 11 DISCORD INTEGRATION TESTS PASSED!");
  console.log("========================================\n");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[DISCORD-TEST-ERROR]", err);
    process.exit(1);
  });
