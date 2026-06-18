import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class RegisterDto {
  @ApiProperty({
    example: 'eren@test.com',
    description: 'User email address',
  })
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({
    example: 'eren',
    description: 'Unique username',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers and underscore',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username!: string;


  @ApiProperty({
    example: 'Password123',
    description: 'User password. Minimum 8 characters.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiPropertyOptional({
    example: 'country-uuid',
    description: 'Optional country id',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}