import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAICompatibleService } from './openai-compatible.service';

@Module({
  imports: [ConfigModule],
  providers: [OpenAICompatibleService],
  exports: [OpenAICompatibleService],
})
export class OpenAICompatibleModule {}
