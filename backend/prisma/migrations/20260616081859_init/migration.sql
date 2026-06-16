-- CreateTable
CREATE TABLE "casinos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "iso_code" CHAR(2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "casino_id" UUID NOT NULL,
    "game_type_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_countries" (
    "game_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_countries_pkey" PRIMARY KEY ("game_id","country_id")
);

-- CreateTable
CREATE TABLE "user_favorite_games" (
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_games_pkey" PRIMARY KEY ("user_id","game_id")
);

-- CreateTable
CREATE TABLE "spin_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "round_id" VARCHAR(150) NOT NULL,
    "bet_amount" DECIMAL(18,2) NOT NULL,
    "win_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "result_data" JSONB,
    "spun_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "casinos_name_key" ON "casinos"("name");

-- CreateIndex
CREATE UNIQUE INDEX "game_types_name_key" ON "game_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "game_types_slug_key" ON "game_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_key" ON "countries"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_country_id_idx" ON "users"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX "games_casino_id_idx" ON "games"("casino_id");

-- CreateIndex
CREATE INDEX "games_game_type_id_idx" ON "games"("game_type_id");

-- CreateIndex
CREATE INDEX "games_is_active_idx" ON "games"("is_active");

-- CreateIndex
CREATE INDEX "game_countries_country_id_idx" ON "game_countries"("country_id");

-- CreateIndex
CREATE INDEX "user_favorite_games_game_id_idx" ON "user_favorite_games"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "spin_history_round_id_key" ON "spin_history"("round_id");

-- CreateIndex
CREATE INDEX "spin_history_user_id_idx" ON "spin_history"("user_id");

-- CreateIndex
CREATE INDEX "spin_history_game_id_idx" ON "spin_history"("game_id");

-- CreateIndex
CREATE INDEX "spin_history_user_id_spun_at_idx" ON "spin_history"("user_id", "spun_at");

-- CreateIndex
CREATE INDEX "spin_history_game_id_spun_at_idx" ON "spin_history"("game_id", "spun_at");

-- CreateIndex
CREATE INDEX "spin_history_spun_at_idx" ON "spin_history"("spun_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_game_type_id_fkey" FOREIGN KEY ("game_type_id") REFERENCES "game_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_countries" ADD CONSTRAINT "game_countries_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_countries" ADD CONSTRAINT "game_countries_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_games" ADD CONSTRAINT "user_favorite_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_games" ADD CONSTRAINT "user_favorite_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
