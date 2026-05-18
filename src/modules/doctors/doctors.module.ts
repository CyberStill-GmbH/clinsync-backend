import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}