import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('User fields:', Object.keys((prisma as any).user.fields || {}));
console.log('Subscription fields:', Object.keys((prisma as any).subscription.fields || {}));
console.log('Alert fields:', Object.keys((prisma as any).alert.fields || {}));
process.exit(0);
