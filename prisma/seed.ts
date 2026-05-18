import 'dotenv/config';
import { PrismaClient, UserRole, ScheduleStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('12345678', 10);

  // 1. Create Admins and Receptionists
  console.log('Seeding users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinsync.com' },
    update: { passwordHash },
    create: {
      email: 'admin@clinsync.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'recepcion@clinsync.com' },
    update: { passwordHash },
    create: {
      email: 'recepcion@clinsync.com',
      passwordHash,
      role: UserRole.RECEPTIONIST,
    },
  });

  // 2. Create Patient User & Patient Profile
  const patientUser = await prisma.user.upsert({
    where: { email: 'paciente@test.com' },
    update: { passwordHash },
    create: {
      email: 'paciente@test.com',
      passwordHash,
      role: UserRole.PATIENT,
    },
  });

  await prisma.patient.upsert({
    where: { dni: '12345678' },
    update: {
      userId: patientUser.id,
      phone: '987654321',
    },
    create: {
      userId: patientUser.id,
      firstName: 'Paciente',
      lastName: 'Prueba',
      dni: '12345678',
      phone: '987654321',
      birthDate: new Date('1990-01-01'),
      gender: 'MASCULINO',
      address: 'Av. Siempreviva 742',
      district: 'Lima',
    },
  });

  // 3. Create Areas
  console.log('Seeding areas...');
  const areaGral = await prisma.area.upsert({
    where: { id: 'area-medicina-general' },
    update: { name: 'Medicina General' },
    create: {
      id: 'area-medicina-general',
      name: 'Medicina General',
      description: 'Atención primaria y medicina familiar.',
    },
  });

  const areaCardio = await prisma.area.upsert({
    where: { id: 'area-cardiologia' },
    update: { name: 'Cardiología' },
    create: {
      id: 'area-cardiologia',
      name: 'Cardiología',
      description: 'Salud cardiovascular y prevención.',
    },
  });

  const areaPedia = await prisma.area.upsert({
    where: { id: 'area-pediatria' },
    update: { name: 'Pediatría' },
    create: {
      id: 'area-pediatria',
      name: 'Pediatría',
      description: 'Cuidado de la salud infantil.',
    },
  });

  // 4. Create Doctors
  console.log('Seeding doctors...');
  const docTorres = await prisma.doctor.upsert({
    where: { id: 'doc-andrea-torres' },
    update: { areaId: areaGral.id },
    create: {
      id: 'doc-andrea-torres',
      areaId: areaGral.id,
      fullName: 'Dra. Andrea Torres',
      documentNumber: '44556677',
      phone: '911111111',
      email: 'andrea.torres@clinsync.com',
    },
  });

  const docSoto = await prisma.doctor.upsert({
    where: { id: 'doc-carlos-soto' },
    update: { areaId: areaCardio.id },
    create: {
      id: 'doc-carlos-soto',
      areaId: areaCardio.id,
      fullName: 'Dr. Carlos Soto',
      documentNumber: '88776655',
      phone: '922222222',
      email: 'carlos.soto@clinsync.com',
    },
  });

  const docRios = await prisma.doctor.upsert({
    where: { id: 'doc-elena-rios' },
    update: { areaId: areaPedia.id },
    create: {
      id: 'doc-elena-rios',
      areaId: areaPedia.id,
      fullName: 'Dra. Elena Ríos',
      documentNumber: '33221144',
      phone: '933333333',
      email: 'elena.rios@clinsync.com',
    },
  });

  // 5. Create Schedules (AVAILABLE)
  console.log('Seeding schedules...');
  const scheduleDate1 = new Date('2026-05-20');
  const scheduleDate2 = new Date('2026-05-21');

  await prisma.schedule.upsert({
    where: { id: 'sch-torres-1' },
    update: { status: ScheduleStatus.AVAILABLE },
    create: {
      id: 'sch-torres-1',
      areaId: areaGral.id,
      doctorId: docTorres.id,
      date: scheduleDate1,
      startTime: '08:00',
      endTime: '08:30',
      status: ScheduleStatus.AVAILABLE,
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'sch-soto-1' },
    update: { status: ScheduleStatus.AVAILABLE },
    create: {
      id: 'sch-soto-1',
      areaId: areaCardio.id,
      doctorId: docSoto.id,
      date: scheduleDate1,
      startTime: '09:00',
      endTime: '09:30',
      status: ScheduleStatus.AVAILABLE,
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'sch-rios-1' },
    update: { status: ScheduleStatus.AVAILABLE },
    create: {
      id: 'sch-rios-1',
      areaId: areaPedia.id,
      doctorId: docRios.id,
      date: scheduleDate2,
      startTime: '10:00',
      endTime: '10:30',
      status: ScheduleStatus.AVAILABLE,
    },
  });

  console.log('Seed ejecutado correctamente con datos idempotentes.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });