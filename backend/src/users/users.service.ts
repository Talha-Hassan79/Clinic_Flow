import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { InviteUserDto, UpdateUserRoleDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async listUsers(clinicId: string) {
    return this.prisma.user.findMany({
      where: {
        clinicId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        invitationToken: true,
        lastLogin: true,
        createdAt: true,
        role: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteUser(clinicId: string, dto: InviteUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('The specified role was not found.');
    }

    // Generate unique invitation token
    const invitationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Initial placeholder hash until user accepts & chooses their own password
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        clinicId,
        roleId: dto.roleId,
        isActive: false, // inactive until approved
        invitationStatus: 'INVITED' as any,
        invitationToken,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        invitationToken: true,
        lastLogin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    // If role is Doctor, also automatically create their Doctor clinical profile!
    if (role.name === 'Doctor') {
      const existingDoc = await this.prisma.doctor.findFirst({
        where: { userId: user.id },
      });
      if (!existingDoc) {
        const fullName = `${dto.firstName} ${dto.lastName}`.trim();
        const bioPayload = JSON.stringify({
          name: fullName,
          schedule: 'Mon - Fri: 09:00 AM - 05:00 PM',
          bio: 'Attending Physician',
        });

        await this.prisma.doctor.create({
          data: {
            clinicId,
            userId: user.id,
            specialization: 'General Physician',
            qualification: 'MBBS',
            bio: bioPayload,
            isAvailable: true,
          },
        });
      }
    }

    return {
      ...user,
      invitationLink: `/invite/accept?token=${invitationToken}`,
      tempPassword,
    };
  }

  // Public: Get invitation details for the invited staff member
  async getInvitationByToken(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { invitationToken: token },
      include: {
        role: { select: { id: true, name: true } },
        clinic: { select: { id: true, name: true, email: true, logoUrl: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Invitation not found or link has expired.');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleName: user.role.name,
      clinicName: user.clinic.name,
      clinicLogo: user.clinic.logoUrl,
      invitationStatus: user.invitationStatus,
    };
  }

  // Public: Staff responds (Accepts or Declines invitation + sets password)
  async respondInvitation(dto: { token: string; response: 'ACCEPT' | 'DECLINE'; password?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { invitationToken: dto.token },
    });

    if (!user) {
      throw new NotFoundException('Invitation link is invalid or has expired.');
    }

    if (user.invitationStatus === ('ACTIVE' as any)) {
      throw new ConflictException('This invitation has already been accepted and activated.');
    }

    if (dto.response === 'DECLINE') {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          invitationStatus: 'DECLINED' as any,
          isActive: false,
        },
      });
    }

    // User ACCEPTED -> update password and set to ACCEPTED (Awaiting Clinic Owner Final Sign-off)
    let passwordHash = user.passwordHash;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        invitationStatus: 'ACCEPTED' as any,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        invitationStatus: true,
      },
    });
  }

  // Admin approves accepted staff member -> sets isActive = true
  async approveInvitation(clinicId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, clinicId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        invitationStatus: 'ACTIVE' as any,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async updateRole(clinicId: string, userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, clinicId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found in this workspace.');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('The specified role was not found.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: dto.roleId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        lastLogin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async deactivateUser(clinicId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, clinicId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found in this workspace.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        lastLogin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async reactivateUser(clinicId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, clinicId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found in this workspace.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        invitationStatus: true,
        lastLogin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
