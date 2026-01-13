import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import Redis from 'ioredis';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let redis: jest.Mocked<Redis>;

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  } as unknown as CallHandler;

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    interceptor = new IdempotencyInterceptor(redis);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should return cached response if key exists', async () => {
    const key = 'test-key';
    const cachedData = { key: 'value' };

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      headers: { 'x-idempotency-key': key },
    });

    redis.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);
    
    result.subscribe((data) => {
      expect(data).toEqual(cachedData);
    });

    expect(redis.get).toHaveBeenCalledWith(`idempotency:${key}`);
    expect(mockCallHandler.handle).not.toHaveBeenCalled();
  });

  it('should call next.handle() and cache response if key does not exist', async () => {
    const key = 'test-key-2';
    const responseData = { id: 1 };

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      headers: { 'x-idempotency-key': key },
    });

    redis.get.mockResolvedValue(null);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

    const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe((data) => {
      expect(data).toEqual(responseData);
      expect(redis.set).toHaveBeenCalledWith(
        `idempotency:${key}`,
        JSON.stringify(responseData),
        'EX',
        24 * 60 * 60
      );
    });

    expect(redis.get).toHaveBeenCalledWith(`idempotency:${key}`);
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should skip idempotency if header is missing', async () => {
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      headers: {},
    });

    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

    await interceptor.intercept(mockExecutionContext, mockCallHandler);

    expect(redis.get).not.toHaveBeenCalled();
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });
});
