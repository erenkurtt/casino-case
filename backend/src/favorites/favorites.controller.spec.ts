import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;

  const favoritesService = {
    findAll: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  };

  const jwtService = {
    verifyAsync: jest.fn(),
  };

  const currentUser = {
    sub: 'user-uuid-1',
    email: 'eren@test.com',
    username: 'eren',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: favoritesService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call favoritesService.findAll with current user id and query', async () => {
    const query = {
      page: 1,
      limit: 10,
    };

    const mockResponse = {
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    favoritesService.findAll.mockResolvedValue(mockResponse);

    const result = await controller.findAll(currentUser, query);

    expect(favoritesService.findAll).toHaveBeenCalledWith(
      'user-uuid-1',
      query,
    );

    expect(result).toEqual(mockResponse);
  });

  it('should call favoritesService.addFavorite with current user id and game id', async () => {
    const mockResponse = {
      message: 'Game added to favorites',
      favoritedAt: new Date('2026-01-01T00:00:00.000Z'),
      game: {
        id: 'game-uuid-1',
        externalId: 9150,
        name: 'Fire-Lightning',
        slug: 'fire-lightning',
        providerName: 'BGaming',
        thumbnailUrl: 'https://example.com/fire-lightning.webp',
        isActive: true,
      },
    };

    favoritesService.addFavorite.mockResolvedValue(mockResponse);

    const result = await controller.addFavorite(currentUser, 'game-uuid-1');

    expect(favoritesService.addFavorite).toHaveBeenCalledWith(
      'user-uuid-1',
      'game-uuid-1',
    );

    expect(result).toEqual(mockResponse);
  });

  it('should call favoritesService.removeFavorite with current user id and game id', async () => {
    const mockResponse = {
      message: 'Game removed from favorites',
      gameId: 'game-uuid-1',
    };

    favoritesService.removeFavorite.mockResolvedValue(mockResponse);

    const result = await controller.removeFavorite(currentUser, 'game-uuid-1');

    expect(favoritesService.removeFavorite).toHaveBeenCalledWith(
      'user-uuid-1',
      'game-uuid-1',
    );

    expect(result).toEqual(mockResponse);
  });
});