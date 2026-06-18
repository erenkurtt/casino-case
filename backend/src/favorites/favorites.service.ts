import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetFavoritesQueryDto } from './dto/get-favorites-query.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: GetFavoritesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, favorites] = await this.prisma.$transaction([
      this.prisma.userFavoriteGame.count({
        where: {
          userId,
        },
      }),
      this.prisma.userFavoriteGame.findMany({
        where: {
          userId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
          game: {
            select: {
              id: true,
              externalId: true,
              name: true,
              slug: true,
              providerName: true,
              thumbnailUrl: true,
              isActive: true,
              gameType: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              casino: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: favorites.map((favorite) => ({
        favoritedAt: favorite.createdAt,
        game: favorite.game,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async addFavorite(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        providerName: true,
        thumbnailUrl: true,
        isActive: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const existingFavorite = await this.prisma.userFavoriteGame.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Game is already in favorites');
    }

    const favorite = await this.prisma.userFavoriteGame.create({
      data: {
        userId,
        gameId,
      },
      select: {
        createdAt: true,
        game: {
          select: {
            id: true,
            externalId: true,
            name: true,
            slug: true,
            providerName: true,
            thumbnailUrl: true,
            isActive: true,
          },
        },
      },
    });

    return {
      message: 'Game added to favorites',
      favoritedAt: favorite.createdAt,
      game: favorite.game,
    };
  }

  async removeFavorite(userId: string, gameId: string) {
    const existingFavorite = await this.prisma.userFavoriteGame.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    if (!existingFavorite) {
      throw new NotFoundException('Favorite game not found');
    }

    await this.prisma.userFavoriteGame.delete({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    return {
      message: 'Game removed from favorites',
      gameId,
    };
  }
}