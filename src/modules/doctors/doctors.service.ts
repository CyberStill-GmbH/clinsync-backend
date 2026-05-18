import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicDoctors(areaId?: string) {
    return this.prisma.doctor.findMany({
      where: {
        isActive: true,
        ...(areaId ? { areaId } : {}),
      },
      include: { area: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findAdminDoctors() {
    return this.prisma.doctor.findMany({
      include: { area: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { area: true },
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado.');
    }

    return doctor;
  }

  async create(dto: CreateDoctorDto) {
    return this.prisma.doctor.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
    });
  }

  async toggleStatus(id: string) {
    const doctor = await this.findOne(id);

    return this.prisma.doctor.update({
      where: { id },
      data: {
        isActive: !doctor.isActive,
      },
    });
  }
}