import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should throw ForbiddenException if user does not exist', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: null,
    });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: {},
    });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: Role.VIEWER },
    });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
  });

  it('should allow access if user role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: Role.ADMIN },
    });

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });
});
