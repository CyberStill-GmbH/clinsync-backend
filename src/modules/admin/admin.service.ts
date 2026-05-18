import { Injectable } from '@nestjs/common';
import { AppointmentStatus, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      todayAppointments,
      pendingAppointments,
      validatedAppointments,
      noShowAppointments,
      availableSchedules,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          schedule: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      }),

      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.PENDING,
        },
      }),

      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.VALIDATED_BY_RECEPTION,
        },
      }),

      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.NO_SHOW,
        },
      }),

      this.prisma.schedule.count({
        where: {
          status: ScheduleStatus.AVAILABLE,
        },
      }),
    ]);

    return {
      todayAppointments,
      pendingAppointments,
      validatedAppointments,
      noShowAppointments,
      availableSchedules,
    };
  }
}