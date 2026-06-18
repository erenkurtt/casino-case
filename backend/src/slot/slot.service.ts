import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetSpinHistoryQueryDto } from './dto/get-spin-history-query.dto';
import { SpinDto } from './dto/spin.dto';
import { SlotMachineService } from './slot-machine.service';

@Injectable()
export class SlotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotMachine: SlotMachineService,
  ) {}

  getBetOptions() {
    return this.slotMachine.getBetOptions();
  }

  async spin(userId: string, dto: SpinDto) {
    const betAmount = new Prisma.Decimal(dto.betAmount.toString());
    const spinResult = this.slotMachine.spin();

    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            balance: true,
          },
        });

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        if (dto.gameId) {
          const game = await tx.game.findUnique({
            where: {
              id: dto.gameId,
            },
            select: {
              id: true,
            },
          });

          if (!game) {
            throw new NotFoundException('Game not found');
          }
        }

        const balanceBefore = new Prisma.Decimal(user.balance.toString());

        if (balanceBefore.lt(betAmount)) {
          throw new BadRequestException('Insufficient balance');
        }

        const winAmount = betAmount.mul(spinResult.multiplier);
        const netAmount = winAmount.sub(betAmount);
        const balanceAfter = balanceBefore.sub(betAmount).add(winAmount);

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            balance: balanceAfter,
          },
        });

        const spin = await tx.spinHistory.create({
          data: {
            userId,
            gameId: dto.gameId ?? null,
            roundId: randomUUID(),

            betAmount,
            winAmount,
            netAmount,
            balanceBefore,
            balanceAfter,

            reel1: spinResult.reels[0],
            reel2: spinResult.reels[1],
            reel3: spinResult.reels[2],

            currency: 'COI',
            resultData: {
              reels: spinResult.reels,
              multiplier: spinResult.multiplier,
              payoutRule: spinResult.payoutRule,
            },
          },
          select: {
            id: true,
            roundId: true,
            betAmount: true,
            winAmount: true,
            netAmount: true,
            balanceBefore: true,
            balanceAfter: true,
            reel1: true,
            reel2: true,
            reel3: true,
            spunAt: true,
          },
        });

        return {
          spinId: spin.id,
          roundId: spin.roundId,
          reels: [spin.reel1, spin.reel2, spin.reel3],
          betAmount: this.toNumber(spin.betAmount),
          winAmount: this.toNumber(spin.winAmount),
          amountWonLost: this.toNumber(spin.netAmount),
          balanceBefore: this.toNumber(spin.balanceBefore),
          balanceAfter: this.toNumber(spin.balanceAfter),
          updatedBalance: this.toNumber(spin.balanceAfter),
          timestamp: spin.spunAt,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async getHistory(userId: string, query: GetSpinHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, history] = await this.prisma.$transaction([
      this.prisma.spinHistory.count({
        where: {
          userId,
        },
      }),
      this.prisma.spinHistory.findMany({
        where: {
          userId,
        },
        skip,
        take: limit,
        orderBy: {
          spunAt: 'desc',
        },
        select: {
          id: true,
          roundId: true,
          betAmount: true,
          winAmount: true,
          netAmount: true,
          balanceBefore: true,
          balanceAfter: true,
          reel1: true,
          reel2: true,
          reel3: true,
          spunAt: true,
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: history.map((spin) => ({
        id: spin.id,
        roundId: spin.roundId,
        reels: [spin.reel1, spin.reel2, spin.reel3],
        betAmount: this.toNumber(spin.betAmount),
        winAmount: this.toNumber(spin.winAmount),
        amountWonLost: this.toNumber(spin.netAmount),
        balanceBefore: this.toNumber(spin.balanceBefore),
        balanceAfter: this.toNumber(spin.balanceAfter),
        game: spin.game,
        spunAt: spin.spunAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private toNumber(value: { toString: () => string }): number {
    return Number(value.toString());
  }
}