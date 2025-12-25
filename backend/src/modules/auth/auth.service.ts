import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { HashService } from '../../common/utils';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponseDto,
  AuthUserResponseDto,
  TokenResponseDto,
} from './dto';
import { User, UserStatus } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private hashService: HashService,
    private eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.hashService.hashPassword(dto.password);

    // Generate email verification token
    const verificationToken = this.hashService.generateRandomToken();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'WORKER',
        timezone: dto.timezone || 'UTC',
        preferredLanguage: dto.preferredLanguage || 'en',
        status: UserStatus.PENDING,
        verificationToken: this.hashService.hashToken(verificationToken),
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Emit user created event
    this.eventEmitter.emit('user.created', {
      userId: user.id,
      email: user.email,
      verificationToken,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.mapUserToResponse(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      // Log failed attempt
      await this.recordFailedLoginAttempt(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is locked
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return partial response indicating 2FA is required
      throw new UnauthorizedException({
        message: 'Two-factor authentication required',
        requires2FA: true,
        userId: user.id,
      });
    }

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, dto.rememberMe);

    // Emit login event
    this.eventEmitter.emit('user.login', { userId: user.id });

    return {
      user: this.mapUserToResponse(user),
      tokens,
    };
  }

  async loginWith2FA(
    userId: string,
    code: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled for this user');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.mapUserToResponse(user),
      tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.hashService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Blacklist the old refresh token
    const hashedToken = this.hashService.hashToken(refreshToken);
    const refreshTtl = this.configService.get<number>('jwt.refreshExpiresIn');
    await this.redis.setex(`blacklist:${hashedToken}`, refreshTtl, '1');

    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Blacklist the access token
    const hashedToken = this.hashService.hashToken(accessToken);
    const accessTtl = this.configService.get<number>('jwt.expiresIn');
    await this.redis.setex(`blacklist:${hashedToken}`, accessTtl, '1');

    // Emit logout event
    this.eventEmitter.emit('user.logout', { userId });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = this.hashService.generateRandomToken();
    const hashedToken = this.hashService.hashToken(resetToken);

    // Store reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Emit password reset requested event
    this.eventEmitter.emit('user.passwordResetRequested', {
      userId: user.id,
      email: user.email,
      resetToken,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = this.hashService.hashToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashService.hashPassword(dto.password);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    // Emit password changed event
    this.eventEmitter.emit('user.passwordChanged', { userId: user.id });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.hashService.comparePassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await this.hashService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Emit password changed event
    this.eventEmitter.emit('user.passwordChanged', { userId });
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = this.hashService.hashToken(token);

    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: UserStatus.ACTIVE,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Emit email verified event
    this.eventEmitter.emit('user.emailVerified', { userId: user.id });
  }

  async enable2FA(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Laboro (${user.email})`,
      issuer: 'Laboro',
    });

    // Store secret temporarily (user needs to verify before it's enabled)
    await this.redis.setex(
      `2fa:setup:${userId}`,
      600, // 10 minutes
      secret.base32,
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async verify2FASetup(userId: string, code: string): Promise<void> {
    const secret = await this.redis.get(`2fa:setup:${userId}`);

    if (!secret) {
      throw new BadRequestException('2FA setup session expired');
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    // Clean up setup session
    await this.redis.del(`2fa:setup:${userId}`);

    // Emit 2FA enabled event
    this.eventEmitter.emit('user.2faEnabled', { userId });
  }

  async disable2FA(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Emit 2FA disabled event
    this.eventEmitter.emit('user.2faDisabled', { userId });
  }

  private async generateTokens(
    user: User,
    rememberMe: boolean = false,
  ): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.currentOrganizationId,
    };

    const accessExpiresIn = this.configService.get<number>('jwt.expiresIn');
    const refreshExpiresIn = rememberMe
      ? this.configService.get<number>('jwt.expiresIn') * 7 // 7x longer for remember me
      : this.configService.get<number>('jwt.refreshExpiresIn');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      tokenType: 'Bearer',
    };
  }

  private mapUserToResponse(user: User): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      timezone: user.timezone || undefined,
      preferredLanguage: user.preferredLanguage || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
    };
  }

  private async recordFailedLoginAttempt(email: string): Promise<void> {
    const key = `login:failed:${email.toLowerCase()}`;
    const attempts = await this.redis.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    await this.redis.setex(key, 3600, String(currentAttempts + 1)); // 1 hour window

    // Lock account after 5 failed attempts
    if (currentAttempts + 1 >= 5) {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.SUSPENDED },
        });

        this.eventEmitter.emit('user.accountLocked', { userId: user.id });
      }
    }
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.redis.del(`login:failed:${user.email.toLowerCase()}`);
    }
  }
}
