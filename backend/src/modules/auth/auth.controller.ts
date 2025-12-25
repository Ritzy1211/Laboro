import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  Verify2FADto,
  LoginWith2FADto,
  AuthResponseDto,
  MessageResponseDto,
  Enable2FAResponseDto,
} from './dto';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async loginWith2FA(@Body() dto: LoginWith2FADto): Promise<AuthResponseDto> {
    // First validate credentials
    const partialLogin = await this.authService.login(dto).catch((error) => {
      if (error.response?.requires2FA) {
        return error.response;
      }
      throw error;
    });

    if (partialLogin.requires2FA && dto.twoFactorCode) {
      return this.authService.loginWith2FA(
        partialLogin.userId,
        dto.twoFactorCode,
      );
    }

    return partialLogin;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200 })
  async refreshTokens(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
  ) {
    const user = req.user as any;
    return this.authService.refreshTokens(user.id, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ): Promise<MessageResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(userId, token);
    }
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.forgotPassword(dto);
    return {
      message: 'If an account with that email exists, a reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.resetPassword(dto);
    return { message: 'Password has been reset successfully' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password while logged in' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200 })
  async getCurrentUser(@CurrentUser() user: any) {
    return { user };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, type: Enable2FAResponseDto })
  async enable2FA(
    @CurrentUser('id') userId: string,
  ): Promise<Enable2FAResponseDto> {
    return this.authService.enable2FA(userId);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and complete 2FA setup' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async verify2FASetup(
    @CurrentUser('id') userId: string,
    @Body() dto: Verify2FADto,
  ): Promise<MessageResponseDto> {
    await this.authService.verify2FASetup(userId, dto.code);
    return { message: 'Two-factor authentication enabled successfully' };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body() dto: Verify2FADto,
  ): Promise<MessageResponseDto> {
    await this.authService.disable2FA(userId, dto.code);
    return { message: 'Two-factor authentication disabled successfully' };
  }
}
