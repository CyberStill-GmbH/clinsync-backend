import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import { AppointmentsService } from './appointments.service';
import { AttendanceDto } from './dto/attendance.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.PATIENT)
  @Post('appointments')
  createAppointment(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.createAppointment(user, dto);
  }

  @Roles(UserRole.PATIENT)
  @Get('appointments/me')
  getMyAppointments(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getMyAppointments(user);
  }

  @Roles(UserRole.PATIENT)
  @Get('appointments/me/:id')
  getMyAppointmentDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.getMyAppointmentDetail(user, id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/appointments')
  getAdminAppointments(
    @Query('status') status?: AppointmentStatus,
    @Query('areaId') areaId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getAdminAppointments({
      status,
      areaId,
      date,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/appointments/:id')
  getAdminAppointmentDetail(@Param('id') id: string) {
    return this.appointmentsService.getAdminAppointmentDetail(id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/appointments/:id/validate')
  validateAppointment(@Param('id') id: string) {
    return this.appointmentsService.validateAppointment(id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/appointments/:id/reschedule')
  rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/appointments/:id/cancel')
  cancelAppointment(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancelAppointment(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/appointments/:id/attendance')
  updateAttendance(@Param('id') id: string, @Body() dto: AttendanceDto) {
    return this.appointmentsService.updateAttendance(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/appointments/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto);
  }
}