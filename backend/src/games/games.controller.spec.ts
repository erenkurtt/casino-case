import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

describe('GamesController', () => {
  let controller: GamesController;

  const gamesService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: gamesService,
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call gamesService.findAll with query params', async () => {
    const query = {
      search: 'gold',
      page: 1,
      limit: 10,
      country: 'TR',
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
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
        sortBy: 'name',
        sortOrder: 'asc',
        cacheHit: false,
      },
      filters: {
        search: 'gold',
        providerName: null,
        country: 'TR',
        gameType: null,
        isActive: true,
      },
    };

    gamesService.findAll.mockResolvedValue(mockResponse);

    const result = await controller.findAll(query);

    expect(gamesService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockResponse);
  });
});