import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp, createApp } from '../../src/app.factory';
import { AuthService } from '../../src/auth/auth.service';

test('health route stays on /api/auth/health', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue({
      health: () => ({ status: 'up' }),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  await request(app.getHttpServer())
    .get('/api/auth/health')
    .expect(200)
    .expect({ status: 'up' });

  await app.close();
});

test('login route preserves body and refresh cookie handling', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue({
      login: (_req: unknown, res: { cookie: (...args: unknown[]) => void; json: (value: unknown) => unknown }, body: { username: string }) => {
        res.cookie('refreshToken', 'refresh-token-value', { httpOnly: true, path: '/api/auth' });
        return res.json({ token: `${body.username}-token` });
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'Password1' })
    .expect(200);

  assert.deepEqual(response.body, { token: 'alice-token' });
  assert.match(String(response.headers['set-cookie']), /refreshToken=refresh-token-value/);

  await app.close();
});

test('allowed origins still get auth CORS headers and OPTIONS 204', async () => {
  const app = await createApp();
  await app.init();

  const response = await request(app.getHttpServer())
    .options('/api/auth/login')
    .set('Origin', 'http://localhost:4200')
    .expect(204);

  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:4200');
  assert.equal(response.headers['access-control-allow-credentials'], 'true');

  await app.close();
});