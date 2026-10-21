import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    fetchMock.mockResolvedValue(
      new Response('client home', {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-upstream-service': 'client',
        },
      }),
    );

    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('x-upstream-service', 'client')
      .expect('client home');
  });

  it('/client/* (GET)', () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ source: 'client' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    return request(app.getHttpServer())
      .get('/client/orders?status=open')
      .expect(200)
      .expect({ source: 'client' })
      .then(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:3001/orders?status=open',
          expect.objectContaining({
            method: 'GET',
            redirect: 'manual',
          }),
        );
      });
  });

  it('/audit/* (GET)', () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ source: 'audit' }), {
        status: 201,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    return request(app.getHttpServer())
      .get('/audit/logs/42')
      .expect(201)
      .expect({ source: 'audit' })
      .then(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:3002/logs/42',
          expect.objectContaining({
            method: 'GET',
            redirect: 'manual',
          }),
        );
      });
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllGlobals();
  });
});
