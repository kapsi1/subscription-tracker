import { PrismaClient, BillingCycle, AlertType } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Start seeding...');
  
  const existingUser = await prisma.user.findFirst({
    where: { email: 'dev@example.com' },
  });

  if (existingUser) {
    console.log('Seed data already exists');
    return;
  }

  // we use a simple hash placeholder for local dev, actual hashing via bcrypt is handled on registration
  const user = await prisma.user.create({
    data: {
      email: 'dev@example.com',
      passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXX', 
      subscriptions: {
        create: [
          {
            name: 'Netflix',
            amount: 15.99,
            currency: 'USD',
            billingCycle: BillingCycle.monthly,
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            category: 'Entertainment',
            alerts: {
              create: [
                {
                  type: AlertType.email,
                  daysBefore: 3,
                },
              ],
            },
          },
          {
            name: 'AWS',
            amount: 50.00,
            currency: 'USD',
            billingCycle: BillingCycle.custom,
            intervalDays: 30,
            nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            category: 'Cloud',
          },
        ],
      },
    },
  });

  console.log('Seeding finished successfully. Dev user created:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
