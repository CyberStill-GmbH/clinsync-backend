import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  areaId: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}