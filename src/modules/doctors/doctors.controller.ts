import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller()
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('doctors')
  findPublicDoctors(@Query('areaId') areaId?: string) {
    return this.doctorsService.findPublicDoctors(areaId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/doctors')
  findAdminDoctors() {
    return this.doctorsService.findAdminDoctors();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post('admin/doctors')
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/doctors/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/doctors/:id/status')
  toggleStatus(@Param('id') id: string) {
    return this.doctorsService.toggleStatus(id);
  }
}