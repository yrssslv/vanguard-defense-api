import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return payload', async () => {
    const payload = { sub: '1', email: 'test@example.com', role: 'VIEWER' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      userId: '1',
      email: 'test@example.com',
      role: 'VIEWER',
    });
  });

  it('should throw UnauthorizedException if invalid payload', async () => {
    await expect(strategy.validate({} as any)).rejects.toThrow(UnauthorizedException);
  });
});
