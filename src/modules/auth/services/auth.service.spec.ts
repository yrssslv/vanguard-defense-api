import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityService } from '../../common/services/security.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from '../dto/signup.dto';
import { ConflictException } from '@nestjs/common';
import { Role, Prisma } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let security: SecurityService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockSecurity = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SecurityService,
          useValue: mockSecurity,
        },
        {
          provide: JwtService,
          useValue: mockJwt,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    security = module.get<SecurityService>(SecurityService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashedPassword' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockSecurity.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if password invalid', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashedPassword' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockSecurity.compare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = { email: 'test@example.com', id: '1', role: Role.VIEWER };
      mockJwt.sign.mockReturnValue('token');

      const result = await service.login(user);
      expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
    });
  });

  describe('signup', () => {
    const dto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
      unitName: 'Alpha',
    };

    it('should successfully create a user', async () => {
      mockSecurity.hash.mockResolvedValue('hashedPassword'); // findUnique was removed
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        ...dto,
        password: 'hashedPassword',
        role: Role.VIEWER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup(dto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(dto.email);
      // findUnique was removed from expectations
      expect(security.hash).toHaveBeenCalledWith(dto.password);
    });

    it('should throw ConflictException if email exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' } as any,
      );
      mockPrisma.user.create.mockRejectedValue(error);
      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
    });
  });
});
