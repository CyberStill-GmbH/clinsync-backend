import 'dotenv/config';
import { PrismaClient, UserRole, ScheduleStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

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
  console.log('Seeding dynamic multi-day schedules...');
  const timeSlots = [
    { start: '08:00', end: '08:30' },
    { start: '09:00', end: '09:30' },
    { start: '10:00', end: '10:30' },
    { start: '11:00', end: '11:30' },
    { start: '14:00', end: '14:30' },
    { start: '15:00', end: '15:30' },
    { start: '16:00', end: '16:30' },
  ];

  const doctorsList = [
    { id: docTorres.id, areaId: areaGral.id, prefix: 'torres' },
    { id: docSoto.id, areaId: areaCardio.id, prefix: 'soto' },
    { id: docRios.id, areaId: areaPedia.id, prefix: 'rios' },
  ];

  // Seed for 12 days: from 2026-05-18 to 2026-05-29
  for (let dayOffset = 0; dayOffset < 12; dayOffset++) {
    const targetDate = new Date('2026-05-18');
    targetDate.setDate(targetDate.getDate() + dayOffset);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    for (const doc of doctorsList) {
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const slot = timeSlots[slotIndex];
        const scheduleId = `sch-${doc.prefix}-${dateStr}-${slotIndex}`;

        await prisma.schedule.upsert({
          where: { id: scheduleId },
          update: { status: ScheduleStatus.AVAILABLE },
          create: {
            id: scheduleId,
            areaId: doc.areaId,
            doctorId: doc.id,
            date: new Date(dateStr),
            startTime: slot.start,
            endTime: slot.end,
            status: ScheduleStatus.AVAILABLE,
          },
        });
      }
    }
  }

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