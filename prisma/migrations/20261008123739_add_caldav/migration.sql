/*
  Warnings:

  - You are about to drop the `post` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "CalendarAccountProvider" ADD VALUE 'CALDAV';

-- DropForeignKey
ALTER TABLE "public"."post" DROP CONSTRAINT "post_createdById_fkey";

-- AlterTable
ALTER TABLE "calendar_account" ADD COLUMN     "serverUrl" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "public"."post";
