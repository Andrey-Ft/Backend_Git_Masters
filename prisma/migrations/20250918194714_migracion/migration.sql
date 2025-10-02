/*
  Warnings:

  - You are about to drop the `github_events` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[key]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Badge" ADD COLUMN     "key" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."github_events";

-- CreateTable
CREATE TABLE "public"."GithubEvent" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT,
    "repoFullName" TEXT,
    "senderLogin" TEXT,
    "payload" JSONB NOT NULL,
    "processedStatus" TEXT NOT NULL DEFAULT 'stored',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubEvent_deliveryId_key" ON "public"."GithubEvent"("deliveryId");

-- CreateIndex
CREATE INDEX "GithubEvent_eventType_idx" ON "public"."GithubEvent"("eventType");

-- CreateIndex
CREATE INDEX "GithubEvent_repoFullName_idx" ON "public"."GithubEvent"("repoFullName");

-- CreateIndex
CREATE INDEX "GithubEvent_senderLogin_idx" ON "public"."GithubEvent"("senderLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "public"."Badge"("key");
