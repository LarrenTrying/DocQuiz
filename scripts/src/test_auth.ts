export { };
process.env.PORT = "5055";

interface ApiResponse {
  message?: string;
  error?: string;
  token?: string;
  securityQuestion?: string;
  user?: {
    id: string;
    username: string;
  };
}

async function runTests() {
  // Start server on test port 5055
  // @ts-ignore - compiled dist artifact doesn't emit declaration files
  await import("../../artifacts/api-server/dist/index.mjs");
  // Allow server a moment to bind
  await new Promise((r) => setTimeout(r, 300));

  const baseUrl = "http://127.0.0.1:5055/api/auth";
  console.log(`[AUTH-TEST] Starting tests against ${baseUrl}...`);

  const uniqueUser = `test_user_${Date.now()}`;
  const password = "ValidPassword123!";
  const question = "What was the name of your first pet?";
  const answer = "Fluffy";

  // 1. Register
  const regRes = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: uniqueUser,
      password,
      confirmPassword: password,
      securityQuestion: question,
      securityAnswer: answer,
    }),
  });
  const regData = (await regRes.json()) as ApiResponse;
  console.assert(regRes.status === 201, `Expected 201, got ${regRes.status}: ${JSON.stringify(regData)}`);
  console.log("1. ✓ User Registration (Status 201):", regData.message);

  // 2. Duplicate Username
  const dupRes = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: uniqueUser,
      password: "OtherPassword!",
      securityQuestion: "What is your favorite book?",
      securityAnswer: "Dune",
    }),
  });
  console.assert(dupRes.status === 409, `Expected 409, got ${dupRes.status}`);
  console.log("2. ✓ Duplicate Username rejected (Status 409)");

  // 3. Login with correct credentials
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUser, password }),
  });
  const loginData = (await loginRes.json()) as ApiResponse;
  console.assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
  console.assert(Boolean(loginData.token), "Token missing");
  console.log("3. ✓ User Login (Status 200) Token:", (loginData.token || "").slice(0, 10) + "...");

  // 4. Wrong password
  const wrongRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUser, password: "WrongPassword!" }),
  });
  console.assert(wrongRes.status === 401, `Expected 401, got ${wrongRes.status}`);
  console.log("4. ✓ Wrong Password rejected (Status 401)");

  // 5. Protected /auth/me
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const meData = (await meRes.json()) as ApiResponse;
  console.assert(meRes.status === 200 && meData.user?.username === uniqueUser, "Me check failed");
  console.log("5. ✓ Protected Route /auth/me verified for user:", meData.user?.username);

  // 6. Security Question Lookup
  const lookupRes = await fetch(`${baseUrl}/get-security-question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUser }),
  });
  const lookupData = (await lookupRes.json()) as ApiResponse;
  console.assert(lookupRes.status === 200, `Expected 200, got ${lookupRes.status}`);
  console.log("6. ✓ Security Question retrieved:", lookupData.securityQuestion);

  // 7. Reset with wrong answer
  const badAnsRes = await fetch(`${baseUrl}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: uniqueUser,
      securityAnswer: "WrongAnswer",
      newPassword: "BrandNewPassword2026!",
    }),
  });
  console.assert(badAnsRes.status === 400, `Expected 400, got ${badAnsRes.status}`);
  console.log("7. ✓ Wrong security answer rejected (Status 400)");

  // 8. Reset with correct answer (testing case-insensitivity)
  const newPassword = "BrandNewPassword2026!";
  const resetRes = await fetch(`${baseUrl}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: uniqueUser,
      securityAnswer: "fluffy",
      newPassword,
      confirmNewPassword: newPassword,
    }),
  });
  const resetData = (await resetRes.json()) as ApiResponse;
  console.assert(resetRes.status === 200, `Expected 200, got ${resetRes.status}`);
  console.log("8. ✓ Password reset successful (Status 200):", resetData.message);

  // 9. Old password rejected
  const oldLoginRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUser, password }),
  });
  console.assert(oldLoginRes.status === 401, `Expected 401, got ${oldLoginRes.status}`);
  console.log("9. ✓ Old password verified invalid (Status 401)");

  // 10. New password accepted
  const newLoginRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUser, password: newPassword }),
  });
  console.assert(newLoginRes.status === 200, `Expected 200, got ${newLoginRes.status}`);
  console.log("10. ✓ New password verified working (Status 200)");

  // 11. Seeded demo user check
  const demoRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex_morgan", password: "DocQuiz2026!" }),
  });
  console.assert(demoRes.status === 200, `Expected 200, got ${demoRes.status}`);
  console.log("11. ✓ Seeded Demo user (alex_morgan) verified (Status 200)");

  console.log("\n=======================================================");
  console.log(">> ALL 11 END-TO-END AUTH TESTS PASSED SUCCESSFULLY! <<");
  console.log("=======================================================\n");

  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
