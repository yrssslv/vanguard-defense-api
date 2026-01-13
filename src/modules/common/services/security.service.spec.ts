import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('SecurityService', () => {
  let service: SecurityService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: unknown) => {
      if (key === 'ARGON2_MEMORY_COST') return 65536;
      if (key === 'ARGON2_TIME_COST') return 3;
      if (key === 'ARGON2_PARALLELISM') return 4;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should return a hash string', async () => {
      const password = 'securePassword123';
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should use configured argon2 parameters', async () => {
      const password = 'test';
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');

      await service.hash(password);

      expect(argon2.hash).toHaveBeenCalledWith(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    });
  });

  describe('compare', () => {
    it('should return true for valid password', async () => {
      const password = 'password123';
      const hash = 'hashed_password';
      (argon2.hash as jest.Mock).mockResolvedValue(hash);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.compare(hash, password);
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'password123';
      const hash = 'hashed_password';
      (argon2.hash as jest.Mock).mockResolvedValue(hash);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.compare(hash, 'wrongPassword');
      expect(result).toBe(false);
    });
  });
});
