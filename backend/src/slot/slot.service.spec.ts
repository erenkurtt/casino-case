import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotMachineService } from './slot-machine.service';
import { SlotService } from './slot.service';

describe('SlotService', () => {
  let service: SlotService;

  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    game: {
      findUnique: jest.Mock;
    };
    spinHistory: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let slotMachine: {
    getBetOptions: jest.Mock;
    spin: jest.Mock;
  };

  const decimal = (value: string | number) => new Prisma.Decimal(value);

  const mockUser = {
    id: 'user-uuid-1',
    balance: decimal('20.00'),
  };

  const mockSpinRecord = {
    id: 'spin-uuid-1',
    roundId: 'round-uuid-1',
    betAmount: decimal('1.00'),
    winAmount: decimal('40.00'),
    netAmount: decimal('39.00'),
    balanceBefore: decimal('20.00'),
    balanceAfter: decimal('59.00'),
    reel1: 'cherry',
    reel2: 'cherry',
    reel3: 'lemon',
    spunAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      game: {
        findUnique: jest.fn(),
      },
      spinHistory: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((arg) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }

        return Promise.all(arg);
      }),
    };

    slotMachine = {
      getBetOptions: jest.fn(),
      spin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: SlotMachineService,
          useValue: slotMachine,
        },
      ],
    }).compile();

    service = module.get<SlotService>(SlotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return bet options from slot machine service', () => {
    slotMachine.getBetOptions.mockReturnValue({
      min: 0.5,
      max: 5,
      step: 0.5,
      options: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    });

    const result = service.getBetOptions();

    expect(slotMachine.getBetOptions).toHaveBeenCalled();
    expect(result.options).toContain(0.5);
    expect(result.options).toContain(5);
  });

  it('should complete a successful spin and update balance', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.spinHistory.create.mockResolvedValue(mockSpinRecord);

    slotMachine.spin.mockReturnValue({
      reels: ['cherry', 'cherry', 'lemon'],
      multiplier: 40,
      payoutRule: '2 cherries',
    });

    const result = await service.spin('user-uuid-1', {
      betAmount: 1,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'user-uuid-1',
      },
      select: {
        id: true,
        balance: true,
      },
    });

    expect(slotMachine.spin).toHaveBeenCalled();

    expect(prisma.user.update).toHaveBeenCalled();

    const updateArg = prisma.user.update.mock.calls[0][0];
    expect(updateArg.where).toEqual({
      id: 'user-uuid-1',
    });
    expect(updateArg.data.balance.toString()).toBe('59');

    expect(prisma.spinHistory.create).toHaveBeenCalled();

    const createArg = prisma.spinHistory.create.mock.calls[0][0];

    expect(createArg.data.userId).toBe('user-uuid-1');
    expect(createArg.data.gameId).toBeNull();
    expect(createArg.data.betAmount.toString()).toBe('1');
    expect(createArg.data.winAmount.toString()).toBe('40');
    expect(createArg.data.netAmount.toString()).toBe('39');
    expect(createArg.data.balanceBefore.toString()).toBe('20');
    expect(createArg.data.balanceAfter.toString()).toBe('59');
    expect(createArg.data.reel1).toBe('cherry');
    expect(createArg.data.reel2).toBe('cherry');
    expect(createArg.data.reel3).toBe('lemon');

    expect(result).toEqual({
      spinId: 'spin-uuid-1',
      roundId: 'round-uuid-1',
      reels: ['cherry', 'cherry', 'lemon'],
      betAmount: 1,
      winAmount: 40,
      amountWonLost: 39,
      balanceBefore: 20,
      balanceAfter: 59,
      updatedBalance: 59,
      timestamp: mockSpinRecord.spunAt,
    });
  });

  it('should reject spin when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    slotMachine.spin.mockReturnValue({
      reels: ['apple', 'apple', 'apple'],
      multiplier: 20,
      payoutRule: '3 apples',
    });

    await expect(
      service.spin('missing-user-id', {
        betAmount: 1,
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.spinHistory.create).not.toHaveBeenCalled();
  });

  it('should reject spin when balance is insufficient', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid-1',
      balance: decimal('0.25'),
    });

    slotMachine.spin.mockReturnValue({
      reels: ['banana', 'banana', 'banana'],
      multiplier: 15,
      payoutRule: '3 bananas',
    });

    await expect(
      service.spin('user-uuid-1', {
        betAmount: 1,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.spinHistory.create).not.toHaveBeenCalled();
  });

  it('should reject spin when gameId is provided but game is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.game.findUnique.mockResolvedValue(null);

    slotMachine.spin.mockReturnValue({
      reels: ['cherry', 'cherry', 'cherry'],
      multiplier: 50,
      payoutRule: '3 cherries',
    });

    await expect(
      service.spin('user-uuid-1', {
        betAmount: 1,
        gameId: 'game-uuid-1',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.game.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'game-uuid-1',
      },
      select: {
        id: true,
      },
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.spinHistory.create).not.toHaveBeenCalled();
  });

  it('should allow spin with valid gameId', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.game.findUnique.mockResolvedValue({
      id: 'game-uuid-1',
    });
    prisma.spinHistory.create.mockResolvedValue({
      ...mockSpinRecord,
      winAmount: decimal('0.00'),
      netAmount: decimal('-1.00'),
      balanceAfter: decimal('19.00'),
      reel1: 'apple',
      reel2: 'cherry',
      reel3: 'apple',
    });

    slotMachine.spin.mockReturnValue({
      reels: ['apple', 'cherry', 'apple'],
      multiplier: 0,
      payoutRule: null,
    });

    const result = await service.spin('user-uuid-1', {
      betAmount: 1,
      gameId: 'game-uuid-1',
    });

    const createArg = prisma.spinHistory.create.mock.calls[0][0];

    expect(createArg.data.gameId).toBe('game-uuid-1');
    expect(result.amountWonLost).toBe(-1);
    expect(result.updatedBalance).toBe(19);
  });

  it('should return paginated spin history', async () => {
    prisma.spinHistory.count.mockResolvedValue(1);
    prisma.spinHistory.findMany.mockResolvedValue([
      {
        ...mockSpinRecord,
        game: {
          id: 'game-uuid-1',
          name: 'Fire-Lightning',
          slug: 'fire-lightning',
          thumbnailUrl: 'https://example.com/game.webp',
        },
      },
    ]);

    const result = await service.getHistory('user-uuid-1', {
      page: 1,
      limit: 10,
    });

    expect(prisma.spinHistory.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-uuid-1',
      },
    });

    expect(prisma.spinHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-uuid-1',
        },
        skip: 0,
        take: 10,
        orderBy: {
          spunAt: 'desc',
        },
      }),
    );

    expect(result).toEqual({
      data: [
        {
          id: 'spin-uuid-1',
          roundId: 'round-uuid-1',
          reels: ['cherry', 'cherry', 'lemon'],
          betAmount: 1,
          winAmount: 40,
          amountWonLost: 39,
          balanceBefore: 20,
          balanceAfter: 59,
          game: {
            id: 'game-uuid-1',
            name: 'Fire-Lightning',
            slug: 'fire-lightning',
            thumbnailUrl: 'https://example.com/game.webp',
          },
          spunAt: mockSpinRecord.spunAt,
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
});