import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, DeleteProfileDto, UpdateProfileDto } from './dto/update-profile.dto';
import { elapsedMs, logPerf, measurePerf, nowMs } from '../common/utils/perf-log';

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

interface TokenUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  private signAccessToken(user: TokenUser): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private toSafeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
      avatar: user.avatar,
    };
  }

  private async createSession(user: TokenUser, meta?: SessionMeta): Promise<string> {
    const refreshToken = this.generateRefreshToken();
    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshHash: this.hashRefreshToken(refreshToken),
        userAgent: meta?.userAgent?.slice(0, 500) ?? null,
        ip: meta?.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return refreshToken;
  }

  async login(loginDto: LoginDto, meta?: SessionMeta) {
    const startedAt = nowMs();
    const parts: Record<string, number> = {};

    const user = await measurePerf<Awaited<ReturnType<typeof this.prisma.user.findUnique>>>(
      'findUser',
      () =>
        this.prisma.user.findUnique({
          where: { email: loginDto.email },
        }),
      parts,
    );

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt');
    }

    const isPasswordValid = await measurePerf(
      'passwordCompare',
      () => bcrypt.compare(loginDto.password, user.password),
      parts,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessToken = await measurePerf(
      'jwtSign',
      async () => this.signAccessToken(user),
      parts,
    );
    const refreshToken = await this.createSession(user, meta);
    logPerf(
      `AuthService.login total=${elapsedMs(startedAt)}ms ` +
        Object.entries(parts)
          .map(([key, value]) => `${key}=${value}ms`)
          .join(' '),
    );

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  async register(registerDto: RegisterDto, meta?: SessionMeta) {
    // This is a public endpoint.  Roles with operational privileges must only
    // be provisioned by the administrative user-management flow.
    if (registerDto.role && registerDto.role !== 'STUDENT') {
      throw new ForbiddenException('Đăng ký công khai chỉ có thể tạo tài khoản sinh viên');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        passwordChangedAt: new Date(),
        fullName: registerDto.fullName,
        role: 'STUDENT',
        studentId: registerDto.studentId,
        department: registerDto.department,
      },
    });

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createSession(user, meta);

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        studentId: true,
        department: true,
        avatar: true,
        status: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt');
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });
      if (emailInUse) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const data: any = {
      email: updateProfileDto.email,
      fullName: updateProfileDto.fullName,
      department: updateProfileDto.department,
    };

    if (user.role === 'STUDENT') {
      data.studentId = updateProfileDto.studentId;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        studentId: true,
        department: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, status: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const isSameAsCurrent = await bcrypt.compare(changePasswordDto.newPassword, user.password);
    if (isSameAsCurrent) {
      throw new ConflictException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword, passwordChangedAt: new Date() },
    });

    // A password change invalidates every existing session and token.
    await this.revokeAllUserSessions(userId);

    return { message: 'Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async deleteProfile(userId: string, deleteProfileDto: DeleteProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, status: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt');
    }

    const isCurrentPasswordValid = await bcrypt.compare(deleteProfileDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'deleted' },
    });

    return { message: 'Đã xóa hồ sơ thành công' };
  }

  async rotateSession(refreshToken: string, meta?: SessionMeta) {
    const refreshHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findFirst({ where: { refreshHash } });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã được sử dụng');
    }
    if (session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt');
    }

    // Rotation: the old refresh token is single-use; issue a fresh pair.
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const newRefreshToken = await this.createSession(user, meta);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: newRefreshToken,
      user: this.toSafeUser(user),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const refreshHash = this.hashRefreshToken(refreshToken);
      await this.prisma.authSession.updateMany({
        where: { refreshHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Đã đăng xuất' };
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
    return sessions.map((s) => ({
      ...s,
      active: !s.revokedAt && s.expiresAt.getTime() > Date.now(),
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) {
      throw new UnauthorizedException('Không tìm thấy phiên đăng nhập');
    }
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { message: 'Đã hủy phiên đăng nhập' };
  }

  async revokeAllUserSessions(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Đã hủy toàn bộ phiên đăng nhập' };
  }
}
