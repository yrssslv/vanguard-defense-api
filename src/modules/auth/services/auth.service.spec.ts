import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityService } from '../../common/services/security.service';
import { SignupDto } from '../dto/signup.dto';
import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let security: SecurityService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockSecurity = {
    hash: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    security = module.get<SecurityService>(SecurityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const dto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
      unitName: 'Alpha',
    };

    it('should successfully create a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockSecurity.hash.mockResolvedValue('hashedPassword');
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
      expect(result).not.toHaveProperty('password');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(security.hash).toHaveBeenCalledWith(dto.password);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
      });

      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
