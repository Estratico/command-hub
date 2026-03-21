/*
  Warnings:

  - You are about to drop the column `version` on the `syncLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId]` on the table `teamMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `teamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "teamMember_teamId_userId_key";

-- AlterTable
ALTER TABLE "syncLog" DROP COLUMN "version";

-- CreateIndex
CREATE UNIQUE INDEX "teamMember_teamId_key" ON "teamMember"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "teamMember_userId_key" ON "teamMember"("userId");
