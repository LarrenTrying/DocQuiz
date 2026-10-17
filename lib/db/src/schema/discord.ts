import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 1. Discord user connections
export const discordConnectionsTable = pgTable("discord_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  discordUserId: text("discord_user_id").notNull(),
  discordUsername: text("discord_username").notNull(),
  discordAvatar: text("discord_avatar"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  studyRemindersEnabled: boolean("study_reminders_enabled").default(true).notNull(),
  weakTopicInsightsEnabled: boolean("weak_topic_insights_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Connected Discord servers / Guilds
export const discordServersTable = pgTable("discord_servers", {
  id: text("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  guildName: text("guild_name").notNull(),
  guildIcon: text("guild_icon"),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  connectedByUserId: text("connected_by_user_id").notNull(),
  dailyChallengeEnabled: boolean("daily_challenge_enabled").default(true).notNull(),
  achievementEnabled: boolean("achievement_enabled").default(true).notNull(),
  reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
  preferredTopic: text("preferred_topic").default("Computer Science & General Knowledge"),
  difficulty: text("difficulty").default("challenge"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Quiz Challenges created for Discord communities & peers
export const quizChallengesTable = pgTable("quiz_challenges", {
  id: text("id").primaryKey(),
  creatorUserId: text("creator_user_id").notNull(),
  creatorUsername: text("creator_username").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  questionCount: integer("question_count").notNull(),
  timeLimitSeconds: integer("time_limit_seconds").notNull(),
  questions: jsonb("questions").notNull(), // Array of QuizQuestion
  sourceFileName: text("source_file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// 4. Challenge participants & scores for leaderboards
export const challengeParticipantsTable = pgTable("challenge_participants", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull(),
  userId: text("user_id"),
  username: text("username").notNull(),
  discordUserId: text("discord_user_id"),
  discordUsername: text("discord_username"),
  avatarUrl: text("avatar_url"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: integer("percentage").notNull(),
  completionTimeSeconds: integer("completion_time_seconds").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type DiscordConnection = typeof discordConnectionsTable.$inferSelect;
export type DiscordServer = typeof discordServersTable.$inferSelect;
export type QuizChallenge = typeof quizChallengesTable.$inferSelect;
export type ChallengeParticipant = typeof challengeParticipantsTable.$inferSelect;
