import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Controller()
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get('areas')
  findPublicAreas() {
    return this.areasService.findPublicAreas();
  }

  @Get('areas/:id')
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('admin/areas')
  findAdminAreas() {
    return this.areasService.findAdminAreas();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post('admin/areas')
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/areas/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Patch('admin/areas/:id/status')
  toggleStatus(@Param('id') id: string) {
    return this.areasService.toggleStatus(id);
  }
}