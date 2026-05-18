import { Injectable, NotFoundException } from '@nestjs/common';
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
      totalPatients,
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
        where: { status: AppointmentStatus.PENDING },
      }),

      this.prisma.appointment.count({
        where: { status: AppointmentStatus.VALIDATED_BY_RECEPTION },
      }),

      this.prisma.appointment.count({
        where: { status: AppointmentStatus.NO_SHOW },
      }),

      this.prisma.schedule.count({
        where: { status: ScheduleStatus.AVAILABLE },
      }),

      this.prisma.patient.count(),
    ]);

    return {
      todayAppointments,
      pendingAppointments,
      validatedAppointments,
      noShowAppointments,
      availableSchedules,
      totalPatients,
    };
  }

  async getPatients(params: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' as const } },
            { lastName: { contains: params.search, mode: 'insensitive' as const } },
            { dni: { contains: params.search, mode: 'insensitive' as const } },
            { phone: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dni: true,
          phone: true,
          gender: true,
          district: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientDetail(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        district: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return patient;
  }

  async getPatientAppointments(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        area: true,
        doctor: true,
        schedule: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}