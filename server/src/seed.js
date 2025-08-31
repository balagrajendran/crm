import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { sequelize, User, Company, Contact, Deal, Activity } from './models/index.js';

async function seed() {
  try {
    await sequelize.sync({ force: true });
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash, role: 'admin' });

    const acme = await Company.create({ name: 'Acme Corp', domain: 'acme.com', city: 'Riyadh', country: 'SA', ownerId: admin.id });
    const globex = await Company.create({ name: 'Globex LLC', domain: 'globex.com', city: 'Bangalore', country: 'IN', ownerId: admin.id });

    const john = await Contact.create({ firstName: 'John', lastName: 'Doe', email: 'john@acme.com', phone: '555-1000', CompanyId: acme.id });
    const jane = await Contact.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane@globex.com', phone: '555-2000', CompanyId: globex.id });

    const d1 = await Deal.create({ title: 'Website Revamp', amount: 12000, stage: 'proposal', CompanyId: acme.id, ContactId: john.id, ownerId: admin.id });
    const d2 = await Deal.create({ title: 'Cloud Migration', amount: 45000, stage: 'won', CompanyId: globex.id, ContactId: jane.id, ownerId: admin.id });

    await Activity.bulkCreate([
      { type: 'call', subject: 'Intro call with John', dueDate: new Date(), status: 'done', notes: 'Went well', CompanyId: acme.id, ContactId: john.id, DealId: d1.id, userId: admin.id },
      { type: 'meeting', subject: 'Kickoff with Globex', dueDate: new Date(Date.now()+86400000), status: 'todo', notes: 'Prepare slides', CompanyId: globex.id, ContactId: jane.id, DealId: d2.id, userId: admin.id },
    ]);

    console.log('Seed completed. Admin login: admin@example.com / admin123');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
