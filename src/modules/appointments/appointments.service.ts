import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, ScheduleStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AttendanceDto } from './dto/attendance.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(user: AuthUser, dto: CreateAppointmentDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });

    if (!patient) {
      throw new ForbiddenException('Solo pacientes pueden crear citas.');
    }

    const code = `CITA-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.schedule.updateMany({
        where: {
          id: dto.scheduleId,
          status: ScheduleStatus.AVAILABLE,
        },
        data: {
          status: ScheduleStatus.OCCUPIED,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException('El horario seleccionado ya no está disponible.');
      }

      const appointment = await tx.appointment.create({
        data: {
          code,
          patientId: patient.id,
          areaId: dto.areaId,
          doctorId: dto.doctorId,
          scheduleId: dto.scheduleId,
          reason: dto.reason,
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          patient: true,
          area: true,
          doctor: true,
          schedule: true,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: appointment.id,
          action: 'CREATED_BY_PATIENT',
          newStatus: AppointmentStatus.CONFIRMED,
          note: 'Cita creada por el paciente.',
        },
      });

      return appointment;
    });
  }

  async getMyAppointments(user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });

    if (!patient) {
      throw new ForbiddenException('Paciente no encontrado.');
    }

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        area: true,
        doctor: true,
        schedule: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMyAppointmentDetail(user: AuthUser, appointmentId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });

    if (!patient) {
      throw new ForbiddenException('Paciente no encontrado.');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patient.id,
      },
      include: {
        area: true,
        doctor: true,
        schedule: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    return appointment;
  }

  async getAdminAppointments(filters: {
    status?: AppointmentStatus;
    areaId?: string;
    date?: string;
  }) {
    return this.prisma.appointment.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.areaId ? { areaId: filters.areaId } : {}),
        ...(filters.date ? { schedule: { date: new Date(filters.date) } } : {}),
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        area: true,
        doctor: true,
        schedule: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAdminAppointmentDetail(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        area: true,
        doctor: true,
        schedule: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada.');
    }

    return appointment;
  }

  async validateAppointment(id: string) {
    const appointment = await this.getAdminAppointmentDetail(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.VALIDATED_BY_RECEPTION,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: 'VALIDATED_BY_RECEPTION',
          previousStatus: appointment.status,
          newStatus: AppointmentStatus.VALIDATED_BY_RECEPTION,
          note: 'Cita validada por recepción.',
        },
      });

      return updated;
    });
  }

  async rescheduleAppointment(id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.getAdminAppointmentDetail(id);

    return this.prisma.$transaction(async (tx) => {
      const updatedNewSchedule = await tx.schedule.updateMany({
        where: {
          id: dto.newScheduleId,
          status: ScheduleStatus.AVAILABLE,
        },
        data: {
          status: ScheduleStatus.OCCUPIED,
        },
      });

      if (updatedNewSchedule.count === 0) {
        throw new ConflictException('El nuevo horario ya no está disponible.');
      }

      await tx.schedule.update({
        where: { id: appointment.scheduleId },
        data: { status: ScheduleStatus.AVAILABLE },
      });

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          scheduleId: dto.newScheduleId,
          status: AppointmentStatus.RESCHEDULED,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: 'RESCHEDULED',
          previousStatus: appointment.status,
          newStatus: AppointmentStatus.RESCHEDULED,
          note: dto.reason,
        },
      });

      return updated;
    });
  }

  async cancelAppointment(id: string, dto: CancelAppointmentDto) {
    const appointment = await this.getAdminAppointmentDetail(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.schedule.update({
        where: { id: appointment.scheduleId },
        data: { status: ScheduleStatus.AVAILABLE },
      });

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED_BY_RECEPTION,
          cancellationReason: dto.cancellationReason,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: 'CANCELLED_BY_RECEPTION',
          previousStatus: appointment.status,
          newStatus: AppointmentStatus.CANCELLED_BY_RECEPTION,
          note: dto.cancellationReason,
        },
      });

      return updated;
    });
  }

  async updateAttendance(id: string, dto: AttendanceDto) {
    if (
      dto.status !== AppointmentStatus.ATTENDED &&
      dto.status !== AppointmentStatus.NO_SHOW
    ) {
      throw new ConflictException('Estado de asistencia inválido.');
    }

    const appointment = await this.getAdminAppointmentDetail(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: 'ATTENDANCE_UPDATED',
          previousStatus: appointment.status,
          newStatus: dto.status,
          note: dto.observation,
        },
      });

      return updated;
    });
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.getAdminAppointmentDetail(id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    await this.prisma.appointmentHistory.create({
      data: {
        appointmentId: id,
        action: 'STATUS_UPDATED',
        previousStatus: appointment.status,
        newStatus: dto.status,
      },
    });

    return updated;
  }
}