import fs from 'fs';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const statements = [
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(255);',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;'
    ];
    
    for (const stmt of statements) {
      console.log('Executing:', stmt);
      await sql.unsafe(stmt);
    }
    console.log('Columns added successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await sql.end();
  }
}

main();
