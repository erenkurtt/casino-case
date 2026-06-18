import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  let prisma: {
    userFavoriteGame: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    game: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockGame = {
    id: 'game-uuid-1',
    externalId: 9150,
    name: 'Fire-Lightning',
    slug: 'fire-lightning',
    providerName: 'BGaming',
    thumbnailUrl: 'https://example.com/fire-lightning.webp',
    isActive: true,
    gameType: {
      id: 'game-type-uuid-1',
      name: 'Slot',
      slug: 'slot',
    },
    casino: {
      id: 'casino-uuid-1',
      name: 'Default Casino',
    },
  };

  const mockFavorite = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    game: mockGame,
  };

  beforeEach(async () => {
    prisma = {
      userFavoriteGame: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      game: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated favorite games for current user', async () => {
      prisma.userFavoriteGame.count.mockResolvedValue(1);
      prisma.userFavoriteGame.findMany.mockResolvedValue([mockFavorite]);

      const result = await service.findAll('user-uuid-1', {
        page: 1,
        limit: 10,
      });

      expect(prisma.userFavoriteGame.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
        },
      });

      expect(prisma.userFavoriteGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-uuid-1',
          },
          skip: 0,
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      );

      expect(result).toEqual({
        data: [
          {
            favoritedAt: mockFavorite.createdAt,
            game: mockGame,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should calculate pagination correctly for page 2', async () => {
      prisma.userFavoriteGame.count.mockResolvedValue(25);
      prisma.userFavoriteGame.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-uuid-1', {
        page: 2,
        limit: 10,
      });

      expect(prisma.userFavoriteGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });
  });

  describe('addFavorite', () => {
    it('should add a game to favorites', async () => {
      prisma.game.findUnique.mockResolvedValue({
        id: 'game-uuid-1',
        name: 'Fire-Lightning',
        slug: 'fire-lightning',
        providerName: 'BGaming',
        thumbnailUrl: 'https://example.com/fire-lightning.webp',
        isActive: true,
      });

      prisma.userFavoriteGame.findUnique.mockResolvedValue(null);
      prisma.userFavoriteGame.create.mockResolvedValue({
        createdAt: mockFavorite.createdAt,
        game: {
          id: 'game-uuid-1',
          externalId: 9150,
          name: 'Fire-Lightning',
          slug: 'fire-lightning',
          providerName: 'BGaming',
          thumbnailUrl: 'https://example.com/fire-lightning.webp',
          isActive: true,
        },
      });

      const result = await service.addFavorite('user-uuid-1', 'game-uuid-1');

      expect(prisma.game.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'game-uuid-1',
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

      expect(prisma.userFavoriteGame.findUnique).toHaveBeenCalledWith({
        where: {
          userId_gameId: {
            userId: 'user-uuid-1',
            gameId: 'game-uuid-1',
          },
        },
      });

      expect(prisma.userFavoriteGame.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-1',
          gameId: 'game-uuid-1',
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

      expect(result).toEqual({
        message: 'Game added to favorites',
        favoritedAt: mockFavorite.createdAt,
        game: {
          id: 'game-uuid-1',
          externalId: 9150,
          name: 'Fire-Lightning',
          slug: 'fire-lightning',
          providerName: 'BGaming',
          thumbnailUrl: 'https://example.com/fire-lightning.webp',
          isActive: true,
        },
      });
    });

    it('should throw NotFoundException when game does not exist', async () => {
      prisma.game.findUnique.mockResolvedValue(null);

      await expect(
        service.addFavorite('user-uuid-1', 'missing-game-id'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.userFavoriteGame.findUnique).not.toHaveBeenCalled();
      expect(prisma.userFavoriteGame.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when game is already in favorites', async () => {
      prisma.game.findUnique.mockResolvedValue({
        id: 'game-uuid-1',
      });

      prisma.userFavoriteGame.findUnique.mockResolvedValue({
        userId: 'user-uuid-1',
        gameId: 'game-uuid-1',
      });

      await expect(
        service.addFavorite('user-uuid-1', 'game-uuid-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.userFavoriteGame.create).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('should remove a game from favorites', async () => {
      prisma.userFavoriteGame.findUnique.mockResolvedValue({
        userId: 'user-uuid-1',
        gameId: 'game-uuid-1',
      });

      prisma.userFavoriteGame.delete.mockResolvedValue({
        userId: 'user-uuid-1',
        gameId: 'game-uuid-1',
      });

      const result = await service.removeFavorite('user-uuid-1', 'game-uuid-1');

      expect(prisma.userFavoriteGame.findUnique).toHaveBeenCalledWith({
        where: {
          userId_gameId: {
            userId: 'user-uuid-1',
            gameId: 'game-uuid-1',
          },
        },
      });

      expect(prisma.userFavoriteGame.delete).toHaveBeenCalledWith({
        where: {
          userId_gameId: {
            userId: 'user-uuid-1',
            gameId: 'game-uuid-1',
          },
        },
      });

      expect(result).toEqual({
        message: 'Game removed from favorites',
        gameId: 'game-uuid-1',
      });
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      prisma.userFavoriteGame.findUnique.mockResolvedValue(null);

      await expect(
        service.removeFavorite('user-uuid-1', 'game-uuid-1'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.userFavoriteGame.delete).not.toHaveBeenCalled();
    });
  });
});