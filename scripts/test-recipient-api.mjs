import fs from 'fs';
import path from 'path';

// Load .env manually
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

async function testRecipientAPI() {
  const response = await fetch('http://localhost:3000/api/recipients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test.new@gmail.com',
      firstName: 'Test',
      lastName: 'New'
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testRecipientAPI().catch(console.error);
