import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin', 'super_admin'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
