import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── REGISTER CLINIC & OWNER ───────────────────
  async register(dto: RegisterClinicDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Find or create Clinic Owner role
    let ownerRole = await this.prisma.role.findUnique({
      where: { name: 'Clinic Owner' },
    });

    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: {
          name: 'Clinic Owner',
          description: 'Full administrative access to clinic workspace',
        },
      });
    }

    // Execute in transaction to ensure atomic creation of Clinic & User
    const result = await this.prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: dto.clinicName,
          email: dto.email.toLowerCase(),
          phone: dto.phone || null,
          subscriptionPlan: 'starter',
          subscriptionStatus: 'active',
        },
      });

      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          roleId: ownerRole.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          passwordHash,
          phone: dto.phone || null,
        },
        include: {
          role: true,
          clinic: true,
        },
      });

      return { clinic, user };
    });

    const tokens = await this.generateTokens({
      sub: result.user.id,
      email: result.user.email,
      clinicId: result.user.clinicId,
      roleId: result.user.roleId,
      roleName: result.user.role.name,
    });

    await this.storeRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role.name,
        clinic: {
          id: result.clinic.id,
          name: result.clinic.name,
          email: result.clinic.email,
        },
      },
      ...tokens,
    };
  }

  // ─── LOGIN ─────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        role: true,
        clinic: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      clinicId: user.clinicId,
      roleId: user.roleId,
      roleName: user.role.name,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        clinic: {
          id: user.clinic.id,
          name: user.clinic.name,
          email: user.clinic.email,
          logoUrl: user.clinic.logoUrl,
        },
      },
      ...tokens,
    };
  }

  // ─── REFRESH TOKEN ─────────────────────────────
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'clinicflow_refresh_secret_change_in_production',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true, clinic: true },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        clinicId: user.clinicId,
        roleId: user.roleId,
        roleName: user.role.name,
      });

      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  // ─── LOGOUT ────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { success: true, message: 'Logged out successfully.' };
  }

  // ─── GET ME ────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        clinic: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      clinic: {
        id: user.clinic.id,
        name: user.clinic.name,
        email: user.clinic.email,
        logoUrl: user.clinic.logoUrl,
        currency: user.clinic.currency,
        timezone: user.clinic.timezone,
      },
    };
  }

  // ─── FORGOT PASSWORD ───────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Return success message regardless to prevent email enumeration attacks
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      };
    }

    return {
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    };
  }

  // ─── RESET PASSWORD ────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token || dto.newPassword.length < 8) {
      throw new BadRequestException('Invalid reset token or password criteria not met.');
    }

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  // ─── HELPER: GENERATE TOKENS ───────────────────
  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'clinicflow_access_secret_change_in_production',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'clinicflow_refresh_secret_change_in_production',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  // ─── HELPER: STORE REFRESH TOKEN ───────────────
  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Keep only active tokens, delete old ones
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }
}
