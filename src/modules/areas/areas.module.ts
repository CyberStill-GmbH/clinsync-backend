import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}