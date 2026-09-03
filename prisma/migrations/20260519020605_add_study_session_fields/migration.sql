/*
  Warnings:

  - Added the required column `studiedAt` to the `StudySession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "correctAnswers" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pomodoroCount" INTEGER,
ADD COLUMN     "sessionType" TEXT,
ADD COLUMN     "studiedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "xpEarned" INTEGER;
