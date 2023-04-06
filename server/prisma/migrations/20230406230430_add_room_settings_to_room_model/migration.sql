/*
  Warnings:

  - Added the required column `questionFilterKind` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "questionFilterKind" TEXT NOT NULL,
ADD COLUMN     "questionFilterSelections" TEXT[];
