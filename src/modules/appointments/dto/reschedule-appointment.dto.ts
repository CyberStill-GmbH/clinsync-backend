import { IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  newScheduleId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  internalNote?: string;
}