import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiHeader({
    name: 'x-idempotency-key',
    description: 'Unique key for idempotency',
    required: false,
  })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
