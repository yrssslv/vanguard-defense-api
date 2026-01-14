import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityService } from '../../common/services/security.service';
import { SignupDto } from '../dto/signup.dto';
import { Role, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<import('@prisma/client').User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await this.securityService.compare(user.password, pass))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: { id: string; email: string; role: Role }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    
    this.logger.log(`User logged in: ${user.email}`);
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: refreshExpiration } as any),
    };
  }

  async signup(dto: SignupDto) {
    const hashedPassword = await this.securityService.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          unitName: dto.unitName,
          role: Role.VIEWER,
        },
      });

      const { password, ...result } = user;
      this.logger.log(`User registered: ${user.email}`);
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`Signup failed: Email ${dto.email} already in use`);
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }
}
