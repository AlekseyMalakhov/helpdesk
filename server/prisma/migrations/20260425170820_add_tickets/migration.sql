/*
  Warnings:

  - The primary key for the `ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `ticketId` on the `reply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "reply" DROP CONSTRAINT "reply_ticketId_fkey";

-- AlterTable
ALTER TABLE "reply" DROP COLUMN "ticketId",
ADD COLUMN     "ticketId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
