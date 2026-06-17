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

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers and underscore',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}