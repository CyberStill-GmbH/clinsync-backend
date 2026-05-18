import { IsString, MinLength } from 'class-validator';

export class CancelAppointmentDto {
  @IsString()
  @MinLength(5)
  cancellationReason: string;
}