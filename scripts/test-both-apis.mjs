import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  });
}

console.log('Testing recipient APIs...\n');

// Test 1: Single recipient
async function testSingleRecipient() {
  console.log('Test 1: Adding single recipient');
  try {
    const response = await fetch('http://localhost:3000/api/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'single.test@gmail.com',
        firstName: 'Single',
        lastName: 'Test'
      })
    });

    const data = await response.json();
    console.log('✓ Response:', JSON.stringify(data, null, 2));
    return data.ok;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    return false;
  }
}

// Test 2: CSV import
async function testCSVImport() {
  console.log('\nTest 2: CSV bulk import');
  try {
    const csvContent = fs.readFileSync('recipients.csv', 'utf8');
    
    const response = await fetch('http://localhost:3000/api/recipients/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvContent
    });

    const data = await response.json();
    console.log('✓ Response:', JSON.stringify(data, null, 2));
    return data.ok > 0;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    return false;
  }
}

async function runTests() {
  const test1 = await testSingleRecipient();
  const test2 = await testCSVImport();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log(`Single recipient: ${test1 ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`CSV import: ${test2 ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(50));
}

runTests().catch(console.error);
