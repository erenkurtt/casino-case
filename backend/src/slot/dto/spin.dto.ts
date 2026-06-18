import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const BET_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export class SpinDto {
    @ApiProperty({
        example: 1,
        minimum: 0.5,
        maximum: 5,
        description: 'Bet amount. Must be between 0.50 and 5.00 in 0.50 increments.',
    })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.5)
    @Max(5)
    @IsIn(BET_OPTIONS, {
        message: 'betAmount must be between 0.50 and 5.00 in 0.50 increments',
    })
    betAmount!: number;


    @ApiPropertyOptional({
        example: 'game-uuid',
        description: 'Optional game id',
    })
    @IsOptional()
    @IsUUID()
    gameId?: string;
}