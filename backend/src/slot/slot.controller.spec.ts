import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';

describe('SlotController', () => {
  let controller: SlotController;

  const slotService = {
    getBetOptions: jest.fn(),
    spin: jest.fn(),
    getHistory: jest.fn(),
  };

  const jwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotController],
      providers: [
        {
          provide: SlotService,
          useValue: slotService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    controller = module.get<SlotController>(SlotController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return bet options', () => {
    const mockBetOptions = {
      min: 0.5,
      max: 5,
      step: 0.5,
      options: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    };

    slotService.getBetOptions.mockReturnValue(mockBetOptions);

    const result = controller.getBetOptions();

    expect(slotService.getBetOptions).toHaveBeenCalled();
    expect(result).toEqual(mockBetOptions);
  });

  it('should call slotService.spin with current user id and spin dto', async () => {
    const currentUser = {
      sub: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
    };

    const dto = {
      betAmount: 1,
      gameId: 'game-uuid-1',
    };

    const mockResponse = {
      spinId: 'spin-uuid-1',
      roundId: 'round-uuid-1',
      reels: ['cherry', 'cherry', 'lemon'],
      betAmount: 1,
      winAmount: 40,
      amountWonLost: 39,
      balanceBefore: 20,
      balanceAfter: 59,
      updatedBalance: 59,
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    };

    slotService.spin.mockResolvedValue(mockResponse);

    const result = await controller.spin(currentUser, dto);

    expect(slotService.spin).toHaveBeenCalledWith('user-uuid-1', dto);
    expect(result).toEqual(mockResponse);
  });

  it('should call slotService.getHistory with current user id and query', async () => {
    const currentUser = {
      sub: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
    };

    const query = {
      page: 1,
      limit: 10,
    };

    const mockHistory = {
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

    slotService.getHistory.mockResolvedValue(mockHistory);

    const result = await controller.getHistory(currentUser, query);

    expect(slotService.getHistory).toHaveBeenCalledWith('user-uuid-1', query);
    expect(result).toEqual(mockHistory);
  });
});