import { Test, type TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import axios from 'axios';
import { BadRequestException } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully send a webhook without secret', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    await service.sendAlert(
      'https://example.com/webhook',
      undefined,
      'Netflix',
      3,
      15.99,
      'USD',
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        subscriptionName: 'Netflix',
        daysBefore: 3,
        amount: 15.99,
        currency: 'USD',
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('should successfully send a webhook with secret and signature header', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
    const secret = 'my-secret';

    await service.sendAlert(
      'https://example.com/webhook',
      secret,
      'Spotify',
      1,
      9.99,
      'EUR',
    );

    expect(mockedAxios.post).toHaveBeenCalled();
    const headers = mockedAxios.post.mock.calls[0][2]?.headers as any;
    expect(headers['X-Webhook-Signature']).toBeDefined();
    expect(headers['X-Webhook-Signature']).toHaveLength(64); // SHA256 hex
  });

  it('should throw BadRequestException for invalid URL', async () => {
    await expect(
      service.sendAlert('not-a-url', undefined, 'Test', 1, 1, 'USD'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for local URLs (SSRF protection)', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    await expect(
      service.sendAlert('http://localhost:3000/callback', undefined, 'Test', 1, 1, 'USD'),
    ).rejects.toThrow('Webhook URL points to an internal network');

    await expect(
      service.sendAlert('http://127.0.0.1/callback', undefined, 'Test', 1, 1, 'USD'),
    ).rejects.toThrow('Webhook URL points to an internal network');

    await expect(
      service.sendAlert('http://192.168.1.1/callback', undefined, 'Test', 1, 1, 'USD'),
    ).rejects.toThrow('Webhook URL points to an internal network');

    process.env.NODE_ENV = prevEnv;
  });

  it('should throw error if axios fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    await expect(
      service.sendAlert('https://example.com/webhook', undefined, 'Test', 1, 1, 'USD'),
    ).rejects.toThrow('Network Error');
  });
});
