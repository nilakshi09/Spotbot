import { db } from './client.js';
import * as schema from './schema/index.js';
import bcrypt from 'bcrypt';

async function main() {
  try {
    const passwordHash = await bcrypt.hash('Password123', 12);

    const [org] = await db.insert(schema.organizations).values({
      name: 'Dev Workspace',
      plan: 'free',
    }).returning();

    await db.insert(schema.users).values([
      {
        organizationId: org.id,
        email: 'admin@spotbot.dev',
        name: 'Admin User',
        role: 'admin',
        passwordHash,
      },
      {
        organizationId: org.id,
        email: 'member@spotbot.dev',
        name: 'Member User',
        role: 'member',
        passwordHash,
      }
    ]);

    console.log('✅ Seeded database successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

main();
