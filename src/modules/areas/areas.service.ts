import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicAreas() {
    return this.prisma.area.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.area.findUnique({
      where: { id },
    });

    if (!area) {
      throw new NotFoundException('Área no encontrada.');
    }

    return area;
  }

  async findAdminAreas() {
    return this.prisma.area.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAreaDto) {
    return this.prisma.area.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateAreaDto) {
    await this.findOne(id);

    return this.prisma.area.update({
      where: { id },
      data: dto,
    });
  }

  async toggleStatus(id: string) {
    const area = await this.findOne(id);

    return this.prisma.area.update({
      where: { id },
      data: {
        isActive: !area.isActive,
      },
    });
  }
}