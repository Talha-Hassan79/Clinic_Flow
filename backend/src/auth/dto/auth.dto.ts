import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterClinicDto {
  @ApiProperty({ example: 'City Health Clinic', description: 'Name of the clinic' })
  @IsString()
  @IsNotEmpty()
  clinicName!: string;

  @ApiProperty({ example: 'Ahmed', description: 'Clinic Owner First Name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Khan', description: 'Clinic Owner Last Name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'dr.ahmed@cityhealth.com', description: 'Clinic Owner Email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account Password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '+92 300 1234567', description: 'Contact Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'dr.ahmed@cityhealth.com', description: 'User Email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account Password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid Refresh Token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'dr.ahmed@cityhealth.com', description: 'Registered Email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token received in email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'New Account Password' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
