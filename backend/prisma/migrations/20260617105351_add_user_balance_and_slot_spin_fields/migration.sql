/*
  Warnings:

  - Added the required column `balance_after` to the `spin_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balance_before` to the `spin_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reel_1` to the `spin_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reel_2` to the `spin_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reel_3` to the `spin_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "spin_history" DROP CONSTRAINT "spin_history_game_id_fkey";

-- AlterTable
ALTER TABLE "spin_history" ADD COLUMN     "balance_after" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "balance_before" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "net_amount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "reel_1" VARCHAR(50) NOT NULL,
ADD COLUMN     "reel_2" VARCHAR(50) NOT NULL,
ADD COLUMN     "reel_3" VARCHAR(50) NOT NULL,
ALTER COLUMN "game_id" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'COI';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "balance" DECIMAL(18,2) NOT NULL DEFAULT 20.00;

-- AddForeignKey
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_bet_amount_range
CHECK (bet_amount >= 0.50 AND bet_amount <= 5.00);

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_win_amount_non_negative
CHECK (win_amount >= 0);

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_balance_before_non_negative
CHECK (balance_before >= 0);

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_balance_after_non_negative
CHECK (balance_after >= 0);

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_reel_1_symbol
CHECK (reel_1 IN ('cherry', 'lemon', 'apple', 'banana'));

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_reel_2_symbol
CHECK (reel_2 IN ('cherry', 'lemon', 'apple', 'banana'));

ALTER TABLE spin_history
ADD CONSTRAINT chk_spin_history_reel_3_symbol
CHECK (reel_3 IN ('cherry', 'lemon', 'apple', 'banana'));

ALTER TABLE users
ADD CONSTRAINT chk_users_balance_non_negative
CHECK (balance >= 0);