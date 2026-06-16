/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `external_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider_name` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "external_id" INTEGER NOT NULL,
ADD COLUMN     "provider_name" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "games_external_id_key" ON "games"("external_id");
