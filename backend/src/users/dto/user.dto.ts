import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class InviteUserDto {
  @ApiProperty({ example: 'Ayesha' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'ayesha@citydental.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'role-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  roleId!: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'role-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  roleId!: string;
}

export class RespondInvitationDto {
  @ApiProperty({ example: 'inv-token-uuid-or-random' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'ACCEPT', enum: ['ACCEPT', 'DECLINE'] })
  @IsNotEmpty()
  @IsString()
  response!: 'ACCEPT' | 'DECLINE';

  @ApiPropertyOptional({ example: 'MySecurePassword123!' })
  @IsOptional()
  @IsString()
  password?: string;
}

