import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SkillForgeGateway } from './skillforge.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [SkillForgeGateway],
  exports: [SkillForgeGateway],
})
export class WebsocketModule {}
