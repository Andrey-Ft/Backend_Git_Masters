/*
  Warnings:

  - You are about to drop the column `key` on the `Badge` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Badge_key_key";

-- AlterTable
ALTER TABLE "Badge" DROP COLUMN "key";
