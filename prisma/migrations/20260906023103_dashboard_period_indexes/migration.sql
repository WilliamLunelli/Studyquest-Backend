-- CreateIndex
CREATE INDEX "question_logs_userId_data_idx" ON "question_logs"("userId", "data");

-- CreateIndex
CREATE INDEX "study_sessions_userId_status_finishedAt_idx" ON "study_sessions"("userId", "status", "finishedAt");
