import { IsOptional, IsString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  areaId: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}