import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth & Subscriptions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    prisma = app.get(PrismaService);

    // Clean DB before logic
    await prisma.alert.deleteMany();
    await prisma.paymentHistory.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'e2e@example.com', password: 'password123' });
    if (res.status === 500) console.log(res.body);
    expect(res.status).toBe(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('/auth/login (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    jwtToken = res.body.accessToken;
  });

  it('/subscriptions (GET) - unauthorized', () => {
    return request(app.getHttpServer()).get('/subscriptions').expect(401);
  });

  it('/subscriptions (POST) - authorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/subscriptions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        billingCycle: 'monthly',
        category: 'Music',
      })
      .expect(201);

    expect(res.body.name).toBe('Spotify');
    expect(res.body.id).toBeDefined();
  });

  it('/subscriptions (GET) - authorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/subscriptions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Spotify');
  });
});
