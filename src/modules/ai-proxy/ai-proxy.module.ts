import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProxyController } from './ai-proxy.controller';
import { AiProxyService } from './ai-proxy.service';
import { AiRequestLog } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([AiRequestLog])],
  controllers: [AiProxyController],
  providers: [AiProxyService],
  exports: [AiProxyService],
})
export class AiProxyModule {}
