-- CreateTable
CREATE TABLE "improved_topics" (
    "id" TEXT NOT NULL,
    "melhoradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "improved_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "improved_topics_userId_topicId_key" ON "improved_topics"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "improved_topics" ADD CONSTRAINT "improved_topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improved_topics" ADD CONSTRAINT "improved_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
