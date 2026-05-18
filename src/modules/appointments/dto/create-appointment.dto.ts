import { IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  areaId: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  scheduleId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}