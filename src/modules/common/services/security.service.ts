import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class SecurityService {
  constructor(private readonly configService: ConfigService) {}

  async hash(data: string): Promise<string> {
    const memoryCost = this.configService.get<number>(
      'ARGON2_MEMORY_COST',
      65536,
    );
    const timeCost = this.configService.get<number>('ARGON2_TIME_COST', 3);
    const parallelism = this.configService.get<number>('ARGON2_PARALLELISM', 4);

    return argon2.hash(data, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
    });
  }

  async compare(storedHash: string, suppliedData: string): Promise<boolean> {
    return argon2.verify(storedHash, suppliedData);
  }
}
