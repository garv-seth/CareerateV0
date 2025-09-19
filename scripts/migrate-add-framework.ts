import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

async function main() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('DATABASE_URL is not set');
      process.exit(1);
    }
    neonConfig.webSocketConstructor = ws as unknown as any;
    const pool = new Pool({ connectionString: url });

    // Add framework column if missing
    const alterSql = "ALTER TABLE projects ADD COLUMN IF NOT EXISTS framework text NOT NULL DEFAULT 'react'";
    await pool.query(alterSql);

    // Verify
    const check = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='framework'`);
    if (check.rowCount) {
      console.log('OK: projects.framework present');
      process.exit(0);
    } else {
      console.error('FAILED: projects.framework still missing');
      process.exit(2);
    }
  } catch (err: any) {
    console.error('Migration error:', err?.message || err);
    process.exit(1);
  }
}

main();


