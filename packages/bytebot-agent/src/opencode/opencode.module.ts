import { Module } from '@nestjs/common';
import { OpenCodeService } from './opencode.service';
import { OpenCodeController } from './opencode.controller';

@Module({
  controllers: [OpenCodeController],
  providers: [OpenCodeService],
  exports: [OpenCodeService],
})
export class OpenCodeModule {}
