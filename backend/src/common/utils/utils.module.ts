import { Module, Global } from '@nestjs/common';
import { HashService } from './hash.service';
import { TimezoneService } from './timezone.service';

@Global()
@Module({
  providers: [HashService, TimezoneService],
  exports: [HashService, TimezoneService],
})
export class UtilsModule {}
