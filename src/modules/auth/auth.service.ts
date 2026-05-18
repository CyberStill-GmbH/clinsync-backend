import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerPatient(dto: RegisterPatientDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const existingDni = await this.prisma.patient.findUnique({
      where: { dni: dto.dni },
    });

    if (existingDni) {
      throw new ConflictException('El DNI ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: UserRole.PATIENT,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dni: dto.dni,
          phone: dto.phone,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
          gender: dto.gender,
          address: dto.address,
          district: dto.district,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
        },
      });

      return { user, patient };
    });

    return this.buildAuthResponse(
      result.user.id,
      result.user.email,
      result.user.role,
      result.patient.firstName,
      result.patient.lastName,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { patient: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
      user.patient?.firstName,
      user.patient?.lastName,
    );
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        patient: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.patient
        ? `${user.patient.firstName} ${user.patient.lastName}`.trim()
        : user.email.split('@')[0],
      patient: user.patient,
    };
  }

  async logout() {
    return {
      message: 'Sesión cerrada correctamente.',
    };
  }

  private buildAuthResponse(
    id: string,
    email: string,
    role: UserRole,
    firstName?: string | null,
    lastName?: string | null,
  ) {
    const name =
      firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName ?? email.split('@')[0];

    const token = this.jwtService.sign({
      sub: id,
      email,
      role,
    });

    return {
      token,
      user: {
        id,
        email,
        role,
        name,
      },
    };
  }
}