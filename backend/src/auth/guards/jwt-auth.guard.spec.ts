import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const jwtService = {
    verifyAsync: jest.fn(),
  };

  const createExecutionContext = (headers: Record<string, string> = {}) => {
    const request = {
      headers,
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException when authorization header is missing', async () => {
    const context = createExecutionContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when authorization type is not Bearer', async () => {
    const context = createExecutionContext({
      authorization: 'Basic token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const context = createExecutionContext({
      authorization: 'Bearer invalid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).toHaveBeenCalled();
  });

  it('should attach user to request and return true when token is valid', async () => {
    const payload = {
      sub: 'user-uuid-1',
      email: 'eren@test.com',
      username: 'eren',
    };

    jwtService.verifyAsync.mockResolvedValue(payload);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({
        secret: expect.any(String),
      }),
    );
  });
});