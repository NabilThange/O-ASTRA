import { Module, forwardRef } from '@nestjs/common';
import { OpenCodeService } from './opencode.service';
import { OpenCodeController } from './opencode.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [OpenCodeController],
  providers: [OpenCodeService],
  exports: [OpenCodeService],
})
export class OpenCodeModule {}
