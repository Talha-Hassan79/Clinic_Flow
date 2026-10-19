import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding ClinicFlow roles and permissions...');

  const roles = [
    { name: 'Super Admin', description: 'Full platform administration access' },
    { name: 'Clinic Owner', description: 'Full administrative access to clinic workspace' },
    { name: 'Doctor', description: 'Access to appointments, medical records, and prescriptions' },
    { name: 'Pathologist', description: 'Access to laboratory verification, test sign-off, and diagnostic reports' },
    { name: 'Lab Technician', description: 'Access to sample collection, diagnostic queue, and test parameter entries' },
    { name: 'Receptionist', description: 'Access to patient registration, scheduling, and invoicing' },
    { name: 'Nurse', description: 'Access to patient vitals and record preparation' },
    { name: 'Accountant', description: 'Access to billing, invoices, payments, and financial reports' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const permissions = [
    { name: 'patient.read', description: 'View patient records' },
    { name: 'patient.create', description: 'Register new patient' },
    { name: 'patient.update', description: 'Edit patient profiles' },
    { name: 'patient.delete', description: 'Soft delete patient' },
    { name: 'appointment.read', description: 'View appointments' },
    { name: 'appointment.create', description: 'Book appointments' },
    { name: 'appointment.update', description: 'Reschedule/Status change' },
    { name: 'prescription.create', description: 'Generate prescription' },
    { name: 'billing.read', description: 'View invoices and payments' },
    { name: 'billing.manage', description: 'Create and update invoices' },
    { name: 'reports.view', description: 'Access analytics reports' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
