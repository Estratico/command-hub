/*
  Warnings:

  - You are about to drop the column `company` on the `subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,userId]` on the table `teamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "teamMember_teamId_key";

-- DropIndex
DROP INDEX "teamMember_userId_key";

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "company",
ADD COLUMN     "provider" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "teamMember_teamId_userId_key" ON "teamMember"("teamId", "userId");
