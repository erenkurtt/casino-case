import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type GameData = {
  id: number;
  slug: string;
  title: string;
  providerName: string;
  thumb?: {
    url?: string;
  };
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting database seed...");

  const gameDataPath = join(
    process.cwd(),
    "prisma",
    "seed-data",
    "game-data.json",
  );

  const rawData = readFileSync(gameDataPath, "utf-8");
  const games = JSON.parse(rawData) as GameData[];

  console.log(`Loaded ${games.length} games from game-data.json`);

  const casino = await prisma.casino.upsert({
    where: {
      name: "Default Casino",
    },
    update: {},
    create: {
      name: "Default Casino",
    },
  });

  const gameType = await prisma.gameType.upsert({
    where: {
      slug: "slot",
    },
    update: {
      name: "Slot",
    },
    create: {
      name: "Slot",
      slug: "slot",
    },
  });

  const countries = await Promise.all([
    prisma.country.upsert({
      where: {
        isoCode: "TR",
      },
      update: {
        name: "Turkey",
      },
      create: {
        isoCode: "TR",
        name: "Turkey",
      },
    }),
    prisma.country.upsert({
      where: {
        isoCode: "GB",
      },
      update: {
        name: "United Kingdom",
      },
      create: {
        isoCode: "GB",
        name: "United Kingdom",
      },
    }),
    prisma.country.upsert({
      where: {
        isoCode: "DE",
      },
      update: {
        name: "Germany",
      },
      create: {
        isoCode: "DE",
        name: "Germany",
      },
    }),
    prisma.country.upsert({
      where: {
        isoCode: "MT",
      },
      update: {
        name: "Malta",
      },
      create: {
        isoCode: "MT",
        name: "Malta",
      },
    }),
  ]);

  for (const game of games) {
    const createdGame = await prisma.game.upsert({
      where: {
        externalId: game.id,
      },
      update: {
        name: game.title,
        slug: game.slug,
        providerName: game.providerName,
        thumbnailUrl: game.thumb?.url ?? null,
        isActive: true,
        casinoId: casino.id,
        gameTypeId: gameType.id,
      },
      create: {
        externalId: game.id,
        name: game.title,
        slug: game.slug,
        providerName: game.providerName,
        thumbnailUrl: game.thumb?.url ?? null,
        isActive: true,
        casinoId: casino.id,
        gameTypeId: gameType.id,
      },
    });

    await prisma.gameCountry.createMany({
      data: countries.map((country) => ({
        gameId: createdGame.id,
        countryId: country.id,
      })),
      skipDuplicates: true,
    });
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });