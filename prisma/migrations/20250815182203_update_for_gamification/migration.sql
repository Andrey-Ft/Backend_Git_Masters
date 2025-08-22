/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `branches` on the `Metric` table. All the data in the column will be lost.
  - You are about to drop the column `recentActivity` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Team` table. All the data in the column will be lost.
  - The primary key for the `github_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `commits_count` on the `github_events` table. All the data in the column will be lost.
  - You are about to drop the column `github_created_at` on the `github_events` table. All the data in the column will be lost.
  - You are about to drop the column `installation_id` on the `github_events` table. All the data in the column will be lost.
  - You are about to drop the column `repo_id` on the `github_events` table. All the data in the column will be lost.
  - You are about to drop the column `signature_valid` on the `github_events` table. All the data in the column will be lost.
  - You are about to drop the `BadgeAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `criteria` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BadgeAssignment" DROP CONSTRAINT "BadgeAssignment_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BadgeAssignment" DROP CONSTRAINT "BadgeAssignment_userId_fkey";

-- DropIndex
DROP INDEX "public"."idx_ghe_github_created";

-- DropIndex
DROP INDEX "public"."idx_ghe_received_at";

-- AlterTable
ALTER TABLE "public"."Badge" DROP COLUMN "createdAt",
DROP COLUMN "iconUrl",
ADD COLUMN     "criteria" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."Metric" DROP COLUMN "branches";

-- AlterTable
ALTER TABLE "public"."Profile" DROP COLUMN "recentActivity";

-- AlterTable
ALTER TABLE "public"."Team" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "public"."github_events" DROP CONSTRAINT "github_events_pkey",
DROP COLUMN "commits_count",
DROP COLUMN "github_created_at",
DROP COLUMN "installation_id",
DROP COLUMN "repo_id",
DROP COLUMN "signature_valid",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "received_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "github_events_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."BadgeAssignment";

-- DropTable
DROP TABLE "public"."Event";

-- DropTable
DROP TABLE "public"."Rule";

-- CreateTable
CREATE TABLE "public"."PointLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "entityId" TEXT NOT NULL,
    "notes" TEXT,
    "isReversible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointLedger_userId_createdAt_idx" ON "public"."PointLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "public"."UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."PointLedger" ADD CONSTRAINT "PointLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_ghe_event_type" RENAME TO "github_events_event_type_idx";

-- RenameIndex
ALTER INDEX "public"."idx_ghe_repo_full_name" RENAME TO "github_events_repo_full_name_idx";

-- RenameIndex
ALTER INDEX "public"."idx_ghe_sender_login" RENAME TO "github_events_sender_login_idx";
