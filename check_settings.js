const { Client } = require('pg');

const connectionString = 'postgresql://postgres:FilterCoffee@123@db.fqryrrlzajzagixmirpw.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected.');

    const res = await client.query(`
      SELECT name, setting FROM pg_settings WHERE name LIKE '%password%' OR name LIKE '%auth%';
    `);
    console.log('--- SETTINGS ---');
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
