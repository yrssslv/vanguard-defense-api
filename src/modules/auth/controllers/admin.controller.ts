import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin statistics' })
  @ApiResponse({ status: 200, description: 'Return admin stats.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getStats() {
    return {
      users: 100,
      reports: 50,
      activeOperations: 5,
    };
  }
}
