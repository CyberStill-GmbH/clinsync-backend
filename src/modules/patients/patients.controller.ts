import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(UserRole.PATIENT)
  @Get('patients/me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.patientsService.getMe(user.id);
  }

  @Roles(UserRole.PATIENT)
  @Patch('patients/me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdatePatientDto) {
    return this.patientsService.updateMe(user.id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/patients')
  getAdminPatients() {
    return this.patientsService.getAdminPatients();
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/patients/:id')
  getAdminPatientDetail(@Param('id') id: string) {
    return this.patientsService.getAdminPatientDetail(id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/patients/:id/appointments')
  getAdminPatientAppointments(@Param('id') id: string) {
    return this.patientsService.getAdminPatientAppointments(id);
  }
}