import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteUserDto, RespondInvitationDto, UpdateUserRoleDto } from './dto/user.dto';
import { UsersService } from './users.service';

const ADMIN_ROLES = ['Clinic Owner', 'Super Admin'];

@ApiTags('User Management')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Public Invitation Endpoints (no JWT required) ────────────────────────

  @Get('invite/:token')
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  @ApiResponse({ status: 200, description: 'Invitation details returned' })
  @ApiResponse({ status: 404, description: 'Token not found or expired' })
  getInvitation(@Param('token') token: string) {
    return this.usersService.getInvitationByToken(token);
  }

  @Post('invite/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or decline an invitation (public)' })
  @ApiResponse({ status: 200, description: 'Response recorded' })
  respondInvitation(@Body() dto: RespondInvitationDto) {
    return this.usersService.respondInvitation({
      token: dto.token,
      response: dto.response,
      password: dto.password,
    });
  }

  // ─── Authenticated Endpoints ──────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all users in the current clinic workspace' })
  listUsers(@Req() req: any) {
    return this.usersService.listUsers(req.user.clinicId);
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all available roles for assignment' })
  listRoles() {
    return this.usersService.listRoles();
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a new user to the clinic workspace' })
  @ApiResponse({ status: 201, description: 'User invited successfully with invitation link' })
  inviteUser(@Req() req: any, @Body() dto: InviteUserDto) {
    if (!ADMIN_ROLES.includes(req.user.roleName)) {
      throw new ForbiddenException('Only Clinic Owners can invite new users.');
    }
    return this.usersService.inviteUser(req.user.clinicId, dto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin approves an accepted invitation — activates the user account' })
  approveInvitation(@Req() req: any, @Param('id') userId: string) {
    if (!ADMIN_ROLES.includes(req.user.roleName)) {
      throw new ForbiddenException('Only Clinic Owners can approve invitations.');
    }
    return this.usersService.approveInvitation(req.user.clinicId, userId);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user role assignment' })
  updateRole(
    @Req() req: any,
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    if (!ADMIN_ROLES.includes(req.user.roleName)) {
      throw new ForbiddenException('Only Clinic Owners can change user roles.');
    }
    return this.usersService.updateRole(req.user.clinicId, userId, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivateUser(@Req() req: any, @Param('id') userId: string) {
    if (!ADMIN_ROLES.includes(req.user.roleName)) {
      throw new ForbiddenException('Only Clinic Owners can deactivate accounts.');
    }
    return this.usersService.deactivateUser(req.user.clinicId, userId);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a previously deactivated user account' })
  reactivateUser(@Req() req: any, @Param('id') userId: string) {
    if (!ADMIN_ROLES.includes(req.user.roleName)) {
      throw new ForbiddenException('Only Clinic Owners can reactivate accounts.');
    }
    return this.usersService.reactivateUser(req.user.clinicId, userId);
  }
}
