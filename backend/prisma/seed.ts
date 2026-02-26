import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const provider1 = await prisma.user.upsert({
    where: { email: 'provider1@test.com' },
    update: {},
    create: { email: 'provider1@test.com', password, role: UserRole.PROVIDER },
  });

  await prisma.providerProfile.upsert({
    where: { userId: provider1.id },
    update: {},
    create: { userId: provider1.id, companyName: 'Arena Sport Center' },
  });

  const venue = await prisma.venue.create({
    data: {
      providerId: provider1.id,
      category: 'SPORT',
      name: 'Arena Sport Center',
      city: 'Belgrade',
      address: 'Dorcol 12',
      units: {
        create: [
          { name: 'Court #1', unitType: 'COURT', capacity: 4 },
          { name: 'Court #2', unitType: 'COURT', capacity: 4 },
        ],
      },
      offerings: {
        create: [
          { name: 'Court 60 min', durationMin: 60, price: 20 },
          { name: 'Court 90 min', durationMin: 90, price: 28 },
        ],
      },
    },
  });

  console.log('Seeded venue:', venue.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
