import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('areas/:id/schedules')
  getByArea(@Param('id') id: string, @Query('date') date?: string) {
    return this.schedulesService.getByArea(id, date);
  }

  @Get('schedules/available')
  getAvailable(
    @Query('areaId') areaId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.schedulesService.getAvailable({ areaId, doctorId, date });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/schedules')
  getAdminSchedules() {
    return this.schedulesService.getAdminSchedules();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post('admin/schedules')
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/schedules/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/schedules/:id/status')
  toggleStatus(@Param('id') id: string) {
    return this.schedulesService.toggleStatus(id);
  }
}