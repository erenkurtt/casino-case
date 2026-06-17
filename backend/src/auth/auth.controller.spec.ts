import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
  };

  const jwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockAuthResponse = {
    user: {
      id: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
      balance: 20,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    accessToken: 'mock-access-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register with register dto', async () => {
    const dto = {
      email: 'eren@test.com',
      username: 'eren',
      password: 'Password123',
    };

    authService.register.mockResolvedValue(mockAuthResponse);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockAuthResponse);
  });

  it('should call authService.login with login dto', async () => {
    const dto = {
      email: 'eren@test.com',
      password: 'Password123',
    };

    authService.login.mockResolvedValue(mockAuthResponse);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockAuthResponse);
  });

  it('should call authService.getMe with current user id', async () => {
    const currentUser = {
      sub: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
    };

    const mockUser = {
      id: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
      balance: 20,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    authService.getMe.mockResolvedValue(mockUser);

    const result = await controller.me(currentUser);

    expect(authService.getMe).toHaveBeenCalledWith('user-uuid-1');
    expect(result).toEqual(mockUser);
  });
});