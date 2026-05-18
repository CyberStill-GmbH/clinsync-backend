import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return {
      ...patient,
      email: patient.user.email,
    };
  }

  async updateMe(userId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return this.prisma.patient.update({
      where: { userId },
      data: dto,
    });
  }

  async getAdminPatients() {
    return this.prisma.patient.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
        appointments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAdminPatientDetail(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        appointments: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return patient;
  }

  async getAdminPatientAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
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
}