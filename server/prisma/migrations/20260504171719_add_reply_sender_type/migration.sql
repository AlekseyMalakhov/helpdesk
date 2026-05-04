-- CreateEnum
CREATE TYPE "ReplyType" AS ENUM ('agent', 'customer');

-- AlterTable
ALTER TABLE "reply" ADD COLUMN     "senderType" "ReplyType" NOT NULL DEFAULT 'agent';
