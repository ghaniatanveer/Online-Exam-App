import { connectDB } from '../config/db.js';
import { populateDemoData } from './seedData.js';

async function main() {
  await connectDB();
  await populateDemoData(true);
  console.log('Seed completed!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
