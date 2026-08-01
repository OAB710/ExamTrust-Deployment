import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: { sub: string; email: string; role: string; iat?: number }) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
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
        passwordChangedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Tokens issued before the last password change are no longer valid.
    if (user.passwordChangedAt) {
      const issuedAtSec = payload.iat ?? 0;
      const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (issuedAtSec < changedAtSec) {
        throw new UnauthorizedException('Session expired due to a password change. Please login again.');
      }
    }

    return user;
  }
}
