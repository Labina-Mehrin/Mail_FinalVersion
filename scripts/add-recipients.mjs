import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recipients = [
  { email: 'mahin.abdullah4@gmail.com', firstName: 'Mahin', lastName: 'Abdullah' },
  { email: 'labina248@gmail.com', firstName: 'Labina', lastName: '' },
  { email: 'muhtasim.uranus@gmail.com', firstName: 'Muhtasim', lastName: 'Uranus' },
];

async function addRecipients() {
  for (const recipient of recipients) {
    try {
      const result = await prisma.recipient.upsert({
        where: { email: recipient.email },
        update: {},
        create: recipient,
      });
      console.log(`✓ Added/verified: ${result.email}`);
    } catch (error) {
      console.error(`✗ Failed to add ${recipient.email}:`, error);
    }
  }
  
  const total = await prisma.recipient.count();
  console.log(`\nTotal recipients: ${total}`);
}

addRecipients()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
