import { Injectable, NotFoundException } from '@nestjs/common';
import { ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByArea(areaId: string, date?: string) {
    return this.prisma.schedule.findMany({
      where: {
        areaId,
        status: ScheduleStatus.AVAILABLE,
        ...(date ? { date: new Date(date) } : {}),
      },
      include: {
        area: true,
        doctor: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getAvailable(filters: { areaId?: string; doctorId?: string; date?: string }) {
    return this.prisma.schedule.findMany({
      where: {
        status: ScheduleStatus.AVAILABLE,
        ...(filters.areaId ? { areaId: filters.areaId } : {}),
        ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(filters.date ? { date: new Date(filters.date) } : {}),
      },
      include: {
        area: true,
        doctor: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getAdminSchedules() {
    return this.prisma.schedule.findMany({
      include: {
        area: true,
        doctor: true,
        appointments: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        area: true,
        doctor: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Horario no encontrado.');
    }

    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    return this.prisma.schedule.create({
      data: {
        areaId: dto.areaId,
        doctorId: dto.doctorId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);

    return this.prisma.schedule.update({
      where: { id },
      data: {
        areaId: dto.areaId,
        doctorId: dto.doctorId,
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status,
      },
    });
  }

  async toggleStatus(id: string) {
    const schedule = await this.findOne(id);

    const newStatus =
      schedule.status === ScheduleStatus.INACTIVE
        ? ScheduleStatus.AVAILABLE
        : ScheduleStatus.INACTIVE;

    return this.prisma.schedule.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}