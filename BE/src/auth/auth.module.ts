import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RateLimiterService } from '../common/rate-limiter.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          // Fail-fast: never run with a known/predictable signing secret.
          throw new Error('JWT_SECRET must be set in the environment. Refusing to start.');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        return { secret, signOptions: { expiresIn } };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, RateLimiterService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
