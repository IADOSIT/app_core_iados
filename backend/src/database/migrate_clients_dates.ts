import { query } from '../config/database';

async function migrate() {
  console.log('Running clients date fields migration...');
  await query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_cutoff_day INTEGER CHECK (payment_cutoff_day BETWEEN 1 AND 31)`);
  await query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS formal_start_date DATE`);
  await query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS demo_start_date DATE`);
  await query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS demo_end_date DATE`);
  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => { console.error(err); process.exit(1); });
