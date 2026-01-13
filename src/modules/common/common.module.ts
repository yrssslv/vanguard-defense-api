import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityService } from './services/security.service';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SecurityService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.getOrThrow('REDIS_URL'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [SecurityService, 'REDIS_CLIENT'],
})
export class CommonModule {}
