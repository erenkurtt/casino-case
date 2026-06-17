import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  let jwtService: {
    signAsync: jest.Mock;
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'eren@test.com',
    username: 'eren',
    passwordHash: 'hashed-password',
    balance: {
      toString: () => '20.00',
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return safe user with access token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'eren@test.com',
        username: 'eren',
        password: 'Password123',
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'eren@test.com' }, { username: 'eren' }],
        },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'eren@test.com',
          username: 'eren',
          passwordHash: 'hashed-password',
          countryId: undefined,
        },
        select: {
          id: true,
          email: true,
          username: true,
          balance: true,
          createdAt: true,
        },
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-uuid-1',
          email: 'eren@test.com',
          username: 'eren',
        },
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: expect.any(String),
        }),
      );

      expect(result).toEqual({
        user: {
          id: 'user-uuid-1',
          email: 'eren@test.com',
          username: 'eren',
          balance: 20,
          createdAt: mockUser.createdAt,
        },
        accessToken: 'mock-access-token',
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email or username already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-user-id',
        email: 'eren@test.com',
        username: 'eren',
      });

      await expect(
        service.register({
          email: 'eren@test.com',
          username: 'eren',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and return access token when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'eren@test.com',
        password: 'Password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'eren@test.com',
        },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          balance: true,
          createdAt: true,
        },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password123',
        'hashed-password',
      );

      expect(result).toEqual({
        user: {
          id: 'user-uuid-1',
          email: 'eren@test.com',
          username: 'eren',
          balance: 20,
          createdAt: mockUser.createdAt,
        },
        accessToken: 'mock-access-token',
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'wrong@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'eren@test.com',
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return safe user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-uuid-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-uuid-1',
        },
        select: {
          id: true,
          email: true,
          username: true,
          balance: true,
          createdAt: true,
        },
      });

      expect(result).toEqual({
        id: 'user-uuid-1',
        email: 'eren@test.com',
        username: 'eren',
        balance: 20,
        createdAt: mockUser.createdAt,
      });

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('missing-user-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});