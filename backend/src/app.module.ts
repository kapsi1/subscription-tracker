import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { BullModule } from '@nestjs/bullmq';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AlertsModule } from './alerts/alerts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // using the root .env or overriding it if needed
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        // Re-use X-Request-Id set by the RequestIdMiddleware, or generate one.
        genReqId: (req: IncomingMessage) =>
          ((req as unknown as Record<string, unknown>).id as string) ?? randomUUID(),

        // Attach request ID to every log line under the `requestId` key.
        customProps: (req: IncomingMessage) => ({
          requestId: (req as unknown as Record<string, unknown>).id as string | undefined,
        }),

        // Redact sensitive headers from logged requests.
        redact: ['req.headers.authorization', 'req.headers.cookie'],

        // Avoid noisy request logs for successful responses.
        // Keep warnings/errors for failed requests only.
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) {
            return 'error';
          }
          if (res.statusCode >= 400) {
            return 'warn';
          }
          return 'silent';
        },

        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    DashboardModule,
    AlertsModule,
    NotificationsModule,
    HealthModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
