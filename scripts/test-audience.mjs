import { prisma } from '@/lib/prisma';
import { getAudienceAll } from '@/lib/audience.any';

async function test() {
  console.log('Testing audience.any.ts...\n');
  
  try {
    const audience = await getAudienceAll();
    console.log(`✓ Found ${audience.length} total recipients`);
    console.log('\nSample recipients:');
    audience.slice(0, 3).forEach(r => {
      console.log(`  - ${r.email} (${r.data.firstName} ${r.data.lastName})`);
    });
  } catch (error) {
    console.error('✗ Error:', error);
  }
  
  await prisma.$disconnect();
}

test();
