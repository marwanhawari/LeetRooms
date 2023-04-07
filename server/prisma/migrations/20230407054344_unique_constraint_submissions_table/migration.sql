/*
  Warnings:

  - A unique constraint covering the columns `[userId,questionId,roomId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Submission_userId_questionId_roomId_key" ON "Submission"("userId", "questionId", "roomId");
