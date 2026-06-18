import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetGamesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiPropertyOptional({ example: 1 })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ example: 'fire' })
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ example: 'BGaming' })
  providerName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  @ApiPropertyOptional({ example: 'TR' })
  country?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @ApiPropertyOptional({ example: 'slot' })
  gameType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'providerName'])
  @ApiPropertyOptional({
    enum: ['name', 'createdAt', 'providerName'],
    example: 'createdAt',
  })
  sortBy?: 'name' | 'createdAt' | 'providerName' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}