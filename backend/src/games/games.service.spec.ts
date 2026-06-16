import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../prisma/prisma.service';
import { InMemoryCacheService } from '../common/cache/in-memory-cache.service';

describe('GamesService', () => {
  let service: GamesService;

  let prisma: {
    game: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    deleteByPrefix: jest.Mock;
  };

  const mockGame = {
    id: 'game-uuid-1',
    externalId: 9150,
    name: 'Fire-Lightning',
    slug: 'fire-lightning',
    providerName: 'BGaming',
    thumbnailUrl: 'https://example.com/fire-lightning.webp',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    casino: {
      id: 'casino-uuid-1',
      name: 'Default Casino',
    },
    gameType: {
      id: 'game-type-uuid-1',
      name: 'Slot',
      slug: 'slot',
    },
    gameCountries: [
      {
        country: {
          id: 'country-uuid-1',
          isoCode: 'TR',
          name: 'Turkey',
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      game: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([mockGame]),
      },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    cache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      deleteByPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: InMemoryCacheService,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated active games with normalized response', async () => {
    const result = await service.findAll({});

    expect(prisma.game.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
      },
    });

    expect(prisma.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
        },
        skip: 0,
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );

    expect(result.data).toHaveLength(1);

    expect(result.data[0]).toMatchObject({
      id: 'game-uuid-1',
      externalId: 9150,
      name: 'Fire-Lightning',
      slug: 'fire-lightning',
      providerName: 'BGaming',
      isActive: true,
      casino: {
        id: 'casino-uuid-1',
        name: 'Default Casino',
      },
      gameType: {
        id: 'game-type-uuid-1',
        name: 'Slot',
        slug: 'slot',
      },
      countries: [
        {
          id: 'country-uuid-1',
          isoCode: 'TR',
          name: 'Turkey',
        },
      ],
    });

    expect(result.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      cacheHit: false,
    });

    expect(cache.set).toHaveBeenCalled();
  });

  it('should apply search filter on name, slug and providerName', async () => {
    await service.findAll({
      search: 'gold',
      page: 1,
      limit: 10,
    });

    const countCallArg = prisma.game.count.mock.calls[0][0];

    expect(countCallArg.where).toMatchObject({
      isActive: true,
      OR: [
        {
          name: {
            contains: 'gold',
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: 'gold',
            mode: 'insensitive',
          },
        },
        {
          providerName: {
            contains: 'gold',
            mode: 'insensitive',
          },
        },
      ],
    });
  });

  it('should apply providerName filter', async () => {
    await service.findAll({
      providerName: 'Booming Games',
    });

    const countCallArg = prisma.game.count.mock.calls[0][0];

    expect(countCallArg.where).toMatchObject({
      isActive: true,
      providerName: {
        contains: 'Booming Games',
        mode: 'insensitive',
      },
    });
  });

  it('should apply country filter', async () => {
    await service.findAll({
      country: 'TR',
    });

    const countCallArg = prisma.game.count.mock.calls[0][0];

    expect(countCallArg.where).toMatchObject({
      isActive: true,
      gameCountries: {
        some: {
          country: {
            isoCode: 'TR',
          },
        },
      },
    });
  });

  it('should apply gameType filter', async () => {
    await service.findAll({
      gameType: 'slot',
    });

    const countCallArg = prisma.game.count.mock.calls[0][0];

    expect(countCallArg.where).toMatchObject({
      isActive: true,
      gameType: {
        slug: 'slot',
      },
    });
  });

  it('should support inactive games when isActive is false', async () => {
    await service.findAll({
      isActive: false,
    });

    const countCallArg = prisma.game.count.mock.calls[0][0];

    expect(countCallArg.where).toMatchObject({
      isActive: false,
    });
  });

  it('should apply pagination and sorting', async () => {
    await service.findAll({
      page: 2,
      limit: 5,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    const findManyCallArg = prisma.game.findMany.mock.calls[0][0];

    expect(findManyCallArg).toMatchObject({
      skip: 5,
      take: 5,
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('should return cached response and avoid database query when cache exists', async () => {
    const cachedResponse = {
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        cacheHit: false,
      },
      filters: {
        search: null,
        providerName: null,
        country: null,
        gameType: null,
        isActive: true,
      },
    };

    cache.get.mockReturnValueOnce(cachedResponse);

    const result = await service.findAll({});

    expect(prisma.game.count).not.toHaveBeenCalled();
    expect(prisma.game.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();

    expect(result.meta.cacheHit).toBe(true);
  });
});