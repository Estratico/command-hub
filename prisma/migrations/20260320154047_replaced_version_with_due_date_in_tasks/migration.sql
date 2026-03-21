/*
  Warnings:

  - You are about to drop the column `version` on the `task` table. All the data in the column will be lost.
  - Added the required column `dueDate` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task" DROP COLUMN "version",
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL;
