-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TEORIA', 'QUESTOES', 'REVISAO');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('RUNNING', 'PAUSED', 'FINISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SessionPreset" AS ENUM ('P25_5', 'P50_10', 'LIVRE');

-- CreateEnum
CREATE TYPE "SelfRating" AS ENUM ('TRAVEI', 'OK', 'TRANQUILO');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('ENEM', 'CONCURSO');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDENTE', 'CONCLUIDA', 'ARQUIVADA');

-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_areaId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_userId_fkey";

-- DropTable
DROP TABLE "Area";

-- DropTable
DROP TABLE "Badge";

-- DropTable
DROP TABLE "StudySession";

-- DropTable
DROP TABLE "Subject";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserBadge";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streakAtual" INTEGER NOT NULL DEFAULT 0,
    "streakRecorde" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompleto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "goalId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "nome" TEXT NOT NULL,
    "curso" TEXT,
    "universidade" TEXT,
    "cargo" TEXT,
    "banca" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_weights" (
    "id" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "goalId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "goal_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_difficulties" (
    "id" TEXT NOT NULL,
    "dificuldade" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "user_difficulties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_availabilities" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "minutos" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_cycles" (
    "id" TEXT NOT NULL,
    "posicaoAtual" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "study_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_blocks" (
    "id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "duracao" INTEGER NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'PENDENTE',
    "cycleId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,

    CONSTRAINT "cycle_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "preset" "SessionPreset" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumedAt" TIMESTAMP(3),
    "minutosAcumulados" INTEGER NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),
    "selfRating" "SelfRating",
    "xpEarned" INTEGER,
    "notes" TEXT,
    "studiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    "cycleBlockId" TEXT,
    "originReviewId" TEXT,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_schedules" (
    "id" TEXT NOT NULL,
    "agendadaPara" TIMESTAMP(3) NOT NULL,
    "repeticao" INTEGER NOT NULL DEFAULT 1,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "review_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_logs" (
    "id" TEXT NOT NULL,
    "feitas" INTEGER NOT NULL,
    "acertadas" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "question_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_shields" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "streak_shields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "badgeName" TEXT NOT NULL,
    "badgeDescription" TEXT,
    "badgeImage" TEXT,
    "rarity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "goal_weights_goalId_areaId_key" ON "goal_weights"("goalId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "user_difficulties_userId_subjectId_key" ON "user_difficulties"("userId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "user_availabilities_userId_diaSemana_key" ON "user_availabilities"("userId", "diaSemana");

-- CreateIndex
CREATE INDEX "cycle_blocks_cycleId_ordem_idx" ON "cycle_blocks"("cycleId", "ordem");

-- CreateIndex
CREATE INDEX "study_sessions_userId_status_idx" ON "study_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "study_sessions_userId_startedAt_idx" ON "study_sessions"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "review_schedules_userId_agendadaPara_status_idx" ON "review_schedules"("userId", "agendadaPara", "status");

-- CreateIndex
CREATE INDEX "question_logs_userId_topicId_data_idx" ON "question_logs"("userId", "topicId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "streak_shields_userId_mes_ano_key" ON "streak_shields"("userId", "mes", "ano");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_weights" ADD CONSTRAINT "goal_weights_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_weights" ADD CONSTRAINT "goal_weights_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_difficulties" ADD CONSTRAINT "user_difficulties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_difficulties" ADD CONSTRAINT "user_difficulties_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_availabilities" ADD CONSTRAINT "user_availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cycles" ADD CONSTRAINT "study_cycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_blocks" ADD CONSTRAINT "cycle_blocks_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "study_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_blocks" ADD CONSTRAINT "cycle_blocks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_blocks" ADD CONSTRAINT "cycle_blocks_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_cycleBlockId_fkey" FOREIGN KEY ("cycleBlockId") REFERENCES "cycle_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_originReviewId_fkey" FOREIGN KEY ("originReviewId") REFERENCES "review_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_logs" ADD CONSTRAINT "question_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_logs" ADD CONSTRAINT "question_logs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_shields" ADD CONSTRAINT "streak_shields_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

