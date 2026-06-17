import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants/jwt.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

type SafeUser = {
  id: string;
  email: string;
  username: string;
  balance: number;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        countryId: dto.countryId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        createdAt: true,
      },
    });

    const safeUser = this.toSafeUser(user);
    const accessToken = await this.signToken(safeUser);

    return {
      user: safeUser,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
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

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser = this.toSafeUser(user);
    const accessToken = await this.signToken(safeUser);

    return {
      user: safeUser,
      accessToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toSafeUser(user);
  }

  private async signToken(user: SafeUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return this.jwtService.signAsync(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expiresIn,
    });
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    username: string;
    balance: { toString: () => string };
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: Number(user.balance.toString()),
      createdAt: user.createdAt,
    };
  }
}