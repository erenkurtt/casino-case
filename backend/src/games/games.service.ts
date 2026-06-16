import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { InMemoryCacheService } from '../common/cache/in-memory-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetGamesQueryDto } from './dto/get-games-query.dto';

type SortBy = 'name' | 'createdAt' | 'providerName';
type SortOrder = 'asc' | 'desc';

type GameListItem = {
  id: string;
  externalId: number;
  name: string;
  slug: string;
  providerName: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  casino: {
    id: string;
    name: string;
  };
  gameType: {
    id: string;
    name: string;
    slug: string;
  };
  countries: {
    id: string;
    isoCode: string;
    name: string;
  }[];
};

type GamesListResponse = {
  data: GameListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    sortBy: SortBy;
    sortOrder: SortOrder;
    cacheHit: boolean;
  };
  filters: {
    search: string | null;
    providerName: string | null;
    country: string | null;
    gameType: string | null;
    isActive: boolean;
  };
};

@Injectable()
export class GamesService {
  private readonly gamesCacheTtlMs = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheService,
  ) {}

  async findAll(query: GetGamesQueryDto): Promise<GamesListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const normalizedQuery = {
      page,
      limit,
      search: query.search?.toLowerCase() ?? null,
      providerName: query.providerName?.toLowerCase() ?? null,
      country: query.country ?? null,
      gameType: query.gameType ?? null,
      isActive: query.isActive ?? true,
      sortBy,
      sortOrder,
    };

    const cacheKey = `games:${JSON.stringify(normalizedQuery)}`;

    const cached = this.cache.get<GamesListResponse>(cacheKey);

    if (cached) {
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true,
        },
      };
    }

    const where: Prisma.GameWhereInput = {
      isActive: normalizedQuery.isActive,
    };

    if (query.search) {
      where.OR = [
        {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          providerName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.providerName) {
      where.providerName = {
        contains: query.providerName,
        mode: 'insensitive',
      };
    }

    if (query.country) {
      where.gameCountries = {
        some: {
          country: {
            isoCode: query.country,
          },
        },
      };
    }

    if (query.gameType) {
      where.gameType = {
        slug: query.gameType,
      };
    }

    const orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.GameOrderByWithRelationInput;

    const [total, games] = await this.prisma.$transaction([
      this.prisma.game.count({
        where,
      }),
      this.prisma.game.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          externalId: true,
          name: true,
          slug: true,
          providerName: true,
          thumbnailUrl: true,
          isActive: true,
          createdAt: true,
          casino: {
            select: {
              id: true,
              name: true,
            },
          },
          gameType: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          gameCountries: {
            select: {
              country: {
                select: {
                  id: true,
                  isoCode: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: GamesListResponse = {
      data: games.map((game) => ({
        id: game.id,
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        providerName: game.providerName,
        thumbnailUrl: game.thumbnailUrl,
        isActive: game.isActive,
        createdAt: game.createdAt,
        casino: game.casino,
        gameType: game.gameType,
        countries: game.gameCountries.map((item) => item.country),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        sortBy,
        sortOrder,
        cacheHit: false,
      },
      filters: {
        search: query.search ?? null,
        providerName: query.providerName ?? null,
        country: query.country ?? null,
        gameType: query.gameType ?? null,
        isActive: normalizedQuery.isActive,
      },
    };

    this.cache.set(cacheKey, response, this.gamesCacheTtlMs);

    return response;
  }
}