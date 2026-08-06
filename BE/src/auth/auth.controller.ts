import { Controller, Post, Body, Get, UseGuards, Request, Patch, Delete, Param, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto, DeleteProfileDto, UpdateProfileDto } from './dto/update-profile.dto';
import { ApiTags } from '@nestjs/swagger';
import { RateLimiterService } from '../common/rate-limiter.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  private sessionMeta(req: any) {
    return {
      userAgent: String(req.headers?.['user-agent'] || '').slice(0, 500) || undefined,
      ip: req.ip || undefined,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    // Login rate limit is fail-closed on purpose (brute-force protection).
    const ip = req.ip || 'unknown';
    const emailKey = String(loginDto.email || '').toLowerCase().trim();
    const strictChecks = [
      this.rateLimiter.consumeStrict(`rl:login:ip:${ip}`, 20, 1 / 30),
      ...(emailKey ? [this.rateLimiter.consumeStrict(`rl:login:email:${emailKey}`, 5, 1 / 60)] : []),
    ];
    const results = await Promise.all(strictChecks);
    if (results.some((r) => !r.allowed)) {
      throw new UnauthorizedException('Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.');
    }

    const result = await this.authService.login(loginDto, this.sessionMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken, ...rest } = result;
    return rest;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto, this.sessionMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken, ...rest } = result;
    return rest;
  }

  @Post('refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    const result = await this.authService.rotateSession(refreshToken, this.sessionMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }

  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearRefreshCookie(res);
    return { message: 'Đã đăng xuất' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteProfile(@Request() req, @Body() deleteProfileDto: DeleteProfileDto) {
    return this.authService.deleteProfile(req.user.id, deleteProfileDto);
  }

  // ---- Session management (Phase 5) ----
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async listSessions(@Request() req) {
    return this.authService.listSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  async revokeAllSessions(@Request() req) {
    return this.authService.revokeAllUserSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/revoke')
  async revokeSession(@Request() req, @Param('id') sessionId: string) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }

  // Admin can force-revoke every session of a user (e.g. after confirmed cheating).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('users/:userId/sessions/revoke')
  async revokeUserSessions(@Param('userId') userId: string) {
    return this.authService.revokeAllUserSessions(userId);
  }
}
